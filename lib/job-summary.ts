import { isInCollection } from "./job-collections";
import type { JobsSnapshot } from "./jobs";

export type JobsSummary = {
  generatedAt: string;
  totalJobs: number;
  internships: number;
  fulltime: number;
  screenedOut: number;
  closedPostingsCaught: number;
  activeSources: number;
  healthySources: number;
};

export function buildJobsSummary(snapshot: JobsSnapshot, cleanupStats: { closedPostingsCaught?: number } = {}): JobsSummary {
  return {
    generatedAt: snapshot.generatedAt,
    totalJobs: snapshot.jobs.length,
    internships: snapshot.jobs.filter((job) => isInCollection(job, "internships")).length,
    fulltime: snapshot.jobs.filter((job) => isInCollection(job, "fulltime")).length,
    screenedOut: snapshot.quarantinedCount,
    closedPostingsCaught: cleanupStats.closedPostingsCaught ?? 0,
    activeSources: snapshot.sourceHealth.length,
    healthySources: snapshot.sourceHealth.filter((source) => source.status === "ok").length,
  };
}
