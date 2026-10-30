import { isInCollection } from "./job-collections";
import type { JobsSnapshot } from "./jobs";
import { countHealth, type HealthCounts } from "./ingestion/source-health";
import type { RefreshReport } from "./ingestion/types";

export type JobsSummary = {
  generatedAt: string;
  totalJobs: number;
  internships: number;
  fulltime: number;
  screenedOut: number | null;
  closedPostingsCaught: number | null;
  screening: JobsSnapshot["screening"];
  activeSources: number;
  healthySources: number;
  health?: { feeds: HealthCounts; employers: HealthCounts; recovery: HealthCounts };
};

export function buildJobsSummary(snapshot: JobsSnapshot, report?: RefreshReport): JobsSummary {
  return {
    generatedAt: snapshot.generatedAt,
    totalJobs: snapshot.jobs.length,
    internships: snapshot.jobs.filter((job) => isInCollection(job, "internships")).length,
    fulltime: snapshot.jobs.filter((job) => isInCollection(job, "fulltime")).length,
    screenedOut: snapshot.screening?.excluded ?? null,
    closedPostingsCaught: snapshot.screening?.reasons.closed ?? null,
    screening: snapshot.screening ?? null,
    activeSources: snapshot.sourceHealth.length,
    healthySources: snapshot.sourceHealth.filter((source) => source.status === "ok").length,
    ...(report ? { health: {
      feeds: countHealth(report.sources.records.filter(record => record.kind !== "workday" && record.kind !== "employer_recovery")),
      employers: countHealth(report.boards.records),
      recovery: countHealth(report.sources.records.filter(record => record.kind === "employer_recovery")),
    } } : {}),
  };
}
