import { workdayEvidenceKey, type WorkdayCheck } from "./ingestion/workday-continuity";
import { evaluateCompanyQuality } from "./company-quality";
import { isEarlyCareerTitle } from "./ats-boards";
import type { CandidateJob } from "./source-normalization";
import { canonicalizeUrl, inferTerm, inferWorkMode, jobIdentity, parsePostedAt } from "./source-normalization";

export type WorkdayBoardSeed = {
  host: string;
  tenant: string;
  site: string;
  company: string;
  searchTerms: string[];
  maxResultsPerSearch?: number;
  prefilterEarlyCareerTitles?: boolean;
};

export type WorkdayBoard = WorkdayBoardSeed & {
  id: string;
  endpoint: string;
  careerBaseUrl: string;
};

type WorkdayBoardResult = {
  board: WorkdayBoard;
  jobs: CandidateJob[];
  liveIdentities: Set<string>;
  searchedPostings: number;
  checks: WorkdayCheck[];
  diagnostics: {
    durationMs: number;
    listRequests: number;
    detailRequests: number;
    detailFailures: number;
    retryRequests: number;
    failureReasons: Record<string, number>;
    accessDenied: number;
    retryAfterMs: number;
    requestCount: number;
  };
};

type WorkdaySummary = {
  title?: string;
  externalPath?: string;
  timeType?: string;
  locationsText?: string;
  postedOn?: string;
};

type WorkdayDetail = {
  jobPostingInfo?: {
    title?: string;
    jobDescription?: string;
    location?: string;
    postedOn?: string;
    startDate?: string;
    timeType?: string;
    jobReqId?: string;
    canApply?: boolean;
    posted?: boolean;
    externalUrl?: string;
    country?: { descriptor?: string };
    jobRequisitionLocation?: {
      descriptor?: string;
      country?: { descriptor?: string; alpha2Code?: string };
    };
  };
};

const PAGE_SIZE = 20;
const REQUEST_ATTEMPTS = 3;

type WorkdayRequestOptions = {
  deadlineAt?: number;
  method?: "GET" | "POST";
  body?: string;
  timeoutMs: number;
  fetchImpl: typeof fetch;
  retryDelayMs: number;
  onRetry: () => void;
};

