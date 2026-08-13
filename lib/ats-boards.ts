import type { CandidateJob } from "./source-normalization";
import { canonicalizeUrl, inferTerm, inferWorkMode, jobIdentity } from "./source-normalization";

export type AtsProvider = "greenhouse" | "lever" | "ashby";

export type AtsBoard = {
  id: string;
  provider: AtsProvider;
  key: string;
  company: string;
  source: string;
  endpoint: string;
};

type BoardJob = {
  title: string;
  location: string;
  applyUrl: string;
  postedAt?: string | number | null;
  description?: string;
};

export type AtsBoardResult = {
  board: AtsBoard;
  jobs: CandidateJob[];
  liveIdentities: Set<string>;
};

export function discoverAtsBoard(applyUrl: string, company: string, source: string): AtsBoard | null {
  const canonical = canonicalizeUrl(applyUrl);
  if (!canonical) return null;
  const url = new URL(canonical);
  const [key] = url.pathname.split("/").filter(Boolean);
  if (!key || key === "embed") return null;

  if (/^(?:job-boards\.|boards\.)greenhouse\.io$/i.test(url.hostname)) {
    return {
      id: `greenhouse:${key.toLowerCase()}`,
      provider: "greenhouse",
      key,
      company,
      source,
      endpoint: `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(key)}/jobs?content=true`,
    };
  }
  if (/^jobs(?:\.eu)?\.lever\.co$/i.test(url.hostname)) {
    const apiHost = url.hostname === "jobs.eu.lever.co" ? "api.eu.lever.co" : "api.lever.co";
    return {
      id: `lever:${apiHost}:${key.toLowerCase()}`,
      provider: "lever",
      key,
      company,
      source,
      endpoint: `https://${apiHost}/v0/postings/${encodeURIComponent(key)}?mode=json&limit=1000`,
    };
  }
  if (url.hostname === "jobs.ashbyhq.com") {
    return {
      id: `ashby:${key.toLowerCase()}`,
      provider: "ashby",
      key,
      company,
      source,
      endpoint: `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(key)}`,
    };
  }
  return null;
}

export function isEarlyCareerTitle(title: string): boolean {
  return /\bintern(ship)?\b|\bco-?op\b|\bnew grad(uate)?\b|\bentry[- ]level\b|\bearly career\b|\buniversity (?:grad|graduate|hire)\b|\bcampus (?:hire|recruit)\b/i.test(title);
}

function validPostedAt(value: unknown): string | null {
  const date = typeof value === "number" ? new Date(value) : typeof value === "string" ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function parseBoardJobs(board: AtsBoard, payload: unknown): BoardJob[] {
  if (board.provider === "greenhouse") {
    const jobs = (payload as { jobs?: Array<Record<string, unknown>> }).jobs ?? [];
    return jobs.map((job) => ({
      title: String(job.title ?? ""),
      location: String((job.location as { name?: unknown } | undefined)?.name ?? "Location not stated"),
      applyUrl: String(job.absolute_url ?? ""),
      description: String(job.content ?? ""),
    }));
  }
  if (board.provider === "lever") {
    const jobs = Array.isArray(payload) ? payload as Array<Record<string, unknown>> : [];
    return jobs.map((job) => {
      const categories = job.categories as { location?: unknown; commitment?: unknown; team?: unknown } | undefined;
      return {
        title: String(job.text ?? ""),
        location: String(categories?.location ?? "Location not stated"),
        applyUrl: String(job.applyUrl ?? job.hostedUrl ?? ""),
        postedAt: typeof job.createdAt === "number" ? job.createdAt : null,
        description: `${String(job.descriptionPlain ?? "")} ${String(categories?.commitment ?? "")} ${String(categories?.team ?? "")}`,
      };
    });
  }
  const jobs = (payload as { jobs?: Array<Record<string, unknown>> }).jobs ?? [];
  return jobs
    .filter((job) => job.isListed !== false)
    .map((job) => ({
      title: String(job.title ?? ""),
      location: String(job.location ?? "Location not stated"),
      applyUrl: String(job.applyUrl ?? job.jobUrl ?? ""),
      postedAt: typeof job.publishedAt === "string" ? job.publishedAt : null,
      description: `${String(job.department ?? "")} ${String(job.team ?? "")}`,
    }));
}

export async function fetchAtsBoard(board: AtsBoard, now = new Date()): Promise<AtsBoardResult> {
  const response = await fetch(board.endpoint, {
    headers: { accept: "application/json", "user-agent": "App-Expo/0.2" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const parsed = parseBoardJobs(board, await response.json());
  const liveIdentities = new Set<string>();
  const jobs: CandidateJob[] = [];

  for (const job of parsed) {
    const applyUrl = canonicalizeUrl(job.applyUrl);
    const identity = applyUrl && jobIdentity(applyUrl);
    if (!applyUrl || !identity || !job.title) continue;
    liveIdentities.add(identity);
    if (!isEarlyCareerTitle(job.title)) continue;
    const postedAt = validPostedAt(job.postedAt);
    const text = `${job.title} ${job.location} ${job.description ?? ""}`;
    jobs.push({
      company: board.company,
      title: job.title,
      term: inferTerm(text),
      location: job.location || "Location not stated",
      workMode: inferWorkMode(text),
      postedAt: postedAt ?? now.toISOString(),
      postedAtSource: postedAt ? "exact" : "first_seen",
      applyUrl,
      category: /\bintern(ship)?\b|\bco-?op\b/i.test(job.title) ? "Internship" : "New grad",
      salary: null,
      source: `Direct ATS (${board.provider[0].toUpperCase()}${board.provider.slice(1)})`,
      rawText: text,
    });
  }
  return { board, jobs, liveIdentities };
}
