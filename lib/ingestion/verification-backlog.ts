import { opportunityIdentity, type CandidateJob } from "../source-normalization";
import type { ScreeningReason } from "./screening";

export function buildVerificationBacklog(input: {
  candidates: CandidateJob[]; acceptedUrls: string[];
  outcomeFor: (url: string) => ScreeningReason | undefined;
}) {
  const accepted = new Set(input.acceptedUrls.map(opportunityIdentity).filter(Boolean));
  const pending = new Map<string, CandidateJob>();
  for (const row of input.candidates) {
    const id = opportunityIdentity(row.applyUrl);
    if (id && !accepted.has(id) && input.outcomeFor(row.applyUrl) === "pendingVerification") pending.set(id, row);
  }
  return {
    unit: "unique_opportunities_present_in_candidate_batch",
    total: pending.size,
    byEmployer: [...Map.groupBy([...pending.values()], row => row.company)]
      .map(([company, rows]) => ({company, opportunities: rows.length}))
      .sort((a,b) => b.opportunities-a.opportunities || a.company.localeCompare(b.company)).slice(0,30),
  };
}
