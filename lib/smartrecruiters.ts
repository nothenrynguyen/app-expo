import type { CandidateJob } from "./source-normalization";

export type SmartRecruitersJobReference = {
  companyIdentifier: string;
  jobId: string;
  endpoint: string;
};

export type SmartRecruitersPosting = {
  active?: boolean;
  releasedDate?: string;
  name?: string;
  company?: { identifier?: string; name?: string };
};

export function parseSmartRecruitersJobUrl(value: string): SmartRecruitersJobReference | null {
  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase() !== "jobs.smartrecruiters.com") return null;
    const [companyIdentifier, jobId] = url.pathname.split("/").filter(Boolean);
    if (!companyIdentifier || !/^\d+$/.test(jobId ?? "")) return null;
    return {
      companyIdentifier,
      jobId,
      endpoint: `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(companyIdentifier)}/postings/${jobId}`,
    };
  } catch {
    return null;
  }
}

export async function fetchSmartRecruitersPosting(value: string): Promise<SmartRecruitersPosting | null> {
  const reference = parseSmartRecruitersJobUrl(value);
  if (!reference) return null;
  const response = await fetch(reference.endpoint, {
    headers: { accept: "application/json", "user-agent": "App-Expo/0.3" },
    signal: AbortSignal.timeout(12_000),
  });
  if (response.status === 404 || response.status === 410) return { active: false };
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<SmartRecruitersPosting>;
}

export function applySmartRecruitersPosting(
  candidate: CandidateJob,
  posting: SmartRecruitersPosting,
): CandidateJob {
  const releasedAt = posting.releasedDate ? new Date(posting.releasedDate) : null;
  const hasValidReleaseDate = releasedAt && Number.isFinite(releasedAt.getTime());
  return {
    ...candidate,
    postedAt: hasValidReleaseDate ? releasedAt.toISOString() : candidate.postedAt,
    postedAtSource: hasValidReleaseDate ? "exact" : candidate.postedAtSource,
    sourceActive: posting.active ?? candidate.sourceActive,
  };
}
