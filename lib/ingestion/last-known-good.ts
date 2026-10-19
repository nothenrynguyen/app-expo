import type { PublicJob } from "../jobs";
import { jobIdentity } from "../source-normalization";
import { getJobLocationMetadata } from "../job-location-policy";

export function preserveLastKnownGoodJobs(
  current: Map<string, PublicJob>,
  previous: PublicJob[],
  prepare: (job: PublicJob) => PublicJob | null,
  isClosed: (job: PublicJob) => boolean = () => false,
): number {
  let preserved = 0;
  for (const prior of previous) {
    // Federal announcements require a fresh official-page check each run.
    if (prior.federal || /(?:^|\.)usajobs\.gov\//i.test(prior.applyUrl.replace(/^https?:\/\//, ""))) continue;
    const identity = jobIdentity(prior.applyUrl);
    if (!identity || current.has(identity) || isClosed(prior)) continue;
    const job = prepare(prior);
    if (!job || !getJobLocationMetadata(job).eligible) continue;
    current.set(identity, job);
    preserved += 1;
  }
  return preserved;
}
