import { discoverAtsBoard, type AtsBoardResult } from "../ats-boards";
import { normalizeCompanyName } from "../company-quality";
import { jobIdentity } from "../source-normalization";

function postingIdentity(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.hostname === "job-boards.greenhouse.io") url.hostname = "boards.greenhouse.io";
    return jobIdentity(url.href);
  } catch { return null; }
}

// Apply current exact employer evidence across discovery aliases, never across
// companies or unrelated boards on the same shared ATS host.
export function currentAtsExperienceConflict(
  job: { company: string; applyUrl: string }, boards: Map<string, AtsBoardResult>,
): boolean {
  const board = discoverAtsBoard(job.applyUrl, job.company, "Eligibility check");
  const result = board && boards.get(board.id);
  const identity = postingIdentity(job.applyUrl);
  return !!result && !!identity
    && normalizeCompanyName(result.board.company) === normalizeCompanyName(job.company)
    && (result.experienceConflictUrls ?? []).some(url => postingIdentity(url) === identity && result.liveIdentities.has(jobIdentity(url) ?? ""));
}
