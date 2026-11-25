import type { PublicJob } from "../jobs";
import { opportunityIdentity } from "../source-normalization";
import type { buildListingChanges } from "./listing-changes";

type Changes = ReturnType<typeof buildListingChanges>;
type Removal = Changes["removedOpportunities"][number];

export function outageHoldSource(row: Removal): string | null {
  const e = row.evidence;
  if (!e || e.board?.retired || ["confirmed-closed", "scope-exclusion", "deduplicated"].includes(row.category)) return null;
  if (e.screening.some(s => ["closed", "role", "location", "employer", "expired", "source-permission"].includes(s.reason))
    || e.workdayChecks.some(c => c.status === "closed" || c.status === "ineligible")
    || e.postingCheck?.currentRun && e.postingCheck.status === "closed"
    || e.board?.membership === "absent") return null;
  // A known positive result with an unexplained admission failure needs
  // investigation, not an outage exception.
  if (e.workdayChecks.some(c => c.status === "live") || e.postingCheck?.currentRun && e.postingCheck.status === "live"
    || e.board?.membership === "present") return null;
  if (e.recoveryDenial) return "Employer recovery";
  if (e.board?.outage) return e.board.id;
  const failed = e.sources.find(s => s.status === "failed" && s.outage);
  if (failed) return failed.diagnosticName ?? failed.name;
  const posting = e.postingCheck;
  if (posting?.currentRun && posting.status === "unknown" && (posting.httpStatus === null
    || [401, 403, 408, 429].includes(posting.httpStatus) || posting.httpStatus >= 500)) return "Employer posting check";
  return null;
}

export function buildOutageHolds(previous: PublicJob[], changes: Changes, now: Date,
  lastPositiveAt: (job: PublicJob) => string | null = job => job.lastVerifiedAt ?? null): PublicJob[] {
  const prior = new Map(previous.map(job => [opportunityIdentity(job.applyUrl), job]));
  return changes.removedOpportunities.flatMap(row => {
    const source = outageHoldSource(row), job = prior.get(row.identity);
    if (!source || !job) return [];
    const old = job.verification;
    const positive = old?.lastVerifiedAt ?? lastPositiveAt(job);
    const validPositive = positive && Number.isFinite(Date.parse(positive)) && Date.parse(positive) <= now.getTime() ? positive : null;
    return [{...job, lastVerifiedAt: validPositive, verification: {
      status: "awaiting" as const, since: old?.since ?? now.toISOString(), lastVerifiedAt: validPositive,
      checkedAt: now.toISOString(), reason: "source-unavailable" as const, source,
    }}];
  });
}

export function validateOutageHolds(previous: PublicJob[], current: PublicJob[], holds: PublicJob[], changes: Changes, now: Date,
  lastPositiveAt?: (job: PublicJob) => string | null) {
  const expected = new Map(buildOutageHolds(previous, changes, now, lastPositiveAt).map(job => [opportunityIdentity(job.applyUrl), job]));
  const active = new Set(current.map(job => opportunityIdentity(job.applyUrl)));
  const seen = new Set<string | null>();
  for (const job of holds) {
    const id = opportunityIdentity(job.applyUrl), approved = expected.get(id);
    if (!approved || active.has(id) || seen.has(id) || job.id !== approved.id
      || job.verification?.status !== "awaiting" || job.verification.source !== approved.verification?.source
      || job.verification.checkedAt !== now.toISOString() || JSON.stringify(job) !== JSON.stringify(approved)) throw new Error("Unproven outage hold: publication blocked.");
    seen.add(id);
  }
}
