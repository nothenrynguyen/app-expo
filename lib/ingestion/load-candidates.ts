import { readFile } from "node:fs/promises";
import path from "node:path";
import { createAtsBoard, discoverAtsBoard, fetchAtsBoard, type AtsBoardSeed } from "../ats-boards";
import { applyMicrosoftCareersPosting, fetchMicrosoftCareersPosting, parseMicrosoftCareersJobUrl } from "../microsoft-careers";
import { applySmartRecruitersPosting, fetchSmartRecruitersPosting, parseSmartRecruitersJobUrl } from "../smartrecruiters";
import type { JobSource } from "../source-catalog";
import { canonicalizeUrl, inferTerm, inferWorkMode, jobIdentity, type CandidateJob } from "../source-normalization";
import { parseApplyGuySource, parseMarkdownSource, sourceAllowsAtsExpansion } from "../source-parsers";
import { createWorkdayBoard, fetchWorkdayBoard, type WorkdayBoardSeed } from "../workday";
import { inBatches } from "./concurrency";
import type { BoardRefreshDiagnostic, CandidateLoadResult, SourceRefreshDiagnostic } from "./types";

type EngineJob = {
  company: string;
  title: string;
  season: string;
  category: string;
  location: string;
  url: string;
  posted_at: string;
  posted_at_source: "exact" | "date_only" | "relative_derived";
  sponsorship?: string | null;
  salary?: string | null;
  skills?: string[] | null;
  source: string;
  h1b_approvals?: number | null;
  remote?: boolean;
};

type TimedResult<T> =
  | { status: "fulfilled"; value: T; durationMs: number }
  | { status: "rejected"; reason: unknown; durationMs: number };

