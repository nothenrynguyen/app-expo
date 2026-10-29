import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { jobIdentity } from "../lib/source-normalization";
import { sourceVerificationKey } from "../lib/ingestion/source-verification";
import { isInCollection } from "../lib/job-collections";
import type { JobsSnapshot, PublicJob } from "../lib/jobs";

// Compare a recorded pre-migration publication with current local data. No network
// requests, inferred closures, or acceptance-policy changes are made by this audit.
const baselineRef = process.argv[2] ?? "93a0218";
const historic = (ref: string, file: string) => JSON.parse(execFileSync("git", ["-c", "safe.directory=C:/Users/Henry/Documents/Projects/app-expo", "show", `${ref}:${file}`], {encoding: "utf8", maxBuffer: 50_000_000}));
const baseline: JobsSnapshot = historic(baselineRef, "public/jobs.json");
const current: JobsSnapshot = JSON.parse(await readFile("public/jobs.json", "utf8"));
const migration = historic("8f2078a", "data/listing-changes.json");
const quarantine: {jobs: Array<{company: string; title: string; applyUrl: string; reason: string; source: string}>} = JSON.parse(await readFile("data/quarantine.json", "utf8"));
const key = (url: string) => jobIdentity(url) ?? url;
const aliasKey = (url: string) => sourceVerificationKey(url) ?? key(url);
const currentKeys = new Set(current.jobs.map(job => key(job.applyUrl)));
const currentAliases = new Set(current.jobs.map(job => aliasKey(job.applyUrl)));
const previousKeys = new Set(baseline.jobs.map(job => key(job.applyUrl)));
const migrationReasons = new Map<string, string>(migration.removed.map((job: {applyUrl: string; reason: string}) => [key(job.applyUrl), job.reason]));
const holds = new Map<string, Set<string>>();
const directEmployerRows = new Set<string>();
for (const job of quarantine.jobs) {
  const identity = key(job.applyUrl);
  if (job.source.startsWith("Direct ATS")) directEmployerRows.add(identity);
  if (!holds.has(identity)) holds.set(identity, new Set());
  holds.get(identity)!.add(job.reason);
}
const missing = baseline.jobs.filter(job => !currentKeys.has(key(job.applyUrl))).map(job => {
  const reasons = [...(holds.get(key(job.applyUrl)) ?? [])];
  const initialReason = migrationReasons.get(key(job.applyUrl)) ?? "not-in-initial-migration";
  const possibleAliasMatch = currentAliases.has(aliasKey(job.applyUrl));
  const cause = possibleAliasMatch ? "possible-url-alias" : reasons.some(reason => /Company size and substantial U.S./.test(reason)) ? "employer-evidence-hold"
    : reasons.some(reason => /availability could not be verified/.test(reason)) ? "availability-evidence-hold"
    : reasons.some(reason => /reviewed direct application destination/.test(reason)) ? "employer-destination-hold"
    : reasons.some(reason => /explicit early-career title/.test(reason)) ? "early-career-title-hold"
    : reasons.some(reason => /supported empluzzed category/.test(reason)) ? "role-classification"
    : initialReason === "source-permission" ? "missing-permitted-input"
    : initialReason;
  return {company: job.company, title: job.title, applyUrl: job.applyUrl, sources: job.sources, cause, initialReason, currentHoldReasons: reasons, possibleAliasMatch};
});
const count = (jobs: PublicJob[]) => ({total: jobs.length, internships: jobs.filter(job => isInCollection(job, "internships")).length, fulltime: jobs.filter(job => isInCollection(job, "fulltime")).length});
const causes = Object.fromEntries([...new Set(missing.map(job => job.cause))].map(cause => [cause, missing.filter(job => job.cause === cause).length]));
const companyCounts = new Map<string, number>();
for (const job of missing.filter(job => job.cause === "employer-evidence-hold")) companyCounts.set(job.company, (companyCounts.get(job.company) ?? 0) + 1);
const inputHosts = new Map<string, number>();
for (const job of missing.filter(job => job.cause === "missing-permitted-input")) {
  const host = new URL(job.applyUrl).hostname;
  inputHosts.set(host, (inputHosts.get(host) ?? 0) + 1);
}
const currentReport = JSON.parse(await readFile("data/refresh-report.json", "utf8"));
const baselineReport = historic(baselineRef, "data/refresh-report.json");
const result = {auditedAt: new Date().toISOString(), baselineRef, baselineGeneratedAt: baseline.generatedAt, currentGeneratedAt: current.generatedAt,
  baseline: count(baseline.jobs), current: count(current.jobs), netDecline: baseline.jobs.length - current.jobs.length,
  priorRowsCurrentlyMissing: missing.length, currentRowsAbsentFromPrior: current.jobs.filter(job => !previousKeys.has(key(job.applyUrl))).length,
  causes, employerEvidenceHoldsStillCollectedDirectly: missing.filter(job => job.cause === "employer-evidence-hold" && directEmployerRows.has(key(job.applyUrl))).length,
  employerBoardsQueried: {baseline: baselineReport.boards.total, current: currentReport.boards.total},
  missingInputHosts: [...inputHosts].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([hostname, rows]) => ({hostname, rows})),
  topEmployerEvidenceHolds: [...companyCounts].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([company, rows]) => ({company, rows})),
  limitations: ["These are observed pipeline causes, not closure decisions or proof that every missing role is eligible.", "Company-evidence and availability holds are separate from source-permission holds.", "Source-permission means a previously attributed feed is held and no current accepted replacement was found, not that employer facts are necessarily unlawful to use.", "Counts use the pipeline destination identity so row totals reconcile. Possible URL/requisition aliases are flagged separately and are not treated as verified additional vacancies."],
  examplesByCause: Object.fromEntries(Object.keys(causes).map(cause => [cause, missing.filter(job => job.cause === cause).slice(0, 5)]))};
await writeFile("docs/coverage-loss-audit-result.json", `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({...result, examplesByCause: undefined}, null, 2));
