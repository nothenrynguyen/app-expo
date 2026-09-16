import { normalizeCompanyName } from "./company-quality";
import { normalizeJobLocation } from "./job-locations";
import type { PostedAtSource, PublicJob } from "./jobs";

const AGGREGATOR_HOSTS = new Set([
  "applyguy.ai",
  "www.applyguy.ai",
  "dreamworkhq.com",
  "www.dreamworkhq.com",
]);

const DATE_PRECISION: Record<PostedAtSource, number> = {
  first_seen: 0,
  relative_derived: 1,
  date_only: 2,
  exact: 3,
};

function normalizeRoleText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function collectionKind(job: Pick<PublicJob, "title" | "category">): "internship" | "fulltime" {
  return /\bintern(ship)?\b|\bco-?op\b/i.test(`${job.title} ${job.category}`) ? "internship" : "fulltime";
}

export function semanticJobIdentity(job: Pick<PublicJob, "company" | "title" | "location" | "category">): string {
  return [
    normalizeCompanyName(job.company),
    normalizeRoleText(job.title),
    normalizeRoleText(normalizeJobLocation(job.location)),
    collectionKind(job),
  ].join("|");
}

export function isAggregatorJobUrl(value: string): boolean {
  try {
    return AGGREGATOR_HOSTS.has(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function mergeJobs(preferred: PublicJob, other: PublicJob): PublicJob {
  const result = { ...preferred, sources: [...new Set([...preferred.sources, ...other.sources])] };
  if (DATE_PRECISION[other.postedAtSource] > DATE_PRECISION[result.postedAtSource]) {
    result.postedAt = other.postedAt;
    result.postedAtSource = other.postedAtSource;
  }
  if (!result.linkedInUrl && other.linkedInUrl) result.linkedInUrl = other.linkedInUrl;
  if (!result.salary && other.salary) result.salary = other.salary;
  if (!result.employeeCount && other.employeeCount) result.employeeCount = other.employeeCount;
  return result;
}

export function deduplicateCrossSourceJobs(jobs: PublicJob[]): PublicJob[] {
  const results: PublicJob[] = [];
  const bySemanticIdentity = new Map<string, number[]>();

  for (const job of jobs) {
    const key = semanticJobIdentity(job);
    const possibleMatches = bySemanticIdentity.get(key) ?? [];
    const matchIndex = possibleMatches.find((index) => {
      const existing = results[index];
      const sharesSource = existing.sources.some((source) => job.sources.includes(source));
      return !sharesSource && (isAggregatorJobUrl(existing.applyUrl) || isAggregatorJobUrl(job.applyUrl));
    });

    if (matchIndex === undefined) {
      const index = results.push(job) - 1;
      bySemanticIdentity.set(key, [...possibleMatches, index]);
      continue;
    }

    const existing = results[matchIndex];
    const preferred = isAggregatorJobUrl(existing.applyUrl) && !isAggregatorJobUrl(job.applyUrl) ? job : existing;
    const other = preferred === existing ? job : existing;
    results[matchIndex] = mergeJobs(preferred, other);
  }

  return results;
}
