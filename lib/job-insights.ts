import { isInCollection } from "./job-collections";
import { classifyJobMetros, getSupportedJobRegions, JOB_METROS, JOB_REGIONS, type JobMetro, type JobRegion } from "./job-locations";
import type { JobsSnapshot, PublicJob } from "./jobs";
import { classifyRoleArea, ROLE_AREAS, type RoleArea } from "./role-areas";

export const INSIGHTS_HISTORY_LIMIT = 365;

type WorkMode = PublicJob["workMode"];
type TrackedRoleArea = Exclude<RoleArea, "all">;

export type JobInsightsDay = {
  date: string;
  openRoles: number;
  internships: number;
  fulltime: number;
  freshListings7d: number;
  activeCompanies: number;
  screenedOut: number;
  closedPostingsCaught: number;
  workModes: Record<WorkMode, number>;
  regions: Record<JobRegion, number>;
  metros: Record<JobMetro, number>;
  roleAreas: Record<TrackedRoleArea, number>;
};

export type JobInsightsHistory = {
  version: 1;
  days: JobInsightsDay[];
};

function zeroCounts<T extends string>(values: readonly T[]): Record<T, number> {
  return Object.fromEntries(values.map((value) => [value, 0])) as Record<T, number>;
}

export function buildJobInsightsDay(
  snapshot: JobsSnapshot,
  cleanupStats: { closedPostingsCaught?: number } = {},
): JobInsightsDay {
  const capturedAt = new Date(snapshot.generatedAt);
  const freshCutoff = capturedAt.getTime() - 7 * 86_400_000;
  const workModes = zeroCounts<WorkMode>(["remote", "hybrid", "in_person", "unknown"]);
  const regions = zeroCounts<JobRegion>(JOB_REGIONS.map(([value]) => value));
  const metros = zeroCounts<JobMetro>(JOB_METROS.map(([value]) => value));
  const roleAreas = zeroCounts<TrackedRoleArea>(
    ROLE_AREAS.filter((area) => area.value !== "all").map((area) => area.value as TrackedRoleArea),
  );

  for (const job of snapshot.jobs) {
    workModes[job.workMode] += 1;
    for (const region of job.regions ?? getSupportedJobRegions(job.location)) regions[region] += 1;
    for (const metro of job.metros ?? classifyJobMetros(job.location)) metros[metro] += 1;
    const roleArea = classifyRoleArea(job);
    if (roleArea) roleAreas[roleArea] += 1;
  }

  return {
    date: snapshot.generatedAt.slice(0, 10),
    openRoles: snapshot.jobs.length,
    internships: snapshot.jobs.filter((job) => isInCollection(job, "internships")).length,
    fulltime: snapshot.jobs.filter((job) => isInCollection(job, "fulltime")).length,
    freshListings7d: snapshot.jobs.filter((job) => {
      const postedAt = new Date(job.postedAt).getTime();
      return Number.isFinite(postedAt) && postedAt >= freshCutoff && postedAt <= capturedAt.getTime();
    }).length,
    activeCompanies: new Set(snapshot.jobs.map((job) => job.company.toLowerCase())).size,
    screenedOut: snapshot.quarantinedCount,
    closedPostingsCaught: cleanupStats.closedPostingsCaught ?? 0,
    workModes,
    regions,
    metros,
    roleAreas,
  };
}

export function updateJobInsightsHistory(
  history: JobInsightsHistory,
  day: JobInsightsDay,
  limit = INSIGHTS_HISTORY_LIMIT,
): JobInsightsHistory {
  const daysByDate = new Map(history.days.map((entry) => [entry.date, entry]));
  daysByDate.set(day.date, day);
  return {
    version: 1,
    days: [...daysByDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-limit),
  };
}
