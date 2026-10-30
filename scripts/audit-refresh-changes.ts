import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { jobIdentity, opportunityIdentity } from "../lib/source-normalization";
import { semanticJobIdentity } from "../lib/job-dedup";
import { discoverAtsBoard } from "../lib/ats-boards";
import { getFreshnessRejection } from "../lib/job-freshness";
import { isListingUnavailable } from "../lib/listing-health";
import type { JobsSnapshot } from "../lib/jobs";

const beforeRef = process.argv[2] ?? "7ab69a1";
const git = (file: string) => execFileSync("git", ["-c", `safe.directory=${process.cwd().replace(/\\/g, "/")}`, "show", file], { maxBuffer: 50_000_000 }).toString();
const before = JSON.parse(git(`${beforeRef}:public/jobs.json`)) as JobsSnapshot;
const afterRef = process.argv[3];
const readAfter = async (file: string) => JSON.parse(afterRef ? git(`${afterRef}:${file}`) : await readFile(file, "utf8"));
const after = await readAfter("public/jobs.json") as JobsSnapshot;
const report = await readAfter("data/refresh-report.json");
const quarantine = await readAfter("data/quarantine.json");
const health = await readAfter("data/listing-health.json");
const changes = await readAfter("data/listing-changes.json").catch(() => null);
// A decision from another refresh must never explain this comparison.
const matchingReport = changes?.previousGeneratedAt === before.generatedAt && (changes?.currentSnapshotGeneratedAt ?? changes?.generatedAt) === after.generatedAt;
const recorded = matchingReport
  ? new Map(((changes.removedOpportunities ?? changes.removed) as {applyUrl:string;reason:string;category?:string}[]).map(row=>[opportunityIdentity(row.applyUrl),row])) : new Map();
const quarantineById = new Map((quarantine.jobs as {applyUrl:string;reason:string}[]).map(r => [jobIdentity(r.applyUrl),r]));
const ids = new Set(after.jobs.map(j => opportunityIdentity(j.applyUrl)));
const groups = Map.groupBy(after.jobs, semanticJobIdentity);
const reasons: Record<string, number> = {};
const removed = before.jobs.filter(j => !ids.has(opportunityIdentity(j.applyUrl))).map(job => {
  const board = discoverAtsBoard(job.applyUrl, job.company, "audit");
  const diagnostic = board && report.boards.records.find((r: {provider: string; key: string}) => r.provider === board.provider && r.key.toLowerCase() === board.key.toLowerCase());
  const q = quarantineById.get(jobIdentity(job.applyUrl));
  const diagnosis = recorded.get(opportunityIdentity(job.applyUrl));
  const recordedReason = diagnosis?.category ?? diagnosis?.reason;
  const reason = recordedReason ?? q?.reason ?? getFreshnessRejection(job, new Date(after.generatedAt)) ?? (isListingUnavailable(health[jobIdentity(job.applyUrl)!]) ? "Cached listing check is closed or unavailable; current closure unverified" : diagnostic?.status === "failed" ? "Employer board failed" : "Absent from current accepted inputs; requires source investigation");
  reasons[reason] = (reasons[reason] ?? 0) + 1;
  return { company: job.company, title: job.title, applyUrl: job.applyUrl, reason, diagnosis, evidence:recordedReason ? "recorded-refresh-decision" : "snapshot-inference", boardStatus: diagnostic?.status, sources: job.sources };
});
const priorIds = new Set(before.jobs.map(j => opportunityIdentity(j.applyUrl)));
const duplicateGroups = [...groups.values()].filter(g => g.length > 1).map(g => g.map(j => ({ id:j.id, company:j.company,title:j.title,location:j.location,applyUrl:j.applyUrl,sources:j.sources })));
const result = { beforeRef, beforeGeneratedAt: before.generatedAt, afterGeneratedAt:after.generatedAt, before:before.jobs.length, after:after.jobs.length,
  removedUrlRows:removed.length, removed:new Set(removed.map(j => opportunityIdentity(j.applyUrl))).size,
  added:new Set(after.jobs.filter(j=>!priorIds.has(opportunityIdentity(j.applyUrl))).map(j => opportunityIdentity(j.applyUrl))).size,
  reconciliation:matchingReport ? changes.reconciliation : null, categoryCounts:matchingReport ? changes.categoryCounts : null,
  reasonCountUnit:"url_rows", reasons, missing:removed, duplicateGroups };
await mkdir(".cache/refresh-audit", {recursive:true});
await writeFile(".cache/refresh-audit/comparison.json", JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({...result,missing:undefined,duplicateGroups:duplicateGroups.length},null,2));
