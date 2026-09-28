import type { BoardRefreshDiagnostic, RefreshReport, SourceRefreshDiagnostic, VerificationDiagnostic } from "./types";

type RefreshReportInput = {
  startedAt: Date;
  completedAt?: Date;
  sourceDiagnostics: SourceRefreshDiagnostic[];
  boardDiagnostics: BoardRefreshDiagnostic[];
  verificationDiagnostics: VerificationDiagnostic[];
  candidates: number;
  accepted: number;
  quarantined: number;
  rejected: number;
  preservedFromLastHealthySnapshot: number;
  checksAttempted: number;
  checksCompleted: number;
  knownClosed: number;
};

export function buildRefreshReport(input: RefreshReportInput): RefreshReport {
  const completedAt = input.completedAt ?? new Date();
  const failedSources = input.sourceDiagnostics.filter((source) => source.status === "failed").length;
  const emptySources = input.sourceDiagnostics.filter((source) => source.status === "ok" && source.rows === 0).length;
  const failedBoards = input.boardDiagnostics.filter((board) => board.status === "failed").length;
  const allSourcesFailed = input.sourceDiagnostics.length > 0 && failedSources === input.sourceDiagnostics.length;

  return {
    version: 1,
    startedAt: input.startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: Math.max(0, completedAt.getTime() - input.startedAt.getTime()),
    status: allSourcesFailed ? "failed" : failedSources > 0 || failedBoards > 0 || emptySources > 0 ? "degraded" : "healthy",
    sources: {
      total: input.sourceDiagnostics.length,
      healthy: input.sourceDiagnostics.length - failedSources,
      failed: failedSources,
      empty: emptySources,
      requestCount: input.sourceDiagnostics.reduce((total, source) => total + source.requestCount, 0),
      durationMs: input.sourceDiagnostics.reduce((total, source) => total + source.durationMs, 0),
      records: input.sourceDiagnostics,
    },
    boards: {
      total: input.boardDiagnostics.length,
      healthy: input.boardDiagnostics.length - failedBoards,
      failed: failedBoards,
      requestCount: input.boardDiagnostics.reduce((total, board) => total + (board.listRequests ?? 1) + (board.detailRequests ?? 0) + (board.retryRequests ?? 0), 0),
      retryRequests: input.boardDiagnostics.reduce((total, board) => total + (board.retryRequests ?? 0), 0),
      detailFailures: input.boardDiagnostics.reduce((total, board) => total + (board.detailFailures ?? 0), 0),
      durationMs: input.boardDiagnostics.reduce((total, board) => total + board.durationMs, 0),
      records: input.boardDiagnostics,
    },
    verification: input.verificationDiagnostics,
    listings: {
      candidates: input.candidates,
      accepted: input.accepted,
      quarantined: input.quarantined,
      rejected: input.rejected,
      preservedFromLastHealthySnapshot: input.preservedFromLastHealthySnapshot,
      checksAttempted: input.checksAttempted,
      checksCompleted: input.checksCompleted,
      knownClosed: input.knownClosed,
    },
  };
}
