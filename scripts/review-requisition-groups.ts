import { mkdir, readFile, writeFile } from "node:fs/promises";
import { semanticJobIdentity, workdayRequisitionIdentity } from "../lib/job-dedup";
import type { JobsSnapshot } from "../lib/jobs";

// Review evidence only. Never removes a listing or changes stored job IDs.
function requisition(value: string): { namespace: string; id: string } | null {
  const url = new URL(value);
  const workday = workdayRequisitionIdentity(value);
  if (workday) return { namespace: workday.split(":")[0], id: workday.split(":")[1] };
  const greenhouse = url.hostname.match(/^(?:boards|job-boards)\.greenhouse\.io$/) && url.pathname.match(/^\/([^/]+)\/jobs\/(\d+)/);
  if (greenhouse) return { namespace: `greenhouse:${greenhouse[1]}`, id: greenhouse[2] };
  const icims = url.hostname.endsWith(".icims.com") && url.pathname.match(/\/jobs\/(\d+)/);
  if (icims) return { namespace: `icims:${url.hostname.replace(/^(?:careers|talent|employees)-/, "")}`, id: icims[1] };
  const smart = url.hostname === "jobs.smartrecruiters.com" && url.pathname.match(/^\/([^/]+)\/(\d+)/);
  if (smart) return { namespace: `smartrecruiters:${smart[1]}`, id: smart[2] };
  const ashby = url.hostname === "jobs.ashbyhq.com" && url.pathname.match(/^\/([^/]+)\/([0-9a-f-]{36})/i);
  if (ashby) return { namespace: `ashby:${ashby[1]}`, id: ashby[2] };
  return null;
}

const snapshot = JSON.parse(await readFile("public/jobs.json", "utf8")) as JobsSnapshot;
const groups = [...Map.groupBy(snapshot.jobs, semanticJobIdentity).values()].filter(group => group.length > 1);
const reviewed = groups.map(group => {
  const evidence = group.map(job => ({ company: job.company, title: job.title, url: job.applyUrl, requisition: requisition(job.applyUrl) }));
  const known = evidence.every(job => job.requisition);
  const sameNamespace = new Set(evidence.map(job => job.requisition?.namespace)).size === 1;
  const unique = new Set(evidence.map(job => job.requisition?.id)).size === group.length;
  const disposition = known && sameNamespace ? unique ? "retain-distinct-requisition-tokens" : "review-same-requisition-aliases" : "needs-official-requisition-evidence";
  return { disposition, evidence };
});
const counts: Record<string, number> = {};
for (const group of reviewed) counts[group.disposition] = (counts[group.disposition] ?? 0) + 1;
const result = { generatedAt: snapshot.generatedAt, groups: groups.length, counts, reviewed };
await mkdir(".cache/refresh-audit", { recursive: true });
await writeFile(".cache/refresh-audit/requisition-review.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ ...result, reviewed: undefined }, null, 2));
