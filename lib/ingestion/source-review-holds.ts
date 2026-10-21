import { jobIdentity, type CandidateJob } from "../source-normalization";
import type { JobSource } from "../source-catalog";
import { workdayRequisitionIdentity } from "../job-dedup";

export function sourceReviewHoldIdentity(url: string): string | null {
  return workdayRequisitionIdentity(url) ?? jobIdentity(url);
}

// Explicit local review decisions apply across feeds so another source cannot
// silently reintroduce a destination whose application status is unresolved.
export function partitionSourceReviewHolds(candidates: CandidateJob[], holds: NonNullable<JobSource["reviewHolds"]>) {
  const reasons = new Map(holds.flatMap(hold => {
    const id = sourceReviewHoldIdentity(hold.url);
    return id ? [[id, hold.reason] as const] : [];
  }));
  const accepted: CandidateJob[] = [];
  const held: Array<{ candidate: CandidateJob; reason: string }> = [];
  for (const candidate of candidates) {
    const reason = reasons.get(sourceReviewHoldIdentity(candidate.applyUrl) ?? "");
    if (reason !== undefined) held.push({ candidate, reason });
    else accepted.push(candidate);
  }
  return { accepted, held };
}
