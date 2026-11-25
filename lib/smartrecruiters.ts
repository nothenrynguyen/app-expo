import type { CandidateJob } from "./source-normalization";

type SmartRecruitersJobReference = {
  companyIdentifier: string;
  jobId: string;
  endpoint: string;
};

export type SmartRecruitersPosting = {
  id?: string;
  visibility?: string;
  typeOfEmployment?: { id?: string };
  active?: boolean;
  releasedDate?: string;
  name?: string;
  company?: { identifier?: string; name?: string };
};

export function parseSmartRecruitersJobUrl(value: string): SmartRecruitersJobReference | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hostname.toLowerCase() !== "jobs.smartrecruiters.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 2) return null;
    const [companyIdentifier, posting] = parts;
    const jobId = posting?.match(/^(\d+)(?:-|$)/)?.[1];
    if (!companyIdentifier || !jobId) return null;
    return {
      companyIdentifier,
      jobId,
      endpoint: `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(companyIdentifier)}/postings/${jobId}`,
    };
  } catch {
    return null;
  }
}

export function smartRecruitersOpportunityIdentity(value: string): string | null {
  const reference = parseSmartRecruitersJobUrl(value);
  return reference ? `smartrecruiters:${reference.companyIdentifier.toLowerCase()}:${reference.jobId}` : null;
}

export async function fetchSmartRecruitersPosting(value: string): Promise<SmartRecruitersPosting | null> {
  const reference = parseSmartRecruitersJobUrl(value);
  if (!reference) return null;
  const response = await fetch(reference.endpoint, {
    headers: { accept: "application/json", "user-agent": "empluzzed/0.3" },
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
  const reference = parseSmartRecruitersJobUrl(candidate.applyUrl);
  const verifiedInternship = reference && String(posting.id ?? "") === reference.jobId
    && posting.company?.identifier?.toLowerCase() === reference.companyIdentifier.toLowerCase()
    && posting.active === true && posting.visibility === "PUBLIC" && posting.typeOfEmployment?.id === "intern";
  return {
    ...candidate,
    category: verifiedInternship ? "Internship" : candidate.category,
    postedAt: hasValidReleaseDate ? releasedAt.toISOString() : candidate.postedAt,
    postedAtSource: hasValidReleaseDate ? "exact" : candidate.postedAtSource,
    sourceActive: posting.active ?? candidate.sourceActive,
  };
}
