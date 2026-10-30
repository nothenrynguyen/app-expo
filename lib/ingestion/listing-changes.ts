import type { PublicJob } from "../jobs";
import { opportunityIdentity } from "../source-normalization";
import type { ScreeningReason } from "./screening";
import type { ListingChangeEvidence } from "./listing-change-evidence";

export type DisappearanceCategory = "confirmed-closed" | "scope-exclusion" | "verification-pending" | "source-unavailable" | "unresolved" | "deduplicated";

function diagnose(reason: RemovalReason, evidence?: ListingChangeEvidence) {
  const checks = evidence?.workdayChecks ?? [];
  const posting = evidence?.postingCheck?.currentRun ? evidence.postingCheck : null;
  const closed = posting?.status === "closed" || checks.some(check => check.status === "closed");
  const live = posting?.status === "live" || checks.some(check => check.status === "live");
  let category: DisappearanceCategory;
  if (closed && !live) category = "confirmed-closed";
  else if (closed && live) category = "unresolved";
  else if (["role", "location", "employer", "expired", "source-permission"].includes(reason) || checks.some(check => check.status === "ineligible")) category = "scope-exclusion";
  else if (reason === "deduplicated") category = "deduplicated";
  else if (reason === "pendingVerification") category = "verification-pending";
  else if (checks.some(check => check.status === "unknown") || posting?.status === "unknown" || posting?.status === "unavailable"
    || evidence?.board?.status === "failed" || evidence?.board?.outcome && evidence.board.outcome !== "healthy"
    || evidence?.sources.some(source => source.status === "failed" || source.outcome && source.outcome !== "healthy")) category = "source-unavailable";
  else category = "unresolved";
  const explanation = {
    "confirmed-closed": "A posting-specific check in this refresh explicitly reported closure.",
    "scope-exclusion": "A recorded role, location, employer, freshness or permission rule, or provider eligibility check, excluded this opening.",
    "verification-pending": "Required evidence was insufficient for publication; closure is not established.",
    "source-unavailable": "A relevant source or posting check was unreliable; closure is not established.",
    "unresolved": closed && live ? "Current posting checks conflict; investigate the exact opening and its aliases."
      : live ? "The posting was checked live but omitted from publication; investigate screening and recovery."
      : "No conclusive posting-specific closure evidence. Board absence or an inactive input alone is insufficient.",
    "deduplicated": "Accepted before deduplication but not retained under this opportunity identity.",
  }[category];
  const nextAction = {
    "confirmed-closed": "No recovery based only on prior publication.",
    "scope-exclusion": "Inspect the recorded policy reason if the exclusion appears incorrect.",
    "verification-pending": "Inspect employer and destination verification evidence before admission.",
    "source-unavailable": "Inspect the exact board/source health and retry after cooldown; do not renew stale evidence.",
    "unresolved": "Compare candidate presence, screening, exact board membership and posting checks; do not label closed or restore automatically.",
    "deduplicated": "Inspect the retained cross-source match before treating this as a lost opening.",
  }[category];
  return { category, explanation, nextAction, requiresInvestigation: ["verification-pending", "source-unavailable", "unresolved"].includes(category) };
}

export type RemovalReason = ScreeningReason | "source-permission" | "application-unavailable" | "deduplicated" | "employer-board-unavailable" | "absent-from-employer-board" | "not-returned-by-sources" | "reason-unavailable";

