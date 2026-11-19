import { opportunityIdentity, type CandidateJob } from "../source-normalization";
import type { ScreeningReason } from "./screening";
import { employerBoardIdentity } from "./reviewed-employer-coverage";

function blocker(details: Array<{reason: ScreeningReason; detail: string | null}>) {
  const text = details.filter(row => row.reason === "pendingVerification").map(row => row.detail ?? "").join("\n");
  // A later availability decision demonstrates that at least one source passed
  // identity review. Do not let another source's earlier identity hold hide it.
  if (/availability|restore this held listing/i.test(text)) return "availability";
  if (/reviewed employer page/i.test(text)) return "career-page-evidence";
  if (/direct application destination/i.test(text)) return "application-destination";
  if (/early-career title/i.test(text)) return "early-career-evidence";
  if (/employer identity/i.test(text)) return "employer-identity";
  return "other-verification";
}

export function buildVerificationBacklog(input: {
  candidates: CandidateJob[]; acceptedUrls: string[];
  outcomeFor: (url: string) => ScreeningReason | undefined;
  decisionsFor?: (url: string) => Array<{reason: ScreeningReason; detail: string | null}>;
}) {
  const accepted = new Set(input.acceptedUrls.map(opportunityIdentity).filter(Boolean));
  const pending = new Map<string, CandidateJob>();
  for (const row of input.candidates) {
    const id = opportunityIdentity(row.applyUrl);
    if (id && !accepted.has(id) && input.outcomeFor(row.applyUrl) === "pendingVerification") pending.set(id, row);
  }
  const rows = [...pending.values()].map(row => ({...row,
    board: employerBoardIdentity(row.applyUrl) ?? new URL(row.applyUrl).hostname,
    blocker: blocker(input.decisionsFor?.(row.applyUrl) ?? []),
  }));
  const counts = (values: string[]) => [...Map.groupBy(values, value => value)]
    .map(([key, items]) => ({key, opportunities: items.length}))
    .sort((a,b) => b.opportunities-a.opportunities || a.key.localeCompare(b.key));
  return {
    unit: "unique_opportunities_present_in_candidate_batch",
    total: pending.size,
    byBlocker: counts(rows.map(row => row.blocker)),
    byBoard: counts(rows.map(row => row.board)).slice(0, 50),
    byEmployer: [...Map.groupBy([...pending.values()], row => row.company)]
      .map(([company, rows]) => ({company, opportunities: rows.length}))
      .sort((a,b) => b.opportunities-a.opportunities || a.company.localeCompare(b.company)).slice(0,30),
  };
}
