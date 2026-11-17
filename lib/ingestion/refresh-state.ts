import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ListingHealthFile } from "../listing-health";
import type { ScopedListingCache } from "./scoped-listing-cache";
import type { SourceVerificationTargets } from "./source-verification";
import type { WorkdayContinuity } from "./workday-continuity";
import type { WorkdaySchedule } from "./workday-schedule";
import type { RecoveryState } from "./employer-recovery";

// Only observations and queue state may survive a rejected public snapshot.
export const REFRESH_STATE_PATHS = [
  "data/listing-health.json", "data/scoped-listing-health.json",
  "data/source-verification-targets.json", "data/workday-continuity.json",
  "data/workday-schedule.json", "data/employer-recovery-state.json",
] as const;

export async function persistRefreshState(root: string, state: {
  listingHealth: ListingHealthFile; scopedCache: ScopedListingCache;
  sourceTargets: SourceVerificationTargets; workdayContinuity: WorkdayContinuity;
  workdaySchedule: WorkdaySchedule; recoveryState: RecoveryState;
}) {
  const values = [state.listingHealth, state.scopedCache, state.sourceTargets,
    state.workdayContinuity, state.workdaySchedule, state.recoveryState];
  await mkdir(path.join(root, "data"), { recursive: true });
  for (const [index, relative] of REFRESH_STATE_PATHS.entries()) {
    const file = path.join(root, relative);
    await writeFile(`${file}.tmp`, `${JSON.stringify(values[index], null, 2)}\n`);
    await rename(`${file}.tmp`, file);
  }
}
