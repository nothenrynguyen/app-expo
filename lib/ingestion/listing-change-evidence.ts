import { createAtsBoard, discoverAtsBoard, type AtsBoardResult } from "../ats-boards";
import type { PublicJob } from "../jobs";
import type { ListingHealthFile } from "../listing-health";
import { jobIdentity, opportunityIdentity } from "../source-normalization";
import { employerBoardIdentity } from "./reviewed-employer-coverage";
import type { BoardRefreshDiagnostic, SourceRefreshDiagnostic } from "./types";
import type { WorkdayCheck } from "./workday-continuity";
import type { ScreeningReason } from "./screening";

export function createListingChangeEvidence(input: {
  startedAt: Date; generatedAt: string;
  listingHealth: ListingHealthFile; workdayChecks: WorkdayCheck[];
  boardRegistry: BoardRefreshDiagnostic[]; boardResults: Map<string, AtsBoardResult>;
  sourceDiagnostics: SourceRefreshDiagnostic[]; retired: Set<string>;
  screeningFor?: (url: string) => Array<{ url: string; reason: ScreeningReason; detail: string | null }>;
}) {
  const checks = Map.groupBy(input.workdayChecks, check => opportunityIdentity(check.url));
  const records = new Map(input.boardRegistry.map(record => [record.id ?? (record.provider === "workday" ? null : createAtsBoard({ provider: record.provider, key: record.key, company: record.company }).id), record]));
  const sources = new Map(input.sourceDiagnostics.map(record => [record.name, record]));
  return (job: PublicJob) => {
    const board = discoverAtsBoard(job.applyUrl, job.company, "audit");
    const boardId = board?.id ?? employerBoardIdentity(job.applyUrl);
    const record = boardId ? records.get(boardId) : undefined;
    const result = boardId ? input.boardResults.get(boardId) : undefined;
    // The legacy generic cache can collapse Workday sites. Never use it as
    // exact requisition evidence; current Workday checks retain the full site.
    const health = boardId?.startsWith("workday:") ? undefined : input.listingHealth[jobIdentity(job.applyUrl) ?? ""];
    const currentRun = !!health && Date.parse(health.checkedAt) >= input.startedAt.getTime() && Date.parse(health.checkedAt) <= Date.parse(input.generatedAt);
    return {
      screening: input.screeningFor?.(job.applyUrl) ?? [],
      runStartedAt: input.startedAt.toISOString(),
      postingCheck: health ? { status: health.status, checkedAt: health.checkedAt, httpStatus: health.httpStatus, currentRun } : null,
      workdayChecks: (checks.get(opportunityIdentity(job.applyUrl)) ?? []).map(check => ({ ...check })),
      board: boardId ? {
        id: boardId, status: record?.status ?? "not-checked", outcome: record?.outcome ?? null,
        membership: result ? (result.liveIdentities.has(jobIdentity(job.applyUrl) ?? "") ? "present" : "absent") : "unknown",
        retired: input.retired.has(boardId),
      } : null,
      sources: (job.sources ?? []).map(name => {
        const source = sources.get(name);
        return { name, status: source?.status ?? "not-checked", outcome: source?.outcome ?? null, rows: source?.rows ?? null };
      }),
    };
  };
}

export type ListingChangeEvidence = ReturnType<ReturnType<typeof createListingChangeEvidence>>;
