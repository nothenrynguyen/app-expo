import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseMarkdownSource } from "../lib/source-parsers";
import { jobIdentity } from "../lib/source-normalization";
import { semanticJobIdentity, workdayRequisitionIdentity } from "../lib/job-dedup";
import { getJobLocationMetadata } from "../lib/job-location-policy";
import { getFreshnessRejection } from "../lib/job-freshness";
import { classifyRoleTags } from "../lib/role-areas";
import { evaluateCompanyQuality } from "../lib/company-quality";
import { employerBoardIdentity } from "../lib/ingestion/reviewed-employer-coverage";
import type { JobsSnapshot } from "../lib/jobs";
import { assertSourcePermissions } from "../lib/ingestion/source-permissions";
import type { SourceCatalog } from "../lib/source-catalog";

// Offline comparison against captured, licensed tables. Never writes ingestion state.
const directory = ".cache/coverage-expansion";
const read = async (file: string) => readFile(file, "utf8");
if (process.argv.includes("--capture")) {
  const catalog: SourceCatalog = JSON.parse(await read("data/sources.json"));
  const sources = catalog.sources.filter(source => source.repository === "aprameyak/2027-tech-jobs" && source.active);
  if (sources.length !== 3) throw new Error("Expected three reviewed coverage-comparison feeds.");
  assertSourcePermissions(sources, JSON.parse(await read("data/source-licenses.json")).repositories);
  await mkdir(directory, {recursive: true});
  for (const source of sources) {
    const response = await fetch(source.url, {headers: {"user-agent": "empluzzed-coverage-review"}, signal: AbortSignal.timeout(15_000)});
    if (!response.ok) throw new Error(`Coverage capture failed: ${response.status}`);
    await writeFile(`${directory}/${source.path}`, await response.text());
  }
}
const baselineText = await read("public/jobs.json");
const baseline: JobsSnapshot = JSON.parse(baselineText);
const now = new Date(baseline.generatedAt);
const registry = JSON.parse(await read("data/verified-companies.json"));
const trust = JSON.parse(await read("data/company-trust.json"));
const quarantine = JSON.parse(await read("data/quarantine.json"));
const identities = new Set(baseline.jobs.map(job => jobIdentity(job.applyUrl)));
const requisitions = new Set(baseline.jobs.map(job => workdayRequisitionIdentity(job.applyUrl)).filter(Boolean));
const semantics = new Set(baseline.jobs.map(semanticJobIdentity));
const held = new Map<string, string>(quarantine.jobs.map((job: {applyUrl: string; reason: string}) => [jobIdentity(job.applyUrl), job.reason]));
const seen = new Set<string>();
const reports = [];
for (const [file, name] of [["SUMMER.md", "Aprameya Summer Internships 2027"], ["OFFCYCLE.md", "Aprameya Off-Cycle Internships 2027"], ["NEWGRAD.md", "Aprameya New Grad 2027"]]) {
  const text = await read(`${directory}/${file}`);
  const parsed = parseMarkdownSource(text, name, now);
  const rows = parsed.flatMap(job => {
    const id = jobIdentity(job.applyUrl)!;
    if (seen.has(id)) return [];
    seen.add(id);
    const requisition = workdayRequisitionIdentity(job.applyUrl);
    const match = identities.has(id) || (requisition && requisitions.has(requisition)) ? "destination" : semantics.has(semanticJobIdentity(job)) ? "possible-semantic" : null;
    const quality = evaluateCompanyQuality({name: job.company, title: job.title, applyUrl: job.applyUrl}, job.rawText, registry, trust);
    const exclusion = !getJobLocationMetadata(job).eligible ? "location" : !classifyRoleTags(job).length ? "role" : getFreshnessRejection(job, now) ? "freshness" : quality.status !== "approved" ? quality.status : null;
    return [{...job, match, exclusion, existingHold: held.get(id) ?? null, employerBoard: employerBoardIdentity(job.applyUrl)}];
  });
  reports.push({file, name, sha256: createHash("sha256").update(text).digest("hex"), parsed: parsed.length, uniqueRows: rows.length,
    matches: rows.filter(row => row.match).length,
    unmatched: rows.filter(row => !row.match).length,
    eligibleApprovedUnmatched: rows.filter(row => !row.match && !row.exclusion).length,
    exclusions: Object.fromEntries([...new Set(rows.map(row => row.exclusion))].map(reason => [reason ?? "none", rows.filter(row => row.exclusion === reason).length])),
    rows});
}
await mkdir(directory, {recursive: true});
await writeFile(`${directory}/gap-report.json`, JSON.stringify({measuredAt: new Date().toISOString(), baselineGeneratedAt: baseline.generatedAt, baselineSha256: createHash("sha256").update(baselineText).digest("hex"), note: "Unmatched means a comparison lead, not a verified additional vacancy. Semantic matches require review. Employer approval and source license do not establish listing availability or upstream reuse rights.", reports}, null, 2));
console.log(JSON.stringify(reports.map(report => ({...report, rows: undefined})), null, 2));
