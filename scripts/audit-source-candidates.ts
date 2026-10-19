import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseMarkdownSource } from "../lib/source-parsers";
import { jobIdentity } from "../lib/source-normalization";
import { semanticJobIdentity } from "../lib/job-dedup";
import { classifyRoleTags, ROLE_TAGS } from "../lib/role-areas";
import { getJobLocationMetadata } from "../lib/job-location-policy";
import { getFreshnessRejection } from "../lib/job-freshness";
import { isEarlyCareerTitle } from "../lib/ats-boards";
import { evaluateCompanyQuality, type VerifiedCompany, type CompanyTrustEntry } from "../lib/company-quality";
import type { JobsSnapshot } from "../lib/jobs";

// Read-only public-source research. Writes research artifacts, never board data.
const output = ".next/source-audit";
await mkdir(output, { recursive: true });
async function fetchPublic(url: string) {
  const response = await fetch(url, { headers: { "user-agent": "empluzzed-source-audit", accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(25_000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response;
}
const baseline: JobsSnapshot = await (await fetchPublic("https://empluzzed.fyi/jobs.json")).json();
await writeFile(`${output}/baseline.json`, JSON.stringify(baseline));
const registry: VerifiedCompany[] = JSON.parse(await readFile("data/verified-companies.json", "utf8"));
const trust: CompanyTrustEntry[] = JSON.parse(await readFile("data/company-trust.json", "utf8"));
const aggregatorHosts = new Set(["jobright.ai", "zapply.jobs", "trylitos.com", "www.dreamworkhq.com", "dreamworkhq.com", "applyguy.ai"]);
const ids = new Set(baseline.jobs.map(job => jobIdentity(job.applyUrl)));
const semanticIds = new Set(baseline.jobs.map(semanticJobIdentity));
const catalog = JSON.parse(await readFile("data/sources.json", "utf8"));
const candidates = [
  { repo: "zapplyjobs/Internships-2027", path: "README.md" },
  { repo: "mehek-builds/Hiring-Now", path: "lists/finance-internships.md" },
  { repo: "GodlyDonuts/keryx", path: "README.md" },
  { repo: "GodlyDonuts/keryx", path: "internships/summer-2027.md" },
  { repo: "GodlyDonuts/keryx", path: "new-grad/2027.md" },
  { repo: "jobright-ai/2026-Business-Analyst-Internship", path: "README.md" },
  { repo: "dreamworkhq/Tech-Internships-2027", path: "BUSINESS.md" },
];
const reports = [];
for (const { repo, path } of candidates) {
  try {
    const metadata = await (await fetchPublic(`https://api.github.com/repos/${repo}`)).json();
    const branch = metadata.default_branch;
    const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
    const markdown = await (await fetchPublic(rawUrl)).text();
    await writeFile(`${output}/${repo.replaceAll("/", "--")}--${path.replaceAll("/", "--")}`, markdown);
    let license = "not retrieved";
    let licenseUrl = null;
    try {
      const record = await (await fetchPublic(`https://api.github.com/repos/${repo}/license`)).json();
      license = record.license?.spdx_id ?? "unidentified";
      licenseUrl = record.html_url;
      await writeFile(`${output}/${repo.replaceAll("/", "--")}.LICENSE`, Buffer.from(record.content, "base64"));
    } catch (error) { license = String(error); }
    const rows = parseMarkdownSource(markdown, path.startsWith("new-grad/") ? `${repo} New grad` : `${repo} ${path}`);
    const unique = [...new Map(rows.map(row => [jobIdentity(row.applyUrl), row])).values()];
    const matches = unique.filter(row => {
      const families = classifyRoleTags(row).map(tag => ROLE_TAGS.find(role => role.value === tag)?.family);
      return getJobLocationMetadata(row).eligible && !getFreshnessRejection(row) && isEarlyCareerTitle(row.title, row.rawText)
        && !families.includes("software") && families.some(family => ["engineering", "business", "finance-quant", "it-security"].includes(family ?? ""));
    });
    const exact = matches.filter(row => ids.has(jobIdentity(row.applyUrl)));
    const semantic = matches.filter(row => !ids.has(jobIdentity(row.applyUrl)) && semanticIds.has(semanticJobIdentity(row)));
    const unmatched = matches.filter(row => !ids.has(jobIdentity(row.applyUrl)) && !semanticIds.has(semanticJobIdentity(row)));
    const direct = unmatched.filter(row => !aggregatorHosts.has(new URL(row.applyUrl).hostname));
    const companyChecks = direct.map(row => evaluateCompanyQuality({ name: row.company }, row.rawText, registry, trust).status);
    const employerCounts = Object.fromEntries(["approved", "quarantined", "rejected"].map(status => [status, companyChecks.filter(value => value === status).length]));
    if (repo === "GodlyDonuts/keryx") await writeFile(`${output}/keryx-${path.replaceAll("/", "--")}.candidates.json`, JSON.stringify(direct, null, 2));
    const report = { repo, path, rawUrl, pushedAt: metadata.pushed_at, archived: metadata.archived, license, licenseUrl,
      alreadyConfigured: catalog.sources.some((s: {repository: string; path: string}) => s.repository.toLowerCase() === repo.toLowerCase() && s.path === path),
      parsedRows: rows.length, uniqueDestinations: unique.length, targetPolicyMatches: matches.length,
      alreadyOnBoard: exact.length, possibleSemanticOverlap: semantic.length, unmatchedCandidates: unmatched.length,
      directUnmatchedCandidates: direct.length, preliminaryCompanyChecks: employerCounts,
      directOriginEvidence: direct.filter(row => /(?:workday|greenhouse|lever|ashby|smartrecruiters) direct/i.test(row.rawText)).length,
      topDestinationHosts: Object.entries(unique.reduce<Record<string, number>>((counts, row) => { const host = new URL(row.applyUrl).hostname; counts[host] = (counts[host] ?? 0) + 1; return counts; }, {})).sort((a,b) => b[1]-a[1]).slice(0,5),
      unmatchedExamples: unmatched.slice(0, 8).map(({company,title,location,applyUrl}) => ({company,title,location,applyUrl})),
      directUnmatchedExamples: direct.slice(0, 12).map(({company,title,location,applyUrl}) => ({company,title,location,applyUrl})),
      markdownRows: markdown.split("\n").filter(line => /^\s*\|/.test(line) && /https?:/.test(line)).length,
    };
    reports.push(report);
    console.log(JSON.stringify(report));
  } catch (error) { const report = { repo, path, error: String(error) }; reports.push(report); console.log(JSON.stringify(report)); }
}
await writeFile(`${output}/report.json`, JSON.stringify({ auditedAt: new Date().toISOString(), baselineGeneratedAt: baseline.generatedAt, baselineJobs: baseline.jobs.length, reports }, null, 2));
