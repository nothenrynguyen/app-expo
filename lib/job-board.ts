import { hasCompanyTier, type CompanyTier } from "./company-tiers";
import { isInCollection } from "./job-collections";
import {
  classifyJobMetros,
  getSupportedJobRegions,
  JOB_METROS,
  type JobMetro,
  type JobRegion,
} from "./job-locations";
import type { PublicJob } from "./jobs";
import { matchesRoleArea, type RoleArea } from "./role-areas";

export type JobCollection = "internships" | "fulltime";

export type JobBoardFilters = {
  type: JobCollection;
  roleArea: RoleArea;
  query: string;
  regions: readonly JobRegion[];
  metros: readonly JobMetro[];
  modes: readonly string[];
  terms: readonly string[];
  companyTiers: readonly CompanyTier[];
  savedOnly: boolean;
  savedJobIds: ReadonlySet<string>;
};

export function filterJobs(jobs: readonly PublicJob[], filters: JobBoardFilters): PublicJob[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return jobs
    .filter((job) => {
      const search = `${job.company} ${job.title} ${job.location}`.toLowerCase();
      const jobRegions = job.regions ?? getSupportedJobRegions(job.location);
      const jobMetros = job.metros ?? classifyJobMetros(job.location);

      return isInCollection(job, filters.type)
        && (!normalizedQuery || search.includes(normalizedQuery))
        && matchesRoleArea(job, filters.roleArea)
        && (filters.regions.length === 0 || filters.regions.some((region) => jobRegions.includes(region)))
        && (filters.metros.length === 0 || filters.metros.some((metro) => jobMetros.includes(metro)))
        && (filters.modes.length === 0 || filters.modes.includes(job.workMode))
        && (filters.terms.length === 0 || filters.terms.includes(job.term))
        && (filters.companyTiers.length === 0 || filters.companyTiers.some((tier) => hasCompanyTier(job.company, tier)))
        && (!filters.savedOnly || filters.savedJobIds.has(job.id));
    })
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
}

export function getJobTerms(jobs: readonly PublicJob[]): string[] {
  return [...new Set(jobs.map((job) => job.term).filter((term) => term !== "Not stated"))].sort();
}

export function getAvailableMetroOptions(jobs: readonly PublicJob[], type: JobCollection, regions: readonly JobRegion[]) {
  const available = new Set(
    jobs
      .filter((job) => isInCollection(job, type))
      .filter((job) => regions.length === 0 || regions.some((region) => (job.regions ?? getSupportedJobRegions(job.location)).includes(region)))
      .flatMap((job) => job.metros ?? classifyJobMetros(job.location)),
  );

  return JOB_METROS.filter(([metro]) => available.has(metro));
}

export function countSavedJobs(jobs: readonly PublicJob[], type: JobCollection, savedJobIds: ReadonlySet<string>): number {
  return jobs.filter((job) => isInCollection(job, type) && savedJobIds.has(job.id)).length;
}