async function runTimed<T>(task: () => Promise<T>): Promise<TimedResult<T>> {
  const startedAt = Date.now();
  try {
    return { status: "fulfilled", value: await task(), durationMs: Date.now() - startedAt };
  } catch (reason) {
    return { status: "rejected", reason, durationMs: Date.now() - startedAt };
  }
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unknown provider error";
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "user-agent": "App-Expo/0.5" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

function engineCandidate(job: EngineJob, source: JobSource): CandidateJob | null {
  const url = canonicalizeUrl(job.url);
  if (!url || !job.posted_at) return null;
  return {
    company: job.company,
    title: job.title,
    term: job.season || inferTerm(job.title),
    location: job.location || "Location not stated",
    workMode: job.remote ? "remote" : inferWorkMode(`${job.title} ${job.location}`),
    postedAt: new Date(job.posted_at).toISOString(),
    postedAtSource: job.posted_at_source,
    applyUrl: url,
    category: job.category || "Internship",
    salary: job.salary ?? null,
    source: source.name,
    h1bApprovals: job.h1b_approvals ?? null,
    rawText: `${job.title} ${job.location} ${job.sponsorship ?? ""} ${(job.skills ?? []).join(" ")}`,
  };
}

export async function loadCandidates(root: string, sources: JobSource[]): Promise<CandidateLoadResult> {
  const health: CandidateLoadResult["health"] = [];
  const sourceDiagnostics: SourceRefreshDiagnostic[] = [];
  const candidates: CandidateJob[] = [];

  for (const source of sources.filter((candidate) => candidate.kind === "engine_json")) {
    const result = await runTimed(async () => JSON.parse(await fetchText(source.url)) as { jobs: EngineJob[] });
    if (result.status === "fulfilled") {
      candidates.push(...result.value.jobs.map((job) => engineCandidate(job, source)).filter((job): job is CandidateJob => Boolean(job)));
      health.push({ name: source.name, status: "ok", rows: result.value.jobs.length });
      sourceDiagnostics.push({ name: source.name, kind: source.kind, status: "ok", rows: result.value.jobs.length, durationMs: result.durationMs, requestCount: 1 });
    } else {
      health.push({ name: source.name, status: "failed", rows: 0 });
      sourceDiagnostics.push({ name: source.name, kind: source.kind, status: "failed", rows: 0, durationMs: result.durationMs, requestCount: 1, message: errorMessage(result.reason) });
    }
  }

  for (const source of sources.filter((candidate) => candidate.kind === "applyguy_json")) {
    const result = await runTimed(async () => parseApplyGuySource(await fetchText(source.url), source.name, source.categories));
    if (result.status === "fulfilled") {
      candidates.push(...result.value);
      health.push({ name: source.name, status: "ok", rows: result.value.length });
      sourceDiagnostics.push({ name: source.name, kind: source.kind, status: "ok", rows: result.value.length, durationMs: result.durationMs, requestCount: 1 });
    } else {
      health.push({ name: source.name, status: "failed", rows: 0 });
      sourceDiagnostics.push({ name: source.name, kind: source.kind, status: "failed", rows: 0, durationMs: result.durationMs, requestCount: 1, message: errorMessage(result.reason) });
    }
  }

  const markdownSources = sources.filter((source) => source.kind === "markdown");
  const markdownResults = await Promise.all(markdownSources.map((source) => runTimed(async () => parseMarkdownSource(await fetchText(source.url), source.name))));
  markdownResults.forEach((result, index) => {
    const source = markdownSources[index];
    if (result.status === "fulfilled") {
      candidates.push(...result.value);
      health.push({ name: source.name, status: "ok", rows: result.value.length });
      sourceDiagnostics.push({ name: source.name, kind: source.kind, status: "ok", rows: result.value.length, durationMs: result.durationMs, requestCount: 1 });
    } else {
      health.push({ name: source.name, status: "failed", rows: 0 });
      sourceDiagnostics.push({ name: source.name, kind: source.kind, status: "failed", rows: 0, durationMs: result.durationMs, requestCount: 1, message: errorMessage(result.reason) });
    }
  });

  const boards = new Map<string, NonNullable<ReturnType<typeof discoverAtsBoard>>>();
  for (const candidate of candidates) {
    if (!sourceAllowsAtsExpansion(candidate.source, sources)) continue;
    const board = discoverAtsBoard(candidate.applyUrl, candidate.company, candidate.source);
    if (board && !boards.has(board.id)) boards.set(board.id, board);
  }
  const pinnedSeeds = await readFile(path.join(root, "data/pinned-boards.json"), "utf8")
    .then((value) => JSON.parse(value) as AtsBoardSeed[])
    .catch(() => []);
  for (const seed of pinnedSeeds) {
    const board = createAtsBoard(seed);
    boards.set(board.id, board);
  }

  const boardList = [...boards.values()];
  const settledBoardFetches = await inBatches(boardList, 12, (board) => runTimed(() => fetchAtsBoard(board)));
  const boardFetches = settledBoardFetches.map((result) => result.status === "fulfilled" ? result.value : ({ status: "rejected", reason: result.reason, durationMs: 0 } as const));
  const boardResults = new Map<string, Awaited<ReturnType<typeof fetchAtsBoard>>>();
  const boardRegistry: BoardRefreshDiagnostic[] = boardFetches.map((result, index) => {
    const board = boardList[index];
    if (result.status === "fulfilled") {
      boardResults.set(board.id, result.value);
      candidates.push(...result.value.jobs);
      return { provider: board.provider, key: board.key, company: board.company, status: "ok", rows: result.value.liveIdentities.size, durationMs: result.durationMs };
    }
    return { provider: board.provider, key: board.key, company: board.company, status: "failed", rows: 0, durationMs: result.durationMs, message: errorMessage(result.reason) };
  });

  const workdaySeeds = await readFile(path.join(root, "data/workday-boards.json"), "utf8")
    .then((value) => JSON.parse(value) as WorkdayBoardSeed[])
    .catch(() => []);
  const workdayBoards = workdaySeeds.map(createWorkdayBoard);
  const settledWorkdayFetches = await inBatches(workdayBoards, 1, (board) => runTimed(() => fetchWorkdayBoard(board)));
  const workdayFetches = settledWorkdayFetches.map((result) => result.status === "fulfilled" ? result.value : ({ status: "rejected", reason: result.reason, durationMs: 0 } as const));
  workdayFetches.forEach((result, index) => {
    const board = workdayBoards[index];
    if (result.status === "fulfilled") {
      candidates.push(...result.value.jobs);
      health.push({ name: `Workday: ${board.company}`, status: "ok", rows: result.value.searchedPostings });
      sourceDiagnostics.push({
        name: `Workday: ${board.company}`,
        kind: "workday",
        status: "ok",
        rows: result.value.searchedPostings,
        durationMs: result.value.diagnostics.durationMs,
        requestCount: result.value.diagnostics.listRequests + result.value.diagnostics.detailRequests + result.value.diagnostics.retryRequests,
      });
      boardRegistry.push({
        provider: "workday",
        key: `${board.tenant}/${board.site}`,
        company: board.company,
        status: "ok",
        rows: result.value.liveIdentities.size,
        searchedRows: result.value.searchedPostings,
        listRequests: result.value.diagnostics.listRequests,
        detailRequests: result.value.diagnostics.detailRequests,
        detailFailures: result.value.diagnostics.detailFailures,
        retryRequests: result.value.diagnostics.retryRequests,
        durationMs: result.value.diagnostics.durationMs,
      });
    } else {
      health.push({ name: `Workday: ${board.company}`, status: "failed", rows: 0 });
      sourceDiagnostics.push({ name: `Workday: ${board.company}`, kind: "workday", status: "failed", rows: 0, durationMs: result.durationMs, requestCount: 0, message: errorMessage(result.reason) });
      boardRegistry.push({ provider: "workday", key: `${board.tenant}/${board.site}`, company: board.company, status: "failed", rows: 0, durationMs: result.durationMs, message: errorMessage(result.reason) });
    }
  });

  const smartRecruitersUrls = new Map<string, string>();
  for (const candidate of candidates) {
    const identity = jobIdentity(candidate.applyUrl);
    if (identity && parseSmartRecruitersJobUrl(candidate.applyUrl)) smartRecruitersUrls.set(identity, candidate.applyUrl);
  }
  const smartRecruitersEntries = [...smartRecruitersUrls];
  const smartRecruitersFetches = await inBatches(smartRecruitersEntries, 12, async ([identity, url]) => ({ identity, posting: await fetchSmartRecruitersPosting(url) }));
  const smartRecruitersPostings = new Map(smartRecruitersFetches.flatMap((result) => result.status === "fulfilled" && result.value.posting ? [[result.value.identity, result.value.posting] as const] : []));
  for (let index = 0; index < candidates.length; index += 1) {
    const identity = jobIdentity(candidates[index].applyUrl);
    const posting = identity ? smartRecruitersPostings.get(identity) : null;
    if (posting) candidates[index] = applySmartRecruitersPosting(candidates[index], posting);
  }

  const microsoftUrls = new Map<string, string>();
  for (const candidate of candidates) {
    const microsoftJob = parseMicrosoftCareersJobUrl(candidate.applyUrl);
    if (microsoftJob) microsoftUrls.set(microsoftJob.jobId, candidate.applyUrl);
  }
  const microsoftEntries = [...microsoftUrls];
  const microsoftFetches = await inBatches(microsoftEntries, 12, async ([jobId, url]) => ({ jobId, posting: await fetchMicrosoftCareersPosting(url) }));
  const microsoftPostings = new Map(microsoftFetches.flatMap((result) => result.status === "fulfilled" && result.value.posting ? [[result.value.jobId, result.value.posting] as const] : []));
  for (let index = 0; index < candidates.length; index += 1) {
    const microsoftJob = parseMicrosoftCareersJobUrl(candidates[index].applyUrl);
    const posting = microsoftJob ? microsoftPostings.get(microsoftJob.jobId) : null;
    if (posting) candidates[index] = applyMicrosoftCareersPosting(candidates[index], posting);
  }

  return {
    candidates,
    health,
    sourceDiagnostics,
    boardResults,
    boardRegistry,
    verificationDiagnostics: [
      { provider: "smartrecruiters", attempted: smartRecruitersEntries.length, verified: smartRecruitersPostings.size },
      { provider: "microsoft", attempted: microsoftEntries.length, verified: microsoftPostings.size },
    ],
    pinnedCompanies: [...pinnedSeeds.map((seed) => seed.company), ...workdaySeeds.map((seed) => seed.company)],
  };
}
