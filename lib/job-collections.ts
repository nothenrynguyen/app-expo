import type { PublicJob } from "./jobs";

export type JobCollection = "internships" | "fulltime";

export function isFulltime(job: PublicJob): boolean {
  const text = `${job.title} ${job.category}`;
  return !/\bintern(ship)?\b|\bco-?op\b/i.test(job.title)
    && (/\bnew grad(uate)?\b|\bearly career\b|\bentry[- ]level\b|\bcollege grad\b|\buniversity grad(uate)?\b/i.test(text) || job.category === "New grad");
}

export function isInternship(job: PublicJob): boolean {
  return !isFulltime(job) && (/\bintern(ship)?\b|\bco-?op\b/i.test(job.title) || /2027/i.test(`${job.title} ${job.term}`));
}

export function isInCollection(job: PublicJob, collection: JobCollection): boolean {
  return collection === "internships" ? isInternship(job) : isFulltime(job);
}
