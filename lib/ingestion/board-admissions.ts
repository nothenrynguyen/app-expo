import { discoverAtsBoard } from "../ats-boards";
import { opportunityIdentity, type CandidateJob } from "../source-normalization";
import type { PublicJob } from "../jobs";

// Diagnostic only. Admission and the publication guard have already made their
// decisions. Prior held jobs count as restorations, never newly discovered jobs.
export function summarizeBoardAdmissions(candidates: Pick<CandidateJob, "company" | "applyUrl" | "source">[],
  current: Pick<PublicJob, "applyUrl">[], previous: Pick<PublicJob, "applyUrl">[]) {
  const active = new Set(current.map(job => opportunityIdentity(job.applyUrl)));
  const prior = new Set(previous.map(job => opportunityIdentity(job.applyUrl)));
  const groups = new Map<string, { board: string; company: string; identities: Set<string> }>();
  for (const candidate of candidates) {
    const board = discoverAtsBoard(candidate.applyUrl, candidate.company, candidate.source);
    const identity = opportunityIdentity(candidate.applyUrl);
    if (!board || !identity) continue;
    const group = groups.get(board.id) ?? { board: board.id, company: board.company, identities: new Set<string>() };
    group.identities.add(identity);
    groups.set(board.id, group);
  }
  return [...groups.values()].map(group => {
    const admitted = [...group.identities].filter(identity => active.has(identity));
    return { board: group.board, company: group.company, candidateOpportunities: group.identities.size,
      proposedCurrent: admitted.length, proposedNew: admitted.filter(identity => !prior.has(identity)).length };
  }).sort((a, b) => b.proposedNew - a.proposedNew || a.board.localeCompare(b.board));
}

export function formatBoardAdmissions(rows: ReturnType<typeof summarizeBoardAdmissions>) {
  const productive = rows.filter(row => row.proposedNew > 0);
  const clean = (value: string) => value.replace(/[\r\n<>|]/g, " ");
  return ["### Proposed direct ATS admissions", "",
    "Unique candidates and admissions for this proposal, before the publication guard. New excludes prior current and held opportunities. These are not published gains.", "",
    "| Employer | Board | Candidates | Proposed current | Proposed new |", "| --- | --- | ---: | ---: | ---: |",
    ...productive.slice(0, 20).map(row => `| ${clean(row.company)} | ${clean(row.board)} | ${row.candidateOpportunities} | ${row.proposedCurrent} | ${row.proposedNew} |`),
    ...(productive.length > 20 ? [`Other productive boards: ${productive.length - 20}. Full counts are retained in the refresh report or blocked artifact.`] : []), ""].join("\n");
}
