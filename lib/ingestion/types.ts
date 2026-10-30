import type { AtsBoardResult, AtsProvider } from "../ats-boards";
import type { JobsSnapshot } from "../jobs";
import type { CandidateJob } from "../source-normalization";

export type SourceRefreshDiagnostic = {
  name: string;
  kind: "engine_json" | "applyguy_json" | "markdown" | "keryx_markdown" | "workday" | "usajobs" | "employer_recovery";
  status: "ok" | "failed";
  rows: number;
  durationMs: number;
  requestCount: number;
  message?: string;
  outcome?: import("./source-health").HealthOutcome;
  detailFailures?: number;
  detailRequests?: number;
};

export type BoardRefreshDiagnostic = {
  requestCount?: number;
  id?: string;
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
  outcome?: import("./source-health").HealthOutcome;
};

export type VerificationDiagnostic = {
  provider: "smartrecruiters" | "microsoft" | "scoped_employer" | "source_listing";
  attempted: number;
  verified: number;
};

export type CandidateLoadResult = {
  workdaySchedule?: import("./workday-schedule").WorkdaySchedule;
  workdayChecks?: import("./workday-continuity").WorkdayCheck[];
  recoveryState?: import("./employer-recovery").RecoveryState;
  boardHistory: import("./board-history").BoardHistory;
  boardCoverage: { discovered: number; retained: number };
  preScreened?: Array<{ url: string; outcome: "employer" | "role" | "closed" | "pendingVerification" }>;
  candidates: CandidateJob[];
  health: JobsSnapshot["sourceHealth"];
  sourceDiagnostics: SourceRefreshDiagnostic[];
  boardResults: Map<string, AtsBoardResult>;
  boardRegistry: BoardRefreshDiagnostic[];
  verificationDiagnostics: VerificationDiagnostic[];
  pinnedCompanies: string[];
};

export type RefreshReport = {
  coverage?: { boards: { discovered: number; retained: number }; collections: ReturnType<typeof import("./coverage-guard").assessCoverage> };
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
    screening?: import("./screening").ScreeningMetrics | null;
  };
};
