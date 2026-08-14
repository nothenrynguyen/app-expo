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

export type CompanyTrustEntry = {
  name: string;
  aliases?: string[];
  status: "approved" | "pending" | "blocked";
  reason: string;
  reviewedAt: string;
  minimumEmployees?: number | null;
  usPresence?: "headquartered" | "major" | null;
  linkedInUrl?: string | null;
};

export type QualityDecision = {
  status: "approved" | "rejected" | "quarantined";
  reason: string;
  linkedInUrl: string | null;
  minimumEmployees: number | null;
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
  trustRegistry: CompanyTrustEntry[] = [],
): QualityDecision {
  if (UNPAID_PATTERNS.some((pattern) => pattern.test(jobText))) {
    return { status: "rejected", reason: "The posting explicitly appears unpaid or fee-based.", linkedInUrl: null, minimumEmployees: null };
  }

  const normalized = normalizeCompanyName(company.name);
  const trustEntry = trustRegistry.find((entry) =>
    [entry.name, ...(entry.aliases ?? [])].some((name) => normalizeCompanyName(name) === normalized),
  );
  if (trustEntry?.status === "blocked") {
    return {
      status: "rejected",
      reason: `Blocked company trust record: ${trustEntry.reason}`,
      linkedInUrl: null,
      minimumEmployees: null,
    };
  }
  if (trustEntry?.status === "pending") {
    return {
      status: "quarantined",
      reason: `Company trust review pending: ${trustEntry.reason}`,
      linkedInUrl: trustEntry.linkedInUrl ?? null,
      minimumEmployees: trustEntry.minimumEmployees ?? null,
    };
  }
  if (trustEntry?.status === "approved") {
    return {
      status: "approved",
      reason: `Approved company trust record: ${trustEntry.reason}`,
      linkedInUrl: trustEntry.linkedInUrl ?? null,
      minimumEmployees: trustEntry.minimumEmployees ?? null,
    };
  }
  const verified = registry.find((entry) => normalizeCompanyName(entry.name) === normalized);
  if (verified && verified.minimumEmployees >= 10) {
    return {
      status: "approved",
      reason: `Verified company registry: ${verified.usPresence} U.S. presence and at least ${verified.minimumEmployees} employees.`,
      linkedInUrl: verified.linkedInUrl,
      minimumEmployees: verified.minimumEmployees,
    };
  }

  if ((company.h1bApprovals ?? 0) >= 10) {
    return {
      status: "approved",
      reason: "Substantial recent U.S. employment evidence from at least 10 H-1B approvals.",
      linkedInUrl: company.linkedInUrl ?? null,
      minimumEmployees: null,
    };
  }

  return {
    status: "quarantined",
    reason: "Company size and substantial U.S. operating presence have not been verified.",
    linkedInUrl: null,
    minimumEmployees: null,
  };
}
