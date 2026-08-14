import type { CandidateJob } from "./source-normalization";

export const MAX_EXACT_INTERNSHIP_AGE_DAYS = 180;

export function getFreshnessRejection(
  candidate: Pick<CandidateJob, "title" | "category" | "postedAt" | "postedAtSource" | "sourceActive">,
  now = new Date(),
): string | null {
  if (candidate.sourceActive === false) return "The employer career system marks this posting as closed.";
  const isInternship = /\bintern(ship)?\b|\bco-?op\b/i.test(`${candidate.title} ${candidate.category}`);
  if (!isInternship || candidate.postedAtSource !== "exact") return null;
  const postedAt = new Date(candidate.postedAt).getTime();
  if (!Number.isFinite(postedAt)) return null;
  const ageDays = Math.floor((now.getTime() - postedAt) / 86_400_000);
  return ageDays > MAX_EXACT_INTERNSHIP_AGE_DAYS
    ? `The employer's original posting date is ${ageDays} days old, beyond the ${MAX_EXACT_INTERNSHIP_AGE_DAYS}-day internship limit.`
    : null;
}
