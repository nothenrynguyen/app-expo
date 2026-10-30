import fs from "node:fs";
import { createHash } from "node:crypto";
import { getJobRoleTags } from "../lib/role-areas";
import { deduplicateCrossSourceJobs } from "../lib/job-dedup";
import { preserveWorkdayJobIds } from "../lib/ingestion/preserve-job-ids";
import { buildListingChanges } from "../lib/ingestion/listing-changes";
import type { JobsSnapshot } from "../lib/jobs";

const raw = fs.readFileSync("public/jobs.json", "utf8");
const snapshot: JobsSnapshot = JSON.parse(raw);
const excluded = snapshot.jobs.filter(j => !getJobRoleTags(j).length);
const current = preserveWorkdayJobIds(deduplicateCrossSourceJobs(snapshot.jobs.filter(j => getJobRoleTags(j).length)), snapshot.jobs);
const receipt = JSON.parse(fs.readFileSync("docs/source-health-production-result.json", "utf8")) as {removalAudit: {matches: {oldUrl: string; retainedUrl: string}[]}};
const retained = receipt.removalAudit.matches.map(x => snapshot.jobs.find(j => j.applyUrl === x.retainedUrl)!);
const prior = receipt.removalAudit.matches.map((x, i) => ({...retained[i], applyUrl: x.oldUrl}));
const changes = buildListingChanges({generatedAt: snapshot.generatedAt, previousGeneratedAt: null, previous: prior, current: retained, acceptedBeforeDedup: retained, candidateUrls: retained.map(j => j.applyUrl), outcomeFor: () => undefined, boardState: () => null});
console.log(JSON.stringify({auditedAt: new Date().toISOString(), baselineGeneratedAt: snapshot.generatedAt, baselineSha256: createHash("sha256").update(raw).digest("hex"), baselineJobs: snapshot.jobs.length,
  excludedByScope: excluded.map(({company, title, applyUrl}) => ({company, title, applyUrl})), afterScope: snapshot.jobs.length - excluded.length, afterDedup: current.length,
  mergedRows: snapshot.jobs.length - excluded.length - current.length, knownAliases: {added: changes.added, removed: changes.removedCount, urlChanges: changes.urlChanges.length},
  priorIdsCovered: snapshot.jobs.filter(j => getJobRoleTags(j).length).every(p => current.some(j => j.id === p.id || j.previousIds?.includes(p.id))), jobsWithCompatibilityIds: current.filter(j => j.previousIds?.length).length,
  warning: "Frozen policy comparison only. No source fetches or tracked snapshots changed."}, null, 2));
