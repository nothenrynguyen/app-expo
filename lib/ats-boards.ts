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

export type AtsBoardSeed = Pick<AtsBoard, "provider" | "key" | "company">;

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

export function createAtsBoard(seed: AtsBoardSeed, source = "Pinned ATS"): AtsBoard {
  const key = seed.key.trim();
  const normalizedKey = key.toLowerCase();
  const endpoint = seed.provider === "greenhouse"
    ? `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(key)}/jobs?content=true`
    : seed.provider === "lever"
      ? `https://api.lever.co/v0/postings/${encodeURIComponent(key)}?mode=json&limit=1000`
      : `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(key)}`;

  return {
    id: seed.provider === "lever" ? `lever:api.lever.co:${normalizedKey}` : `${seed.provider}:${normalizedKey}`,
    provider: seed.provider,
    key,
    company: seed.company,
    source,
    endpoint,
  };
}

export function discoverAtsBoard(applyUrl: string, company: string, source: string): AtsBoard | null {
  const canonical = canonicalizeUrl(applyUrl);
  if (!canonical) return null;
  const url = new URL(canonical);
  const [encodedKey] = url.pathname.split("/").filter(Boolean);
  if (!encodedKey || encodedKey === "embed") return null;
  let key: string;
  try {
    key = decodeURIComponent(encodedKey);
  } catch {
    return null;
  }

  if (/^(?:job-boards\.|boards\.)greenhouse\.io$/i.test(url.hostname)) {
    return createAtsBoard({ provider: "greenhouse", key, company }, source);
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
    return createAtsBoard({ provider: "ashby", key, company }, source);
  }
  return null;
}

export function isEarlyCareerTitle(title: string, description = ""): boolean {
  const explicitEarlyCareer = /\b(?:intern(?:ship)?|co-?op|new (?:college )?grad(?:uate)?|early career|university grad(?:uate)?|entry[- ]level)\b/i.test(title);
  if (/\b(?:senior|sr\.?|staff|principal|director|head|lead)\b/i.test(title)) return false;
  const titleSignal = /\bintern(ship)?\b|\bco-?op\b|\bnew (?:college )?grad(uate)?\b|\bentry[- ]level\b|\bearly career\b|\buniversity (?:grad|graduate|hire)\b|\bcampus (?:hire|recruit)\b|\bjunior\b|\bjr\.?\b|\b(?:engineer|scientist|analyst|specialist) i\b|\bassociate solutions? engineer\b|\bsupport engineer(?:ing)? tier 1\b/i.test(title);

  const normalizedDescription = description
    .replace(/&(?:ndash|mdash|#8211|#8212|#x2013|#x2014);/gi, "-")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  const descriptionSignal = /\b(?:entry[- ]level|new (?:college )?grad(?:uate)?|early career|university grad(?:uate)?)\b/i.test(normalizedDescription)
    || /\b(?:0|1)\s*(?:-|to)\s*[123]\s+(?:years?|yrs?)\b[^.]{0,60}\bexperience\b/i.test(normalizedDescription)
    || /\b(?:experience|professional experience)\b[^.]{0,60}\b(?:0|1)\s*(?:-|to)\s*[123]\s+(?:years?|yrs?)\b/i.test(normalizedDescription)
    || /\bup to\s+3\s+(?:years?|yrs?)\b[^.]{0,60}\bexperience\b/i.test(normalizedDescription)
    || /\b(?:one|1)\+?\s+(?:years?|yrs?)\b[^.]{0,60}\bexperience\b/i.test(normalizedDescription);
  const descriptionQualifiedProductManager = /\bproduct manager\b/i.test(title) && descriptionSignal;
  if (/\bmanager\b/i.test(title) && !explicitEarlyCareer && !descriptionQualifiedProductManager) return false;
  return titleSignal || descriptionSignal;
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
      description: `${String(job.descriptionPlain ?? "")} ${String(job.department ?? "")} ${String(job.team ?? "")}`,
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
    if (!isEarlyCareerTitle(job.title, job.description)) continue;
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
