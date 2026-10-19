import { mkdir, readFile, writeFile } from "node:fs/promises";
import { loadReviewedUsaJobs } from "../lib/ingestion/usajobs";
import { jobIdentity } from "../lib/source-normalization";
import { semanticJobIdentity } from "../lib/job-dedup";
import { ROLE_TAGS } from "../lib/role-areas";
import type { JobsSnapshot } from "../lib/jobs";
const result = await loadReviewedUsaJobs(true);
if (!result) throw new Error("Discovery did not run");
const baseline: JobsSnapshot = JSON.parse(await readFile("public/jobs.json", "utf8"));
const ids = new Set(baseline.jobs.map(job => jobIdentity(job.applyUrl)));
const semantic = new Set(baseline.jobs.map(semanticJobIdentity));
const reasons: Record<string, number> = {};
for (const row of result.holds) reasons[row.reason] = (reasons[row.reason] ?? 0) + 1;
const candidates = result.candidates.map(({ rawText, ...job }) => { void rawText; return ({ ...job,
  overlapsBoard: ids.has(jobIdentity(job.applyUrl)) || semantic.has(semanticJobIdentity(job)),
  families: [...new Set((job.roleTags ?? []).map(tag => ROLE_TAGS.find(role => role.value === tag)?.family))],
}); });
const report = { measuredAt: new Date().toISOString(), baselineGeneratedAt: baseline.generatedAt, ...result, candidates, reasons };
await mkdir(".cache/usajobs-release", { recursive: true });
await writeFile(".cache/usajobs-release/discovery.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ failed: result.failed, requests: result.requests, discovered: result.discovered, candidates: candidates.length, newCandidates: candidates.filter(job => !job.overlapsBoard).length, reasons, truncated: result.truncated }));
if (result.failed) process.exitCode = 1;
