import type { PublicJob } from "../jobs";
import type { AtsBoardResult } from "../ats-boards";
import { discoverAtsBoard } from "../ats-boards";
import { jobIdentity, opportunityIdentity } from "../source-normalization";
import { workdayEvidenceKey, type WorkdayContinuity, type WorkdayCheck } from "./workday-continuity";
import type { RecoveryState } from "./employer-recovery";
import type { ListingHealthFile } from "../listing-health";
import type { ScopedListingCache } from "./scoped-listing-cache";
import { sourceVerificationKey } from "./source-verification";

export function lastVerificationAt(job: PublicJob, now: Date, input: {
  workdayCache: WorkdayContinuity; recoveryState: RecoveryState; listingHealth: ListingHealthFile;
  scopedCache: ScopedListingCache; boardResults: Map<string, AtsBoardResult>;
  workdayChecks?: WorkdayCheck[];
  careerChecks?: Map<string,{company:string;checkedAt:string}>;
}): string | null {
  const dates: Array<string | null | undefined> = [job.lastVerifiedAt, job.verification?.lastVerifiedAt];
  const career=input.careerChecks?.get(opportunityIdentity(job.applyUrl)??"");
  if(career?.company===job.company)dates.push(career.checkedAt);
  const key = workdayEvidenceKey(job.applyUrl);
  const exact = key && input.workdayCache[key];
  if (exact && exact.job.company === job.company && workdayEvidenceKey(exact.job.applyUrl) === key) dates.push(exact.checkedAt);
  if (key && input.workdayChecks?.some(check => check.status === "live" && workdayEvidenceKey(check.url) === key)) dates.push(now.toISOString());
  const recovery = input.recoveryState[opportunityIdentity(job.applyUrl)!];
  if (recovery?.status === "live" && recovery.candidate?.company === job.company
    && opportunityIdentity(recovery.candidate.applyUrl) === opportunityIdentity(job.applyUrl)) dates.push(recovery.checkedAt);
  // Legacy generic/scoped Workday keys can merge different sites. They cannot
  // establish a public exact-listing verification timestamp.
  if (!key) {
    const health = input.listingHealth[jobIdentity(job.applyUrl) ?? ""];
    if (health?.status === "live" && opportunityIdentity(health.url) === opportunityIdentity(job.applyUrl)) dates.push(health.checkedAt);
    for (const id of [jobIdentity(job.applyUrl), sourceVerificationKey(job.applyUrl)]) {
      const scoped = id && input.scopedCache[id];
      if (scoped && scoped.status === "live") dates.push(scoped.checkedAt);
    }
  }
  const board = discoverAtsBoard(job.applyUrl, job.company, "Verification time");
  if (board && input.boardResults.get(board.id)?.liveIdentities.has(jobIdentity(job.applyUrl) ?? "")) dates.push(now.toISOString());
  if (job.federal) dates.push(job.federal.retrievedAt);
  return dates.filter((d): d is string => !!d && Number.isFinite(Date.parse(d)) && Date.parse(d) <= now.getTime())
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

export function canRestoreHeldJob(prior: PublicJob | undefined, positiveAt: string | null, now: Date): boolean {
  if (prior?.verification?.status !== "awaiting") return true;
  const positive = Date.parse(positiveAt ?? "");
  return Number.isFinite(positive) && positive > Date.parse(prior.verification.checkedAt)
    && positive <= now.getTime() && now.getTime() - positive < 24 * 3600_000;
}
