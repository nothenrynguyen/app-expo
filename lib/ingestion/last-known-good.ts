import type { PublicJob } from "../jobs";
import { jobIdentity } from "../source-normalization";

export function preserveLastKnownGoodJobs(
  current: Map<string, PublicJob>,
  previous: PublicJob[],
  prepare: (job: PublicJob) => PublicJob | null,
): number {
  let preserved = 0;
  for (const prior of previous) {
    const identity = jobIdentity(prior.applyUrl);
    if (!identity || current.has(identity)) continue;
    const job = prepare(prior);
    if (!job) continue;
    current.set(identity, job);
    preserved += 1;
  }
  return preserved;
}
