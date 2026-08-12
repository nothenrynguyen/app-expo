export type CompanyEvidence = {
  name: string;
  h1bApprovals?: number | null;
  linkedInUrl?: string | null;
};

export type VerifiedCompany = {
  name: string;
  usPresence: "headquartered" | "major";
  minimumEmployees: number;
  linkedInUrl: string | null;
};

export type QualityDecision = {
  status: "approved" | "rejected" | "quarantined";
  reason: string;
  linkedInUrl: string | null;
};

const UNPAID_PATTERNS = [
  /\bunpaid\b/i,
  /\bvolunteer\b/i,
  /\bcommission[- ]only\b/i,
  /\bequity[- ]only\b/i,
  /\btraining fee\b/i,
  /\bpay(?:ment)? required\b/i,
];

export function normalizeCompanyName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(inc|incorporated|llc|ltd|limited|corp|corporation|company|co)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function evaluateCompanyQuality(
  company: CompanyEvidence,
  jobText: string,
  registry: VerifiedCompany[],
): QualityDecision {
  if (UNPAID_PATTERNS.some((pattern) => pattern.test(jobText))) {
    return { status: "rejected", reason: "The posting explicitly appears unpaid or fee-based.", linkedInUrl: null };
  }

  const normalized = normalizeCompanyName(company.name);
  const verified = registry.find((entry) => normalizeCompanyName(entry.name) === normalized);
  if (verified && verified.minimumEmployees >= 10) {
    return {
      status: "approved",
      reason: `Verified company registry: ${verified.usPresence} U.S. presence and at least ${verified.minimumEmployees} employees.`,
      linkedInUrl: verified.linkedInUrl,
    };
  }

  if ((company.h1bApprovals ?? 0) >= 10) {
    return {
      status: "approved",
      reason: "Substantial recent U.S. employment evidence from at least 10 H-1B approvals.",
      linkedInUrl: company.linkedInUrl ?? null,
    };
  }

  return {
    status: "quarantined",
    reason: "Company size and substantial U.S. operating presence have not been verified.",
    linkedInUrl: null,
  };
}
