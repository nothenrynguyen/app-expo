import { load } from "../html";
import { isEarlyCareerTitle } from "../ats-boards";
import { normalizeCompanyName } from "../company-quality";
import { hasRequiredExperienceConflict } from "../early-career-evidence";
import { classifyRoleTags } from "../role-areas";
import { inferTerm, inferWorkMode, normalizeDisplayText, opportunityIdentity, type CandidateJob } from "../source-normalization";
import { sourceReviewHoldIdentity } from "./source-review-holds";
import type { ListingHealthRecord } from "../listing-health";
import { inBatches } from "./concurrency";

// Reviewed link: https://gf.com/careers/ -> https://careers.gf.com/.
// These are anonymous endpoints used by that site's public search client.
// Keep employer/Workday-site mappings explicit; an ATS ID never grants trust
// to another employer, tenant or career site.
const origin = "https://careers.gf.com", domain = "globalfoundries.com";
const positives = new WeakMap<CandidateJob, string>();
export const publicIndexEvidenceAt = (row: CandidateJob) => positives.get(row);
type Position = { id: number; reqid: string; title: string };
type Posting = Pick<CandidateJob, "title" | "location" | "rawText" | "category" | "term" | "workMode" | "postedAt" | "postedAtSource">;
export type PublicIndexState = {
  index?: { checkedAt: string; status: "live" | "unknown"; positions: Position[] };
  postings: Record<string, { checkedAt: string; url: string; status: "live" | "unknown"; posting?: Posting }>;
};
const age = (at: string | undefined, now: Date) => at && Date.parse(at) <= now.getTime() ? now.getTime() - Date.parse(at) : Infinity;
const HOUR = 3600_000;

export function publicIndexReference(row: Pick<CandidateJob, "company" | "applyUrl">) {
  if (normalizeCompanyName(row.company) !== "globalfoundries") return null;
  try {
    const u = new URL(row.applyUrl), key = opportunityIdentity(row.applyUrl);
    if (u.protocol !== "https:" || u.username || u.password || u.port
      || !key?.match(/^workday:globalfoundries\.wd1\.myworkdayjobs\.com:external:jr-\d+$/)) return null;
    return { key, reqid: key.split(":").at(-1)!.toUpperCase() };
  } catch { return null; }
}

export function parsePublicIndexPosting(position: Position, payload: unknown, now: Date): Posting | null {
  if (!payload || typeof payload !== "object") return null;
  const result = payload as {status?: number; data?: Record<string, unknown>; metadata?: {isFallback?: boolean}};
  const p = result.data;
  if (result.status !== 200 || result.metadata?.isFallback || !p || p.id !== position.id || p.displayJobId !== position.reqid
    || p.atsJobId !== position.reqid || p.publicUrl !== `${origin}/careers/job/${position.id}`
    || p.name !== position.title || typeof p.jobDescription !== "string" || !Array.isArray(p.locations)
    || !p.locations.length || !p.locations.every(v => typeof v === "string" && v.trim())
    || typeof p.postedTs !== "number" || p.postedTs * 1000 > now.getTime() || p.postedTs <= 0) return null;
  const $ = load(p.jobDescription);
  $("script,style,template,noscript,[hidden],[aria-hidden='true']").remove();
  const text = $("body").text().replace(/\s+/g," ").trim();
  if (text.length < 180 || /(?:job|position|posting) (?:is |has been )?(?:closed|no longer available)/i.test(text)
    || !isEarlyCareerTitle(position.title, text) || hasRequiredExperienceConflict(text)) return null;
  const title = normalizeDisplayText(position.title), location = p.locations.join("; ");
  const posting: Posting = { title, location, rawText: text,
    category: /\bintern(?:ship)?\b|\bco-?op\b/i.test(title) ? "Internship" : "New grad",
    term: inferTerm(title), workMode: inferWorkMode(`${p.workLocationOption ?? ""} ${location}`),
    postedAt: new Date(p.postedTs * 1000).toISOString(), postedAtSource: "date_only" };
  return classifyRoleTags(posting).length ? posting : null;
}

