import { readFile, readdir, writeFile } from "node:fs/promises";
import { load } from "cheerio";
import { isEarlyCareerTitle } from "../lib/ats-boards";
import { classifyRoleTags } from "../lib/role-areas";
import { evaluateCompanyQuality, normalizeCompanyName } from "../lib/company-quality";
import { getJobLocationMetadata } from "../lib/job-location-policy";
import { getFreshnessRejection } from "../lib/job-freshness";
import { jobIdentity, inferTerm, type CandidateJob } from "../lib/source-normalization";
import { semanticJobIdentity, workdayRequisitionIdentity } from "../lib/job-dedup";
import type { JobsSnapshot } from "../lib/jobs";

// Offline measurement of bounded research samples. No catalog or public output writes.
const root = ".cache/batch1";
const read = async (file: string) => JSON.parse(await readFile(file, "utf8"));
const baseline = await read(`${root}/baseline.json`) as JobsSnapshot;
const registry = await read("data/verified-companies.json");
const trust = await read("data/company-trust.json");
const destinations = new Set(baseline.jobs.map(job => jobIdentity(job.applyUrl)));
const semantic = new Set(baseline.jobs.map(semanticJobIdentity));
const roleCompany = new Set(baseline.jobs.map(job => `${normalizeCompanyName(job.company)}|${job.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}`));
const targetTags = new Set(["hardware-electrical","process-manufacturing","mechanical","civil-infrastructure","systems-test","materials-chemical","quality-reliability","business-analyst","operations-supply-chain","marketing-sales","finance","quant","it-support-network","cybersecurity"]);
const files = (await readdir(root)).filter(name => /^(?:yubhub|onjob|remoteok|jobr).*\.json$/.test(name));
const groups = new Map<string, Array<{ raw: Record<string, unknown>; file: string }>>();
for (const file of files) {
  const data = await read(`${root}/${file}`);
  const name = file.startsWith("yubhub") ? "YubHub" : file.startsWith("onjob") ? "OnJob" : file.startsWith("jobr") ? "Jobr" : "Remote OK";
  const rows = Array.isArray(data) ? data.filter(job => job.position) : data.jobs ?? [];
  groups.set(name, [...groups.get(name) ?? [], ...rows.map((raw: Record<string, unknown>) => ({raw,file}))]);
}
const reports = [];
for (const [source, rows] of groups) {
  const seen = new Set<string>();
  const counts: Record<string, number> = {};
  let rawExistingDestinations = 0;
  let rawSemanticMatches = 0;
  const leads = [];
  for (const {raw:r,file} of rows) {
    const row = r;
    const yub = source === "YubHub";
    const company = String(yub ? (row.hiringOrganization as {name?:string})?.name ?? "" : row.company ?? "");
    const title = String(row.title ?? row.position ?? "");
    const applyUrl = String(yub ? row["x-apply-url"] ?? row.url : row.applyUrl ?? row.url ?? "");
    const locs = yub ? (Array.isArray(row.jobLocation) ? row.jobLocation : [row.jobLocation]) : [];
    const location = yub ? locs.filter(Boolean).map(place => {
      const a=(place as {address?:Record<string,unknown>}).address ?? {}; return [a.addressLocality,a.addressRegion,typeof a.addressCountry === "string" ? a.addressCountry : (a.addressCountry as {name?:string})?.name].filter(Boolean).join(", ");
    }).join("; ") : String(row.location ?? "");
    const $ = load(String(row.descriptionHtml ?? row.description ?? "")); $("script,style").remove();
    const rawText = $.text().replace(/\s+/g," ").trim();
    const internship = /\bintern(ship)?\b|co-?op/i.test(title);
    const date = row.datePosted || row.date;
    const candidate: CandidateJob = { company,title,applyUrl,location,category:internship?"Internship":"New grad",term:inferTerm(title+" "+rawText),workMode:"unknown",postedAt:String(date || baseline.generatedAt),postedAtSource:date?"exact":"first_seen",salary:null,source,rawText };
    const id = jobIdentity(applyUrl);
    if (destinations.has(id)) rawExistingDestinations++;
    if (semantic.has(semanticJobIdentity(candidate))) rawSemanticMatches++;
    const key = workdayRequisitionIdentity(applyUrl) ? `${semanticJobIdentity(candidate)}|${workdayRequisitionIdentity(applyUrl)}` : id;
    const reason = !id ? "invalid-url" : key && seen.has(key) ? "within-sample-duplicate" : null;
    if (key) seen.add(key);
    let outcome = reason;
    if (!outcome && !getJobLocationMetadata(candidate).eligible) outcome = "location-hold";
    if (!outcome && !isEarlyCareerTitle(title,rawText)) outcome = "career-hold";
    if (!outcome && !classifyRoleTags(candidate).some(tag=>targetTags.has(tag))) outcome = "outside-target-categories";
    if (!outcome && getFreshnessRejection(candidate)) outcome = "freshness-hold";
    if (!outcome && /senior|director|executive/i.test(String(row["x-experience-level"] ?? ""))) outcome = "conflicting-seniority-hold";
    if (!outcome && destinations.has(id)) outcome = "existing-destination";
    if (!outcome && semantic.has(semanticJobIdentity(candidate))) outcome = "existing-semantic-match";
    const similar = roleCompany.has(`${normalizeCompanyName(company)}|${title.toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}`);
    if (!outcome && similar) outcome = "possible-existing-role-different-location";
    const decision = evaluateCompanyQuality({name:company},rawText,registry,trust);
    if (!outcome && decision.status !== "approved") outcome = `employer-${decision.status}`;
    if (!outcome) outcome = "new-screened-lead-needs-official-check";
    counts[outcome] = (counts[outcome] ?? 0)+1;
    if (["new-screened-lead-needs-official-check","employer-quarantined","possible-existing-role-different-location"].includes(outcome)) leads.push({company,title,location,applyUrl,sourceUrl:String(row.url??""),file,outcome,employerReason:decision.reason,rawText});
  }
  reports.push({source,rows:rows.length,rawExistingDestinations,rawSemanticMatches,counts,leads});
}
await writeFile(`${root}/measurement.json`,JSON.stringify({measuredAt:new Date().toISOString(),baselineGeneratedAt:baseline.generatedAt,baselineJobs:baseline.jobs.length,reports},null,2)+"\n");
console.log(JSON.stringify(reports.map(({leads,...report})=>({...report,heldLeads:leads.length})),null,2));
