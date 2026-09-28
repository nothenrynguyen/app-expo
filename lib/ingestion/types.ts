import type { AtsBoardResult, AtsProvider } from "../ats-boards";
import type { JobsSnapshot } from "../jobs";
import type { CandidateJob } from "../source-normalization";

export type SourceRefreshDiagnostic = {
  name: string;
  kind: "engine_json" | "applyguy_json" | "markdown" | "workday";
  status: "ok" | "failed";
  rows: number;
  durationMs: number;
  requestCount: number;
  message?: string;
};

export type BoardRefreshDiagnostic = {
  provider: AtsProvider | "workday";
  key: string;
  company: string;
  status: "ok" | "failed";
  rows: number;
  searchedRows?: number;
  listRequests?: number;
  detailRequests?: number;
  detailFailures?: number;
  retryRequests?: number;
  durationMs: number;
  message?: string;
};

export type VerificationDiagnostic = {
  provider: "smartrecruiters" | "microsoft";
  attempted: number;
  verified: number;
};

export type CandidateLoadResult = {
  candidates: CandidateJob[];
  health: JobsSnapshot["sourceHealth"];
  sourceDiagnostics: SourceRefreshDiagnostic[];
  boardResults: Map<string, AtsBoardResult>;
  boardRegistry: BoardRefreshDiagnostic[];
  verificationDiagnostics: VerificationDiagnostic[];
  pinnedCompanies: string[];
};

export type RefreshReport = {
  version: 1;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: "healthy" | "degraded" | "failed";
  sources: {
    total: number;
    healthy: number;
    failed: number;
    empty: number;
    requestCount: number;
    durationMs: number;
    records: SourceRefreshDiagnostic[];
  };
  boards: {
    total: number;
    healthy: number;
    failed: number;
    requestCount: number;
    retryRequests: number;
    detailFailures: number;
    durationMs: number;
    records: BoardRefreshDiagnostic[];
  };
  verification: VerificationDiagnostic[];
  listings: {
    candidates: number;
    accepted: number;
    quarantined: number;
    rejected: number;
    preservedFromLastHealthySnapshot: number;
    checksAttempted: number;
    checksCompleted: number;
    knownClosed: number;
  };
};
