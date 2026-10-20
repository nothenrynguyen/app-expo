import type { PublicJob } from "../jobs";
import { jobIdentity } from "../source-normalization";
import { getJobLocationMetadata } from "../job-location-policy";
import { createAtsBoard, discoverAtsBoard, type AtsBoardResult } from "../ats-boards";
import type { BoardRefreshDiagnostic } from "./types";

export function boardRecoveryPolicy(records: BoardRefreshDiagnostic[], results: Map<string, AtsBoardResult>) {
  const failed = new Set(records.filter(board => board.status === "failed" && board.provider !== "workday" && !/^(?:404|410)\b/.test(board.message ?? ""))
    .map(board => createAtsBoard({ ...board, provider: board.provider as "greenhouse" | "lever" | "ashby" }).id));
  return {
    hasFailures: failed.size > 0,
    affected(job: PublicJob) {
      const board = discoverAtsBoard(job.applyUrl, job.company, "recovery");
      return !!board && failed.has(board.id);
    },
    confirmedClosed(job: PublicJob) {
      const board = discoverAtsBoard(job.applyUrl, job.company, "recovery");
      const result = board && results.get(board.id);
      const identity = jobIdentity(job.applyUrl);
      return !!result && !!identity && !result.liveIdentities.has(identity);
    },
  };
}

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
