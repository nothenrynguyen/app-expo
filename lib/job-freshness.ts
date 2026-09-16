import type { CandidateJob } from "./source-normalization";

export const MAX_EXACT_INTERNSHIP_AGE_DAYS = 180;

export function getFreshnessRejection(
  candidate: Pick<CandidateJob, "title" | "category" | "term" | "postedAt" | "postedAtSource" | "sourceActive">,
  now = new Date(),
): string | null {
  if (candidate.sourceActive === false) return "The employer career system marks this posting as closed.";
  const isInternship = /\bintern(ship)?\b|\bco-?op\b/i.test(`${candidate.title} ${candidate.category}`);
  if (!isInternship) return null;

  const term = candidate.term.match(/^(Winter|Spring|Summer|Fall)\s+(20\d{2})$/i);
  if (term) {
    const year = Number(term[2]);
    const cutoffBySeason: Record<string, Date> = {
      winter: new Date(Date.UTC(year, 3, 1)),
      spring: new Date(Date.UTC(year, 5, 15)),
      summer: new Date(Date.UTC(year, 8, 1)),
      fall: new Date(Date.UTC(year + 1, 0, 15)),
    };
    const cutoff = cutoffBySeason[term[1].toLowerCase()];
    if (now.getTime() >= cutoff.getTime()) {
      return `${term[1][0].toUpperCase()}${term[1].slice(1).toLowerCase()} ${year} has already ended.`;
    }
  }

  if (candidate.postedAtSource !== "exact") return null;
  const postedAt = new Date(candidate.postedAt).getTime();
  if (!Number.isFinite(postedAt)) return null;
  const ageDays = Math.floor((now.getTime() - postedAt) / 86_400_000);
  return ageDays > MAX_EXACT_INTERNSHIP_AGE_DAYS
    ? `The employer's original posting date is ${ageDays} days old, beyond the ${MAX_EXACT_INTERNSHIP_AGE_DAYS}-day internship limit.`
    : null;
}
