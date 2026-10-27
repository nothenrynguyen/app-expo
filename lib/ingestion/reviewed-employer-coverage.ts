import { evaluateCompanyQuality, normalizeCompanyName, type CompanyTrustEntry, type QualityDecision, type VerifiedCompany } from "../company-quality";
import { getJobLocationMetadata } from "../job-location-policy";
import { getFreshnessRejection } from "../job-freshness";
import { classifyRoleTags } from "../role-areas";
import type { CandidateJob } from "../source-normalization";

// Match an employer-owned ATS site, never a shared hosting domain alone.
export function employerBoardIdentity(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const parts = url.pathname.split("/").filter(Boolean).map(part => decodeURIComponent(part).toLowerCase());
    const host = url.hostname.toLowerCase();
    if (host.endsWith(".myworkdayjobs.com")) {
      const job = parts.indexOf("job");
      return job > 0 && parts[job + 1] ? `workday:${host}:${parts[job - 1]}` : null;
    }
    if (!parts[0]) return null;
    if (["boards.greenhouse.io", "job-boards.greenhouse.io", "job-boards.eu.greenhouse.io"].includes(host)) {
      return `greenhouse:${host.includes(".eu.") ? "eu" : "us"}:${parts[0]}`;
    }
    if (["jobs.lever.co", "jobs.eu.lever.co", "jobs.ashbyhq.com", "jobs.smartrecruiters.com"].includes(host)) return `${host}:${parts[0]}`;
  } catch { /* Malformed links provide no employer evidence. */ }
  return null;
}

export function buildReviewedEmployerCoverage(
  candidates: CandidateJob[], trustedSources: Set<string>, registry: VerifiedCompany[], trust: CompanyTrustEntry[],
  isKnownClosed: (candidate: CandidateJob) => boolean,
) {
  const evidence = new Map<string, QualityDecision>();
  const key = (candidate: CandidateJob) => {
    const board = employerBoardIdentity(candidate.applyUrl);
    const name = normalizeCompanyName(candidate.company);
    return board && name ? `${name}|${board}` : null;
  };
  for (const candidate of candidates) {
    if (!trustedSources.has(candidate.source)) continue;
    const identity = key(candidate);
    if (!identity || !getJobLocationMetadata(candidate).eligible || getFreshnessRejection(candidate)
      || !classifyRoleTags(candidate).length || isKnownClosed(candidate)) continue;
    const decision = evaluateCompanyQuality({ name: candidate.company, h1bApprovals: candidate.h1bApprovals, title: candidate.title, applyUrl: candidate.applyUrl }, candidate.rawText, registry, trust);
    if (decision.status === "approved" || decision.coverageExceptionAllowed) evidence.set(identity, decision);
  }
  return (candidate: CandidateJob): QualityDecision | undefined => {
    // Re-evaluate this row: employer evidence never overrides a posting's risk
    // signals, a pending/blocked review or its own independent eligibility checks.
    const decision = evaluateCompanyQuality({ name: candidate.company, h1bApprovals: candidate.h1bApprovals, title: candidate.title, applyUrl: candidate.applyUrl }, candidate.rawText, registry, trust);
    if (!decision.coverageExceptionAllowed) return undefined;
    const identity = key(candidate);
    return identity ? evidence.get(identity) : undefined;
  };
}
