import { readFile } from "node:fs/promises";
import { jobIdentity } from "../lib/source-normalization";
import { semanticJobIdentity } from "../lib/job-dedup";
import { getFreshnessRejection } from "../lib/job-freshness";
import { getJobLocationMetadata } from "../lib/job-location-policy";
import type { JobsSnapshot, PublicJob } from "../lib/jobs";
import type { ListingHealthFile } from "../lib/listing-health";
import { classifyListingResponse } from "../lib/listing-health";
import { load } from "cheerio";

// Read-only audit. Cached health belongs to the local checkout, not a live probe.
const input = process.argv[2] ?? "public/jobs.json";
const snapshot: JobsSnapshot = JSON.parse(await readFile(input, "utf8"));
const health: ListingHealthFile = JSON.parse(await readFile("data/listing-health.json", "utf8"));
const quarantine = JSON.parse(await readFile("data/quarantine.json", "utf8")) as {
  generatedAt: string;
  jobs: Array<{ company: string; title: string; reason: string; applyUrl: string }>;
};
const now = new Date();
const count = (values: string[]) => Object.entries(values.reduce<Record<string, number>>((out, value) => {
  out[value] = (out[value] ?? 0) + 1;
  return out;
}, {})).sort((a, b) => b[1] - a[1]);
const sample = (jobs: PublicJob[]) => jobs.slice(0, 12).map(({ company, title, location, applyUrl }) => ({ company, title, location, applyUrl }));
function duplicates(key: (job: PublicJob) => string | null) {
  const groups = new Map<string, PublicJob[]>();
  for (const job of snapshot.jobs) {
    const identity = key(job);
    if (identity) groups.set(identity, [...(groups.get(identity) ?? []), job]);
  }
  const matches = [...groups.values()].filter((jobs) => jobs.length > 1);
  return { groups: matches.length, excessRows: matches.reduce((n, jobs) => n + jobs.length - 1, 0), examples: matches.slice(0, 8).map(sample) };
}
const locationFailures = snapshot.jobs.filter((job) => !getJobLocationMetadata(job).eligible);
const freshnessFailures = snapshot.jobs.filter((job) => getFreshnessRejection(job, now));
const invalidUrls = snapshot.jobs.filter((job) => {
  try { return !["https:", "http:"].includes(new URL(job.applyUrl).protocol); } catch { return true; }
});
const cachedClosed = snapshot.jobs.filter((job) => health[jobIdentity(job.applyUrl) ?? ""]?.status === "closed");
const acceptedIdentities = new Set(snapshot.jobs.map((job) => jobIdentity(job.applyUrl)));
const probes: Array<Record<string, unknown>> = [];
if (process.argv.includes("--probe")) {
  const selected = new Map<string, PublicJob>();
  for (const job of [...cachedClosed, ...snapshot.jobs.filter((job) => /Account Executive, Market Access/.test(job.title)), ...Array.from({ length: 12 }, (_, index) => snapshot.jobs[Math.floor(index * snapshot.jobs.length / 12)])]) {
    selected.set(job.applyUrl, job);
  }
  const jobs = [...selected.values()].slice(0, 20);
  for (let index = 0; index < jobs.length; index += 4) {
    probes.push(...await Promise.all(jobs.slice(index, index + 4).map(async (job) => {
      try {
        const response = await fetch(job.applyUrl, { redirect: "follow", signal: AbortSignal.timeout(15_000), headers: { "user-agent": "empluzzed-Quality-Audit/0.1" } });
        const body = await response.text();
        const $ = load(body);
        $("script, style, nav, footer").remove();
        const text = $.text().replace(/\s+/g, " ").trim();
        return { company: job.company, title: job.title, url: job.applyUrl, finalUrl: response.url, httpStatus: response.status,
          heuristicStatus: classifyListingResponse(response.status, body),
          pageTitle: $("title").text(),
          experienceEvidence: text.match(/.{0,100}\b\d+\+?(?:\s*[-–]\s*\d+)?\s+years.{0,160}/gi)?.slice(0, 5) ?? [],
          closureEvidence: text.match(/.{0,80}(?:no longer available|no longer accepting|job has expired|position.{0,20}closed).{0,100}/gi)?.slice(0, 3) ?? [],
          warning: "HTTP success and heuristic live status do not prove an open vacancy. JavaScript shells and access blocks require separate review." };
      } catch (error) { return { company: job.company, url: job.applyUrl, error: String(error) }; }
    })));
  }
}
console.log(JSON.stringify({
  auditedAt: now.toISOString(), input, generatedAt: snapshot.generatedAt, total: snapshot.jobs.length,
  invalidUrls: sample(invalidUrls), invalidUrlCount: invalidUrls.length,
  locationFailureCount: locationFailures.length, locationExamples: sample(locationFailures),
  freshnessFailureCount: freshnessFailures.length, freshnessExamples: sample(freshnessFailures),
  duplicateIds: duplicates((job) => job.id), duplicateDestinations: duplicates((job) => jobIdentity(job.applyUrl)),
  possibleSemanticDuplicates: duplicates(semanticJobIdentity),
  cachedHealth: {
    warning: "Local cache only. ATS board checks can supersede these records; missing cache entries do not imply an unchecked ATS listing.",
    status: count(snapshot.jobs.map((job) => health[jobIdentity(job.applyUrl) ?? ""]?.status ?? "no generic cache entry")),
    cachedClosedExamples: sample(cachedClosed),
    olderThan24Hours: snapshot.jobs.filter((job) => {
      const record = health[jobIdentity(job.applyUrl) ?? ""];
      return record && now.getTime() - Date.parse(record.checkedAt) >= 86_400_000;
    }).length,
  },
  dateProvenance: count(snapshot.jobs.map((job) => job.postedAtSource)),
  probes,
  localQuarantine: {
    generatedAt: quarantine.generatedAt, rows: quarantine.jobs.length,
    uniqueDestinations: new Set(quarantine.jobs.map((job) => jobIdentity(job.applyUrl))).size,
    rowsAlsoAccepted: quarantine.jobs.filter((job) => acceptedIdentities.has(jobIdentity(job.applyUrl))).length,
    reasons: count(quarantine.jobs.map((job) => job.reason)),
    companies: count(quarantine.jobs.map((job) => job.company)).slice(0, 20),
    employerReviewExamples: quarantine.jobs.filter((job) => /not been verified/i.test(job.reason)).slice(0, 12),
  },
}, null, 2));
