import { discoverAtsBoard, fetchAtsBoard, type AtsBoard, type AtsBoardResult } from "../ats-boards";
import { workdayRequisitionIdentity } from "../job-dedup";
import type { PublicJob } from "../jobs";
import { jobIdentity, type CandidateJob } from "../source-normalization";
import type { JobSource } from "../source-catalog";
import { parseSmartRecruitersJobUrl } from "../smartrecruiters";
import { sourceReviewHoldIdentity } from "./source-review-holds";

export type SourceVerificationTargets = Record<string, { url: string; sourceIds: string[] }>;

export function sourceVerificationKey(url: string): string | null {
  try {
    const target = new URL(url);
    const board = discoverAtsBoard(url, "Source verification", "Source verification");
    const greenhouseId = board?.provider === "greenhouse" ? target.pathname.match(/\/jobs\/(\d+)/)?.[1] : null;
    if (greenhouseId) return `source:${board!.id}:${greenhouseId}`;
    if (target.hostname === "jobs.smartrecruiters.com") {
      const [company, posting] = target.pathname.split("/").filter(Boolean);
      const id = posting?.match(/^(\d+)(?:-|$)/)?.[1];
      if (company && id) return `source:smartrecruiters:${company.toLowerCase()}:${id}`;
    }
  } catch { return null; }
  const identity = sourceReviewHoldIdentity(url);
  return identity ? `source:${identity}` : null;
}

// Remember admission through a guarded feed even if it later disappears, fails,
// or an accepted alias is attributed to another source. Automatic source
// retirement must not retire the guard; removing its policy does that explicitly.
export function buildSourceVerificationTargets(
  sources: JobSource[], candidates: CandidateJob[], previous: PublicJob[], saved: SourceVerificationTargets,
): SourceVerificationTargets {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Invalid persisted source verification targets.");
  const guarded = new Map(sources.filter(source => source.requireLiveListing).map(source => [source.name, source.id]));
  const activeIds = new Set(guarded.values());
  const targets: SourceVerificationTargets = {};
  for (const [key, target] of Object.entries(saved)) {
    if (!target || typeof target.url !== "string" || !Array.isArray(target.sourceIds)
      || !target.sourceIds.length || !target.sourceIds.every(id => typeof id === "string") || sourceVerificationKey(target.url) !== key) {
      throw new Error("Invalid persisted source verification target.");
    }
    const sourceIds = target.sourceIds.filter(id => activeIds.has(id));
    if (sourceIds.length) targets[key] = { url: target.url, sourceIds };
  }
  const add = (url: string, names: string[]) => {
    const sourceIds = names.flatMap(name => guarded.has(name) ? [guarded.get(name)!] : []);
    const key = sourceVerificationKey(url);
    if (!key || !sourceIds.length) return;
    targets[key] = { url, sourceIds: [...new Set([...(targets[key]?.sourceIds ?? []), ...sourceIds])] };
  };
  for (const job of previous) add(job.applyUrl, job.sources);
  for (const candidate of candidates) add(candidate.applyUrl, [candidate.source]);
  return targets;
}

export function sourceListingIsAllowed(url: string, targets: SourceVerificationTargets, verified: Set<string>): boolean {
  const key = sourceVerificationKey(url);
  return !key || !targets[key] || verified.has(key);
}

export function createSourceListingVerifier(options: {
  boardResults?: Map<string, Pick<AtsBoardResult, "liveIdentities">>;
  fetchBoard?: (board: AtsBoard) => Promise<Pick<AtsBoardResult, "liveIdentities">>;
  fetchImpl?: typeof fetch;
} = {}) {
  const boardResults = options.boardResults ?? new Map();
  const fetchBoard = options.fetchBoard ?? fetchAtsBoard;
  const fetchImpl = options.fetchImpl ?? fetch;
  const boards = new Map<string, Promise<Pick<AtsBoardResult, "liveIdentities">>>();
  return async (value: string): Promise<boolean> => {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || url.username || url.password) return false;
      if (/^[a-z0-9-]+\.wd\d+\.myworkdayjobs\.com$/i.test(url.hostname)) {
        const parts = url.pathname.split("/").filter(Boolean);
        const job = parts.indexOf("job");
        const requisition = workdayRequisitionIdentity(value)?.split(":")[1];
        if (job < 1 || !parts[job + 2] || !requisition) return false;
        const endpoint = `${url.origin}/wday/cxs/${url.hostname.split(".")[0]}/${[parts[job - 1], ...parts.slice(job)].map(part => encodeURIComponent(decodeURIComponent(part))).join("/")}`;
        const response = await fetchImpl(endpoint, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
        if (!response.ok) return false;
        const info = (await response.json())?.jobPostingInfo;
        return info?.posted === true && info.canApply === true && typeof info.title === "string" && !!info.title.trim()
          && typeof info.jobReqId === "string" && info.jobReqId.toLowerCase() === requisition;
      }
      const board = discoverAtsBoard(value, "Source verification", "Source verification");
      if (board) {
        let result = boardResults.get(board.id);
        // A failed whole-board request is inconclusive. Greenhouse also has a
        // job-specific endpoint, which can confirm the exact vacancy directly.
        if (!result && board.provider === "greenhouse") {
          const id = url.pathname.match(/\/jobs\/(\d+)/)?.[1];
          if (!id) return false;
          const response = await fetchImpl(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.key)}/jobs/${id}`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
          if (!response.ok) return false;
          const data = await response.json();
          return String(data?.id ?? "") === id && typeof data.title === "string" && !!data.title.trim();
        }
        if (!result) {
          if (!boards.has(board.id)) boards.set(board.id, fetchBoard(board));
          result = await boards.get(board.id)!;
        }
        const identity = jobIdentity(value);
        return !!identity && result.liveIdentities.has(identity);
      }
      const posting = parseSmartRecruitersJobUrl(value);
      if (!posting) return false;
      const response = await fetchImpl(posting.endpoint, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
      if (!response.ok) return false;
      const data = await response.json();
      return data?.active === true && typeof data.name === "string" && !!data.name.trim();
    } catch {
      return false;
    }
  };
}
