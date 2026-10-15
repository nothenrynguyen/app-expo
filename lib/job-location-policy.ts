import { classifyJobMetros, getSupportedJobRegions } from "./job-locations";

// Country eligibility is shared by ingestion, recovery, and browser filtering.
// Metros only narrow search results and never determine board eligibility.
export function getJobLocationMetadata(job: { location: string }) {
  const regions = getSupportedJobRegions(job.location);
  return { eligible: regions.length > 0, regions, metros: classifyJobMetros(job.location) };
}