export async function enrichPublicCareerIndex(rows: CandidateJob[], saved: PublicIndexState, now = new Date(),
  fetcher: typeof fetch = fetch, holds = new Set<string>(), budget = 60) {
  const state: PublicIndexState = structuredClone(saved);
  state.postings ??= {};
  const held = (url: string) => holds.has(sourceReviewHoldIdentity(url) ?? "");
  const unique = new Map<string, CandidateJob>();
  for (const row of rows) { const ref = publicIndexReference(row); if (ref && row.sourceActive !== false && !held(row.applyUrl)) unique.set(ref.key, row); }
  let requests = 0, attempted = 0;
  const get = async (url: string) => {
    if (requests >= budget) throw new Error("Public careers index request budget reached");
    requests++;
    const r = await fetcher(url, {redirect:"error", headers:{accept:"application/json"}, signal:AbortSignal.timeout(12_000)});
    if (!r.ok) throw new Error(`Public careers index ${r.status}`);
    return r.json();
  };
  const indexAge = age(state.index?.checkedAt, now);
  if (unique.size && budget >= 20 && indexAge >= (state.index?.status === "live" ? 6*HOUR : HOUR)) {
    state.index = {checkedAt:now.toISOString(),status:"unknown",positions:[]};
    try {
      const positions = new Map<string, Position>();
      let pages = 0;
      for (const query of ["Intern", "Graduate"]) {
        let count = 1;
        let expectedCount: number | undefined;
        const seen = new Set<string>();
        for (let start=0;start<count;start+=10) {
          if (++pages > 20) throw new Error("Public careers index page cap reached");
          const url = `${origin}/api/pcsx/search?domain=${domain}&query=${query}&start=${start}&hl=en`;
          const result = await get(url) as {status?: number; metadata?: {isFallback?: boolean}; data?: {count?: number;positions?: unknown[]}};
          const data = result.data;
          if (result.status !== 200 || result.metadata?.isFallback || !data || !Number.isInteger(data.count) || data.count! < 0
            || !Array.isArray(data.positions) || data.positions.length > 10 || (!data.positions.length && start < data.count!)) throw new Error("Incomplete public careers index");
          count = data.count!;
          expectedCount ??= count;
          if (count !== expectedCount || data.positions.length !== Math.min(10, count-start)) throw new Error("Public careers index changed during pagination");
          for (const raw of data.positions) {
            const p = raw as Record<string, unknown>;
            if (!p || !Number.isSafeInteger(p.id) || typeof p.name !== "string" || !p.name.trim()
              || typeof p.displayJobId !== "string" || !/^JR-\d+$/.test(p.displayJobId) || p.atsJobId !== p.displayJobId
              || p.positionUrl !== `/careers/job/${p.id}`) throw new Error("Invalid public careers index position");
            if (seen.has(p.displayJobId)) throw new Error("Duplicate paginated public requisition");
            seen.add(p.displayJobId);
            const existing = positions.get(p.displayJobId);
            if (existing && (existing.id !== p.id || existing.title !== p.name)) throw new Error("Ambiguous public requisition");
            positions.set(p.displayJobId,{id:p.id as number,reqid:p.displayJobId,title:p.name});
          }
        }
      }
      state.index = {checkedAt:now.toISOString(),status:"live",positions:[...positions.values()]};
    } catch { /* No positive evidence from partial, fallback or failed indexes. */ }
  }
  const index = state.index?.status === "live" && age(state.index.checkedAt, now) < 12*HOUR
    ? new Map(state.index.positions.map(p=>[p.reqid,p])) : new Map<string, Position>();
  const due = [...unique].filter(([key,row]) => index.has(publicIndexReference(row)!.reqid)
    && ((state.postings[key]?.status === "live" && state.postings[key]?.posting?.title !== normalizeDisplayText(index.get(publicIndexReference(row)!.reqid)!.title))
      || age(state.postings[key]?.checkedAt, now) >= (state.postings[key]?.status === "live" ? 12*HOUR : HOUR)))
    .sort(([a],[b]) => age(state.postings[b]?.checkedAt,now)-age(state.postings[a]?.checkedAt,now) || a.localeCompare(b))
    .slice(0,Math.min(40,Math.max(0,budget-requests)));
  // Reserve the entire detail batch before concurrency to enforce the hard cap.
  attempted = due.length;
  await inBatches(due, 2, async ([key,row]) => {
    state.postings[key] = {checkedAt:now.toISOString(),url:row.applyUrl,status:"unknown"};
    try {
      const p = index.get(publicIndexReference(row)!.reqid)!;
      const data = await get(`${origin}/api/pcsx/position_details?position_id=${p.id}&domain=${domain}&hl=en`);
      const posting = parsePublicIndexPosting(p,data,now);
      if (posting) state.postings[key] = {...state.postings[key],status:"live",posting};
    } catch { /* A failed detail recheck invalidates the prior positive. */ }
  });
  const checked = new Set(due.map(([key])=>key)), verified = new Set<string>(), reused = new Set<string>();
  const candidates = rows.map(row => {
    const ref = publicIndexReference(row), record = ref && state.postings[ref.key];
    if (!ref || row.sourceActive === false || held(row.applyUrl) || !index.has(ref.reqid) || record?.status !== "live"
      || age(record.checkedAt,now) >= 24*HOUR || !record.posting) return row;
    // Revalidate cached descriptions through the same eligibility checks.
    const posting = record.posting;
    if (posting.title !== normalizeDisplayText(index.get(ref.reqid)!.title)
      || !isEarlyCareerTitle(posting.title,posting.rawText) || hasRequiredExperienceConflict(posting.rawText)
      || !classifyRoleTags(posting).length) return row;
    const result = {...row,...posting}; positives.set(result,record.checkedAt);
    (checked.has(ref.key)?verified:reused).add(ref.key); return result;
  });
  const observations: ListingHealthRecord[] = [...unique].map(([key,row]) => {
    const record=state.postings[key], live=index.has(publicIndexReference(row)!.reqid) && record?.status==="live" && age(record.checkedAt,now)<24*HOUR;
    return {url:row.applyUrl,checkedAt:live?record.checkedAt:now.toISOString(),status:live?"live":"unknown",httpStatus:null};
  });
  return {candidates,state,requests,attempted,verified:verified.size,reused:reused.size,observations};
}
