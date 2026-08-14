import { isInCollection } from "./job-collections";
import type { JobsSnapshot } from "./jobs";

export type JobsSummary = {
  generatedAt: string;
  totalJobs: number;
  internships: number;
  fulltime: number;
  activeSources: number;
  healthySources: number;
};

export function buildJobsSummary(snapshot: JobsSnapshot): JobsSummary {
  return {
    generatedAt: snapshot.generatedAt,
    totalJobs: snapshot.jobs.length,
    internships: snapshot.jobs.filter((job) => isInCollection(job, "internships")).length,
    fulltime: snapshot.jobs.filter((job) => isInCollection(job, "fulltime")).length,
    activeSources: snapshot.sourceHealth.length,
    healthySources: snapshot.sourceHealth.filter((source) => source.status === "ok").length,
  };
}
