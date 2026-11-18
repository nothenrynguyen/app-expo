import type { JobSource } from "../source-catalog";
import type { CandidateJob } from "../source-normalization";
import type { BoardRefreshDiagnostic, SourceRefreshDiagnostic } from "./types";
import { workdayOpportunityIdentity } from "../workday-identity";
import { employerBoardIdentity } from "./reviewed-employer-coverage";

export type TrustedFeedState = Record<string, { firstSeenAt: string; expiresAt: string }>;

// This grants temporary availability evidence only. Employer quality, scope,
// permissions, closures and admission checks remain the caller's responsibility.
export function trustedWorkdayFeedPolicy(input: {
  sources: JobSource[]; diagnostics: SourceRefreshDiagnostic[];
  boards: BoardRefreshDiagnostic[]; candidates: CandidateJob[];
  state: TrustedFeedState; now: Date;
}) {
  const { now } = input;
  if (!input.state || typeof input.state !== "object" || Array.isArray(input.state)
    || Object.entries(input.state).some(([key, row]) => !key.startsWith("workday:") || !row
      || !Number.isFinite(Date.parse(row.firstSeenAt)) || !Number.isFinite(Date.parse(row.expiresAt))
      || Date.parse(row.firstSeenAt) > now.getTime())) {
    throw new Error("Invalid trusted-feed observation state");
  }
  const allowed = new Map(input.sources.filter(source => source.active && source.workdayFeedFallback)
    .map(source => [source.name, source]));
  const healthy = new Set(input.diagnostics.filter(row => row.status === "ok" && row.rows > 0
    && (!row.outcome || row.outcome === "healthy") && !row.detailFailures).map(row => row.name));
  const outages = new Set(input.boards.filter(row => row.provider === "workday" && row.id
    && !/^(?:404|410)\b/.test(row.message ?? "") && (row.status === "failed"
      || ["cooldown", "rate_limited", "unavailable", "partial"].includes(row.outcome ?? ""))).map(row => row.id));
  const state = structuredClone(input.state);
  const observations = new WeakMap<CandidateJob, { kind: "trusted-feed"; source: string; observedAt: string; expiresAt: string }>();
  const counts = { observed: 0, eligible: 0, expired: 0 };
  for (const candidate of input.candidates) {
    const key = workdayOpportunityIdentity(candidate.applyUrl);
    if (!key || !allowed.has(candidate.source) || !healthy.has(candidate.source) || candidate.sourceActive === false) continue;
    const first = state[key]?.firstSeenAt ?? now.toISOString();
    counts.observed += 1;
    const dated = candidate.postedAtSource === "exact" || candidate.postedAtSource === "date_only";
    const posted = Date.parse(candidate.postedAt);
    // Neither a repeated fetch, changed title nor a different feed renews the
    // first-observation deadline. Missing reliable dates get a shorter grace.
    const limit = Math.min(Date.parse(first) + (dated ? 7 : 3) * 86_400_000,
      dated ? posted + 14 * 86_400_000 : Infinity);
    const deadline = state[key] ? Math.min(Date.parse(state[key].expiresAt), limit) : limit;
    if (Number.isFinite(deadline)) state[key] = { firstSeenAt: first, expiresAt: new Date(deadline).toISOString() };
    if (!Number.isFinite(deadline) || dated && (!Number.isFinite(posted) || posted > now.getTime()) || deadline <= now.getTime()) {
      counts.expired += 1;
      continue;
    }
    if (!outages.has(employerBoardIdentity(candidate.applyUrl) ?? "")) continue;
    counts.eligible += 1;
    observations.set(candidate, { kind: "trusted-feed", source: candidate.source,
      observedAt: now.toISOString(), expiresAt: new Date(deadline).toISOString() });
  }
  return { state, counts, evidenceFor: (candidate: CandidateJob) => observations.get(candidate) };
}
