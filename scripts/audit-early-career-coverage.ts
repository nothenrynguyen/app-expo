import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createAtsBoard, fetchAtsBoard, type AtsBoardResult, type AtsBoardSeed } from "../lib/ats-boards";
import { isInCollection } from "../lib/job-collections";
import { opportunityIdentity, type CandidateJob } from "../lib/source-normalization";
import { getJobLocationMetadata } from "../lib/job-location-policy";
import { getFreshnessRejection } from "../lib/job-freshness";
import { classifyRoleTags } from "../lib/role-areas";
import { evaluateCompanyQuality, type VerifiedCompany, type CompanyTrustEntry } from "../lib/company-quality";
import type { JobsSnapshot } from "../lib/jobs";

// Offline replay only. Raw provider responses stay in the ignored capture
// directory; the report publishes factual metadata, never full descriptions.
const directory = process.argv[2];
if (!directory) throw new Error("Usage: tsx scripts/audit-early-career-coverage.ts CAPTURE_DIRECTORY [CONTROL_MODULE]");
const read = async (file: string) => JSON.parse(await readFile(path.join(directory, file), "utf8"));
const capture: { capturedAt: string; boards: Array<AtsBoardSeed & { status: string; file?: string; sha256?: string; error?: string }> } = await read("capture.json");
const snapshot: JobsSnapshot = await read("jobs.json");
const registry: VerifiedCompany[] = await read("verified-companies.json");
const trust: CompanyTrustEntry[] = await read("company-trust.json");
const control: { fetchAtsBoard: typeof fetchAtsBoard } | null = process.argv[3] ? await import(pathToFileURL(path.resolve(process.argv[3])).href) : null;
const present = new Set(snapshot.jobs.map(job => opportunityIdentity(job.applyUrl)));
const count = (values: string[]) => Object.fromEntries([...Map.groupBy(values, value => value)].map(([key, rows]) => [key, rows.length]).sort((a, b) => Number(b[1]) - Number(a[1])));
const inventory = Object.fromEntries((["internships", "fulltime"] as const).map(collection => {
  const jobs = snapshot.jobs.filter(job => isInCollection(job, collection));
  return [collection, { rows: jobs.length, uniqueOpportunities: new Set(jobs.map(job => opportunityIdentity(job.applyUrl))).size,
    employers: count(jobs.map(job => job.company)), roleTags: count(jobs.flatMap(job => job.roleTags ?? [])),
    sourceCredits: count(jobs.flatMap(job => job.sources)) }];
}));
function candidateFacts(candidate: CandidateJob) {
  const quality = evaluateCompanyQuality({name: candidate.company, title: candidate.title, applyUrl: candidate.applyUrl}, candidate.rawText, registry, trust);
  const reason = !getJobLocationMetadata(candidate).eligible ? "location" : !classifyRoleTags(candidate).length ? "role"
    : getFreshnessRejection(candidate, new Date(capture.capturedAt)) ? "freshness"
      : quality.status === "rejected" || quality.status === "quarantined" && !quality.coverageExceptionAllowed ? "employer" : null;
  return {company: candidate.company, title: candidate.title, location: candidate.location, url: candidate.applyUrl,
    category: candidate.category, alreadyPublished: present.has(opportunityIdentity(candidate.applyUrl)), coreGateFailure: reason};
}
const original = globalThis.fetch;
const reports = [];
try {
  for (const board of capture.boards) {
    if (board.status !== "ok" || !board.file) { reports.push({...board, unavailable: true}); continue; }
    const body = await readFile(path.join(directory, board.file), "utf8");
    if (createHash("sha256").update(body).digest("hex") !== board.sha256) throw new Error(`Capture hash mismatch: ${board.file}`);
    const payload = JSON.parse(body);
    globalThis.fetch = async () => Response.json(payload);
    const before: AtsBoardResult | null = control ? await control.fetchAtsBoard(createAtsBoard(board), new Date(capture.capturedAt)) : null;
    const after = await fetchAtsBoard(createAtsBoard(board), new Date(capture.capturedAt));
    const beforeIds = new Set(before?.jobs.map(job => opportunityIdentity(job.applyUrl)));
    const afterIds = new Set(after.jobs.map(job => opportunityIdentity(job.applyUrl)));
    const added = before ? after.jobs.filter(job => !beforeIds.has(opportunityIdentity(job.applyUrl))).map(candidateFacts) : [];
    const removed = before ? before.jobs.filter(job => !afterIds.has(opportunityIdentity(job.applyUrl))).map(candidateFacts) : [];
    reports.push({company: board.company, provider: board.provider, key: board.key, sha256: board.sha256,
      rawRows: Array.isArray(payload) ? payload.length : payload.jobs.length,
      beforeAccepted: before?.jobs.length ?? null, afterAccepted: after.jobs.length,
      publishedMatches: after.jobs.filter(job => present.has(opportunityIdentity(job.applyUrl))).length,
      added, removed, experienceConflicts: after.experienceConflictUrls ?? [],
      eligibleMissingLeads: after.jobs.filter(job => !present.has(opportunityIdentity(job.applyUrl))).map(candidateFacts)});
  }
} finally { globalThis.fetch = original; }
const result = {baselineGeneratedAt: snapshot.generatedAt, capturedAt: capture.capturedAt, inventory,
  method: "Purposive existing-employer sample. Same captured responses and clock for both adapters. Core gates are preliminary, not a full publication simulation; source holds, cross-source deduplication and actual release acceptance still require verification. No market-wide recall estimate.",
  reports};
await writeFile(path.join(directory, "controlled-result.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(reports.map(report => ({company: report.company, provider: report.provider,
  ...("unavailable" in report ? {unavailable: true} : {rawRows: report.rawRows, before: report.beforeAccepted, after: report.afterAccepted,
    added: report.added.length, removed: report.removed.length, conflicts: report.experienceConflicts.length})})), null, 2));
