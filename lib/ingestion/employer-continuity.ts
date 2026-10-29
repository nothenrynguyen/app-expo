import { employerBoardIdentity } from "./reviewed-employer-coverage";
import { normalizeCompanyName, type QualityDecision } from "../company-quality";
import type { CandidateJob } from "../source-normalization";

export type EmployerContinuity = {version: 1; baselineCommit: string; reviewedAt: string; employers: Array<{company: string; board: string}>};

// Prior publication records a prior admission decision, not a new independent
// employer audit. A record never grants feed rights or overrides explicit blocks.
export function continuityMatcher(data: EmployerContinuity) {
  if (data.version !== 1 || !Array.isArray(data.employers) || !data.baselineCommit || !Number.isFinite(Date.parse(data.reviewedAt))) throw new Error("Invalid employer continuity registry");
  const keys = new Set(data.employers.map(record => {
    if (typeof record.company !== "string" || !record.company.trim() || typeof record.board !== "string" || !record.board.trim()) throw new Error("Invalid employer continuity record");
    return `${normalizeCompanyName(record.company)}|${record.board}`;
  }));
  return (candidate: Pick<CandidateJob, "company" | "applyUrl">) => {
    const board = employerBoardIdentity(candidate.applyUrl);
    return !!board && keys.has(`${normalizeCompanyName(candidate.company)}|${board}`);
  };
}

export function admitWithCurrentEmployerEvidence(decision: QualityDecision, live: boolean): QualityDecision {
  if (!live || decision.status !== "quarantined" || decision.coverageExceptionAllowed !== true) return decision;
  return {...decision, status: "approved", reason: "Current employer-board listing evidence; workforce size is not an admission requirement."};
}
