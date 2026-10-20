import { mkdir, readFile, writeFile } from "node:fs/promises";
import { semanticJobIdentity, workdayRequisitionIdentity } from "../lib/job-dedup";
import type { JobsSnapshot } from "../lib/jobs";
import { load } from "cheerio";
import { classifyListingResponse } from "../lib/listing-health";
import { inBatches } from "../lib/ingestion/concurrency";

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

if (process.argv.includes("--verify")) {
  const urls = [...new Set(reviewed.filter(group => group.disposition !== "retain-distinct-requisition-tokens").flatMap(group => group.evidence.map(job => job.url)))];
  const deadline = Date.now() + 180_000;
  const stoppedHosts = new Set<string>();
  const checks = await inBatches(urls.slice(0, 350), 4, async url => {
    const target = new URL(url);
    if (Date.now() >= deadline || stoppedHosts.has(target.hostname)) return { url, status: null, outcome: "not-checked-budget-or-rate-limit", requisition: null };
    let endpoint = url;
    const workday = /^[a-z0-9-]+\.wd\d+\.myworkdayjobs\.com$/i.test(target.hostname);
    if (workday) {
      const parts = target.pathname.split("/").filter(Boolean);
      if (/^[a-z]{2}[-_][a-z]{2}$/i.test(parts[0])) parts.shift();
      endpoint = `${target.origin}/wday/cxs/${target.hostname.split(".")[0]}/${parts[0]}/${parts.slice(1).join("/")}`;
    }
    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(Math.max(1, Math.min(10_000, deadline - Date.now()))) });
      if (response.status === 429) stoppedHosts.add(target.hostname);
      const text = await response.text();
      if (workday) {
        const payload = response.ok ? JSON.parse(text) : null;
        const id = payload?.jobPostingInfo?.jobReqId;
        return { url, endpoint, status: response.status, outcome: typeof id === "string" ? "official-requisition" : "unverified", requisition: typeof id === "string" ? id : null };
      }
      const $ = load(text);
      let id: string | null = null;
      for (const node of $("script[type='application/ld+json']").toArray()) {
        try {
          const parsed = JSON.parse($(node).text());
          const entries = Array.isArray(parsed) ? parsed : parsed["@graph"] ?? [parsed];
          for (const entry of entries) if (entry["@type"] === "JobPosting") {
            const identifier = entry.identifier?.value ?? entry.identifier;
            if (typeof identifier === "string" || typeof identifier === "number") id = String(identifier);
          }
        } catch { /* A malformed page is unresolved, never proof of closure. */ }
      }
      const state = classifyListingResponse(response.status, text);
      return { url, endpoint, status: response.status, outcome: ["closed", "unavailable"].includes(state) ? state : id ? "official-requisition" : "unverified", requisition: id };
    } catch { return { url, endpoint, status: null, outcome: "unverified", requisition: null }; }
  });
  const evidence = checks.flatMap(check => check.status === "fulfilled" ? [check.value] : []);
  const byUrl = new Map(evidence.map(check => [check.url, check]));
  const decisions = reviewed.filter(group => group.disposition !== "retain-distinct-requisition-tokens").map(group => {
    const checks = group.evidence.map(job => byUrl.get(job.url));
    const allVerified = checks.every(check => check?.outcome === "official-requisition");
    const ids = checks.map(check => check?.requisition?.toLowerCase());
    const disposition = checks.some(check => check?.outcome === "closed" || check?.outcome === "unavailable") ? "contains-unavailable-destination"
      : allVerified ? new Set(ids).size === checks.length ? "retain-official-distinct-requisitions" : "official-same-requisition-review"
        : "retain-pending-evidence";
    return { company: group.evidence[0].company, title: group.evidence[0].title, disposition, urls: group.evidence.map(job => job.url) };
  });
  const summary: Record<string, number> = {};
  for (const decision of decisions) summary[decision.disposition] = (summary[decision.disposition] ?? 0) + 1;
  await writeFile(".cache/refresh-audit/official-requisition-review.json", JSON.stringify({ generatedAt: new Date().toISOString(), snapshotGeneratedAt: snapshot.generatedAt, requests: evidence.length, truncated: urls.length > evidence.length, summary, decisions, evidence }, null, 2) + "\n");
  console.log(JSON.stringify({ officialReview: summary, requests: evidence.length }));
}