async function requestWorkdayJson<T>(url: string, options: WorkdayRequestOptions): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < REQUEST_ATTEMPTS; attempt += 1) {
    if (options.deadlineAt && Date.now() >= options.deadlineAt) throw new Error("Workday board time budget exceeded");
    try {
      const response = await options.fetchImpl(url, {
        method: options.method ?? "GET",
        headers: {
          accept: "application/json",
          connection: "close",
          ...(options.body ? { "content-type": "application/json" } : {}),
          "user-agent": "empluzzed/0.4",
        },
        body: options.body,
        signal: AbortSignal.timeout(Math.max(1, Math.min(options.timeoutMs, (options.deadlineAt ?? Infinity) - Date.now()))),
      });
      if (response.ok) return await response.json() as T;
      const retryable = response.status === 408 || response.status >= 500;
      if (!retryable) throw new Error(`${response.status} ${response.statusText}`);
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
      if (error instanceof Error && /^4\d\d /.test(error.message) && !/^408 /.test(error.message)) throw error;
    }
    if (options.deadlineAt && Date.now() >= options.deadlineAt) throw new Error("Workday board time budget exceeded");
    if (attempt < REQUEST_ATTEMPTS - 1) {
      options.onRetry();
      if (options.retryDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, options.retryDelayMs * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Workday request failed.");
}

export function createWorkdayBoard(seed: WorkdayBoardSeed): WorkdayBoard {
  const host = seed.host.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const tenant = seed.tenant.trim();
  const site = seed.site.trim();
  if (!/^[a-z0-9.-]+\.myworkdayjobs\.com$/.test(host)) throw new Error(`Invalid Workday host: ${seed.host}`);
  if (!tenant || !site || /[\\/]/.test(`${tenant}${site}`)) throw new Error("Workday tenant and site must be non-empty path segments.");
  if (seed.searchTerms.length === 0 || seed.searchTerms.length > 10 || seed.searchTerms.some((term) => !term.trim())) {
    throw new Error("Workday boards require between 1 and 10 non-empty search terms.");
  }
  if (seed.maxResultsPerSearch !== undefined && (!Number.isInteger(seed.maxResultsPerSearch) || seed.maxResultsPerSearch < 1 || seed.maxResultsPerSearch > 1_000)) {
    throw new Error("Workday maxResultsPerSearch must be an integer from 1 to 1000.");
  }
  return {
    ...seed,
    host,
    tenant,
    site,
    searchTerms: seed.searchTerms.map((term) => term.trim()),
    id: `workday:${host}:${tenant.toLowerCase()}:${site.toLowerCase()}`,
    endpoint: `https://${host}/wday/cxs/${encodeURIComponent(tenant)}/${encodeURIComponent(site)}/jobs`,
    careerBaseUrl: `https://${host}/${encodeURIComponent(site)}`,
  };
}

function plainText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseWorkdayPostedAt(value: string, now = new Date()): ReturnType<typeof parsePostedAt> {
  const normalized = value.trim();
  if (/^posted\s+today$/i.test(normalized)) return { postedAt: now.toISOString(), source: "relative_derived" };
  const relative = normalized.match(/^posted\s+(\d+)\+?\s+days?\s+ago$/i);
  if (relative) return parsePostedAt(`${relative[1]} days`, now);
  return parsePostedAt(normalized.replace(/^posted\s+/i, "").replace(/\s+ago$/i, ""), now);
}

function detailUrl(board: WorkdayBoard, externalPath: string): string {
  return `https://${board.host}/wday/cxs/${encodeURIComponent(board.tenant)}/${encodeURIComponent(board.site)}${externalPath}`;
}

function publicUrl(board: WorkdayBoard, externalPath: string): string {
  return `${board.careerBaseUrl}${externalPath}`;
}

function isExplicitlyPartTime(value: string): boolean {
  return /\bpart[- ]?time\b/i.test(value);
}

export function parseWorkdayJob(
  board: WorkdayBoard,
  summary: WorkdaySummary,
  payload: WorkdayDetail,
  now = new Date(),
): CandidateJob | null {
  const detail = payload.jobPostingInfo;
  if (!detail || detail.canApply === false || detail.posted === false) return null;
  const title = plainText(detail.title ?? summary.title ?? "");
  const description = plainText(detail.jobDescription ?? "");
  const timeType = detail.timeType ?? summary.timeType ?? "";
  if (!title || isExplicitlyPartTime(timeType) || !isEarlyCareerTitle(title, description)) return null;

  const externalPath = summary.externalPath ?? "";
  const applyUrl = canonicalizeUrl(detail.externalUrl ?? publicUrl(board, externalPath));
  if (!applyUrl) return null;
  const location = plainText(
    detail.location
      ?? detail.jobRequisitionLocation?.descriptor
      ?? summary.locationsText
      ?? "Location not stated",
  );
  const country = detail.jobRequisitionLocation?.country?.descriptor ?? detail.country?.descriptor ?? "";
  const posted = detail.startDate
    ? parsePostedAt(detail.startDate, now)
    : parseWorkdayPostedAt(detail.postedOn ?? summary.postedOn ?? "", now);
  const text = `${title} ${location} ${country} ${timeType} ${description}`;

  return {
    company: board.company,
    title,
    term: inferTerm(text),
    location: location || "Location not stated",
    workMode: inferWorkMode(text),
    postedAt: posted?.postedAt ?? now.toISOString(),
    postedAtSource: posted?.source ?? "first_seen",
    applyUrl,
    category: /\bintern(?:ship)?\b|\bco-?op\b/i.test(title) ? "Internship" : "New grad",
    salary: null,
    source: "Direct ATS (Workday)",
    rawText: text,
    sourceActive: true,
  };
}

async function inBatches<T, R>(items: T[], concurrency: number, task: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = { status: "fulfilled", value: await task(items[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }));
  return results;
}

type WorkdayFetchOptions = {
  fetchImpl?: typeof fetch;
  retryDelayMs?: number;
};

export async function fetchWorkdayBoard(
  board: WorkdayBoard,
  now = new Date(),
  options: WorkdayFetchOptions = {},
): Promise<WorkdayBoardResult> {
  const startedAt = Date.now();
  const deadlineAt = startedAt + 90_000;
  let accessDenied = 0;
  let retryAfterMs = 0;
  let requestCount = 0;
  let nextRequestAt = 0;
  let requestQueue = Promise.resolve();
  const nativeFetch = options.fetchImpl ?? fetch;
  const fetchImpl: typeof fetch = async (url, init) => {
    // Serialize request starts, not response bodies. Shared by list and detail
    // calls so concurrent details cannot burst at an employer endpoint.
    const turn = requestQueue.then(async () => {
      const delay = Math.max(0, nextRequestAt - Date.now());
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      nextRequestAt = Date.now() + (options.fetchImpl ? 0 : 150);
    });
    requestQueue = turn;
    await turn;
    if (accessDenied) throw new Error(`${accessDenied} Workday access paused for this board`);
    if (Date.now() >= deadlineAt) throw new Error("Workday board time budget exceeded");
    requestCount++;
    const response = await nativeFetch(url, init);
    if ([401, 403, 429].includes(response.status)) accessDenied = response.status;
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) {
      const value = /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - Date.now();
      if (Number.isFinite(value)) retryAfterMs = Math.max(retryAfterMs, value);
    }
    if (accessDenied) throw Object.assign(new Error(`${response.status} ${response.statusText}`), { retryAfterMs, requestCount });
    return response;
  };
  try {
    const retryDelayMs = options.retryDelayMs ?? 250;
    const summaries = new Map<string, WorkdaySummary>();
    const maxResults = board.maxResultsPerSearch ?? 500;
    let listRequests = 0;
    let retryRequests = 0;

    for (const searchText of board.searchTerms) {
      let offset = 0;
      let total = 0;
      do {
        listRequests += 1;
        const payload = await requestWorkdayJson<{ total?: number; jobPostings?: WorkdaySummary[] }>(board.endpoint, {
          method: "POST",
          body: JSON.stringify({ appliedFacets: {}, limit: PAGE_SIZE, offset, searchText }),
          deadlineAt,
          timeoutMs: 15_000,
          fetchImpl,
          retryDelayMs,
          onRetry: () => { retryRequests += 1; },
        });
        const postings = payload.jobPostings ?? [];
        total = Math.min(payload.total ?? postings.length, maxResults);
        for (const posting of postings) {
          if (posting.externalPath) summaries.set(posting.externalPath, posting);
        }
        offset += postings.length;
        if (postings.length === 0) break;
      } while (offset < total);
    }

    const searchedPostings = summaries.size;
    const entries = [...summaries.entries()].filter(([, summary]) => {
      if (!board.prefilterEarlyCareerTitles) return true;
      const title = summary.title ?? "";
      if (/\b(?:senior|sr\.?|staff|principal|director|head|lead)\b/i.test(title)) return false;
      return isEarlyCareerTitle(title) || /\bassociate\b/i.test(title);
    });
    const details = await inBatches(entries, 3, async ([externalPath, summary]) => {
      const payload = await requestWorkdayJson<WorkdayDetail>(detailUrl(board, externalPath), {
        deadlineAt,
        timeoutMs: 12_000,
        fetchImpl,
        retryDelayMs,
        onRetry: () => { retryRequests += 1; },
      });
      return { summary, payload };
    });

    const jobs: CandidateJob[] = [];
    const checks: WorkdayCheck[] = [];
    const liveIdentities = new Set<string>();
    const detailFailures = details.filter((result) => result.status === "rejected").length;
    const failureReasons: Record<string, number> = {};
    for (const result of details) if (result.status === "rejected") {
      const reason = result.reason instanceof Error ? result.reason.message : "Unknown detail failure";
      failureReasons[reason] = (failureReasons[reason] ?? 0) + 1;
    }
    for (const [index, result] of details.entries()) {
      const url = publicUrl(board, entries[index][0]);
      if (result.status !== "fulfilled") {
        checks.push({url, status: result.reason instanceof Error && /^(404|410)\b/.test(result.reason.message) ? "closed" : "unknown"});
        continue;
      }
      const info = result.value.payload.jobPostingInfo;
      const req = info?.jobReqId?.toLowerCase();
      const postingPath = decodeURIComponent(new URL(url).pathname).toLowerCase();
      const matches = !!req && (postingPath.endsWith(`_${req}`) || new RegExp(`_${req.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-\\d+$`).test(postingPath));
      if (matches && (info?.posted === false || info?.canApply === false)) checks.push({url, status: "closed"});
      const job = parseWorkdayJob(board, result.value.summary, result.value.payload, now);
      const identity = job && jobIdentity(job.applyUrl);
      if (!job || !identity) {
        if (!matches || info?.posted !== false && info?.canApply !== false) checks.push({url, status: matches && typeof info?.title === "string" && info.title.trim() ? "ineligible" : "unknown"});
        continue;
      }
      if (matches && evaluateCompanyQuality({name: board.company, title: job.title}, job.rawText, []).status === "rejected") {checks.push({url, status: "ineligible"}); continue;}
      checks.push({url: job.applyUrl, status: matches && workdayEvidenceKey(url) === workdayEvidenceKey(job.applyUrl) && info?.posted === true && info?.canApply === true ? "live" : "unknown"});
      liveIdentities.add(identity);
      jobs.push(job);
    }

    return {
      board,
      jobs,
      liveIdentities,
      searchedPostings,
      checks,
      diagnostics: {
        durationMs: Date.now() - startedAt,
        listRequests,
        detailRequests: entries.length,
        detailFailures,
        retryRequests,
        failureReasons,
        accessDenied,
        retryAfterMs,
        requestCount,
      },
    };
  } catch (error) {
    if (error instanceof Error) Object.assign(error, { requestCount, retryAfterMs });
    throw error;
  }
}