export function buildListingChanges(input: {
  generatedAt: string;
  previousGeneratedAt: string | null;
  currentSnapshotGeneratedAt?: string;
  previous: PublicJob[];
  current: PublicJob[];
  acceptedBeforeDedup: PublicJob[];
  candidateUrls: Iterable<string>;
  outcomeFor: (url: string) => ScreeningReason | "application-unavailable" | "source-permission" | undefined;
  boardState: (job: PublicJob) => "unavailable" | "absent" | null;
  evidenceFor?: (job: PublicJob) => ListingChangeEvidence;
}) {
  const identityFor = opportunityIdentity;
  if ([...input.previous, ...input.current].some(job => !identityFor(job.applyUrl))) throw new Error("Cannot reconcile a listing without a valid opportunity identity");
  const current = new Set(input.current.map(job => identityFor(job.applyUrl)));
  const previous = new Set(input.previous.map(job => identityFor(job.applyUrl)));
  const currentByIdentity = new Map(input.current.map(job => [identityFor(job.applyUrl), job]));
  const urlChanges = input.previous.flatMap(job => {
    const retained = currentByIdentity.get(identityFor(job.applyUrl));
    return retained && retained.applyUrl !== job.applyUrl ? [{ id: retained.id, previousUrl: job.applyUrl, applyUrl: retained.applyUrl }] : [];
  });
  const accepted = new Set(input.acceptedBeforeDedup.map(job => identityFor(job.applyUrl)));
  const candidates = new Set([...input.candidateUrls].map(identityFor));
  const counts: Partial<Record<RemovalReason, number>> = {};
  const removed = input.previous.filter(job => !current.has(identityFor(job.applyUrl))).map(job => {
    const identity = identityFor(job.applyUrl);
    const board = input.boardState(job);
    // Deduplication is established by actual acceptance before the dedup pass,
    // not inferred merely from a matching title or an absent source row.
    const reason: RemovalReason = accepted.has(identity) ? "deduplicated" : input.outcomeFor(job.applyUrl)
      ?? (board === "unavailable" ? "employer-board-unavailable" : board === "absent" ? "absent-from-employer-board"
        : !candidates.has(identity) ? "not-returned-by-sources" : "reason-unavailable");
    counts[reason] = (counts[reason] ?? 0) + 1;
    return { id: job.id, company: job.company, title: job.title, applyUrl: job.applyUrl, reason };
  });
  const previousRows = Map.groupBy(input.previous, job => identityFor(job.applyUrl));
  const removedOpportunities = [...Map.groupBy(removed, job => identityFor(job.applyUrl)).entries()].map(([identity, rows]) => {
    const aliases = previousRows.get(identity)!;
    const prior = { ...aliases[0], sources: [...new Set(aliases.flatMap(job => job.sources ?? []))] };
    const evidence = input.evidenceFor?.(prior);
    return { identity, ...rows[0], previousIds: rows.map(row => row.id), previousUrls: rows.map(row => row.applyUrl),
      sources: prior.sources ?? [], candidateSeen: candidates.has(identity), evidence: evidence ?? null, ...diagnose(rows[0].reason, evidence) };
  });
  const categoryCounts = Object.fromEntries((["confirmed-closed", "scope-exclusion", "verification-pending", "source-unavailable", "unresolved", "deduplicated"] as const)
    .map(category => [category, removedOpportunities.filter(row => row.category === category).length]));
  const retained = [...previous].filter(identity => current.has(identity)).length;
  const reconciliation = {
    unit: "opportunities" as const, previous: previous.size, current: current.size, retained,
    added: current.size - retained, removed: previous.size - retained, net: current.size - previous.size,
  };
  if (reconciliation.removed !== removedOpportunities.length || Object.values(categoryCounts).reduce((sum, count) => sum + count, 0) !== reconciliation.removed) throw new Error("Listing change reconciliation failed");
  return { version: 2, generatedAt: input.generatedAt, previousGeneratedAt: input.previousGeneratedAt,
    currentSnapshotGeneratedAt: input.currentSnapshotGeneratedAt ?? input.generatedAt,
    reconciliation, categoryCounts, removedOpportunities,
    rowCounts: { previous: input.previous.length, current: input.current.length, net: input.current.length - input.previous.length,
      previousDuplicateRows: input.previous.length - previous.size, currentDuplicateRows: input.current.length - current.size },
    // Compatibility fields below count rows, never unique opportunities.
    added: input.current.filter(job => !previous.has(identityFor(job.applyUrl))).length,
    removedCount: removed.length, counts, removed, urlChanges };
}

export function formatListingChangesSummary(report: ReturnType<typeof buildListingChanges>) {
  const r = report.reconciliation;
  const lines = ["## Listing changes", "", `Proposed openings: ${r.previous} + ${r.added} added - ${r.removed} removed = ${r.current} (net ${r.net}).`,
    `Snapshot rows (proposed): ${report.rowCounts.previous} -> ${report.rowCounts.current}. URL replacements: ${report.urlChanges.length} prior rows.`,
    "", "| Disappearance diagnosis | Openings |", "| --- | ---: |",
    ...Object.entries(report.categoryCounts).map(([category, count]) => `| ${category} | ${count} |`), "",
    "Uncertain omissions are not confirmed closures. After publication: data/listing-changes.json (removedOpportunities). If blocked: the blocked-coverage Actions artifact (listingChanges.removedOpportunities).", ""];
  const pending = report.removedOpportunities.filter(row => row.requiresInvestigation);
  for (const row of pending.slice(0, 10)) lines.push(`- ${row.company.replace(/[\r\n<>]/g, " ")}: ${row.category}. ${row.nextAction}`);
  if (pending.length > 10) lines.push(`See the report for ${pending.length - 10} additional cases.`);
  return lines.join("\n") + "\n";
}
