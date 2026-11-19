import { load } from "../html";
import { isEarlyCareerTitle } from "../ats-boards";
import { evaluateCompanyQuality, normalizeCompanyName } from "../company-quality";
import { hasRequiredExperienceConflict } from "../early-career-evidence";
import { classifyRoleTags, ROLE_TAGS } from "../role-areas";
import { inferTerm, inferWorkMode, opportunityIdentity, type CandidateJob } from "../source-normalization";
import type { ListingHealthRecord } from "../listing-health";
import { sourceReviewHoldIdentity } from "./source-review-holds";
import { inBatches } from "./concurrency";

type Posting = Pick<CandidateJob, "title" | "location" | "category" | "term" | "workMode" | "rawText">;
export type MirrorState = Record<string, { checkedAt: string; status: "live" | "unknown" | "closed"; posting?: Posting; url: string }>;
const positives = new WeakMap<CandidateJob, string>();
export const mirrorEvidenceAt = (row: CandidateJob) => positives.get(row);

// Reviewed corporate careers link: https://www.hntb.com/careers/ -> hntb.jobs.
// The public site uses these exact search/detail services. No Workday request
// or cooldown bypass is involved, and no other customer/domain is queried.
const SEARCH = "https://prod-search-api.jobsyn.org/api/v1/solr/search";
const DETAILS = "https://microsites.dejobs.org/hntb-jobs/data/";
export function mirrorReference(row: Pick<CandidateJob, "company" | "applyUrl">) {
  if (normalizeCompanyName(row.company) !== "hntb") return null;
  try {
    const u = new URL(row.applyUrl), key = opportunityIdentity(row.applyUrl);
    if (u.protocol !== "https:" || u.username || u.password || u.port || u.hostname !== "hntb.wd5.myworkdayjobs.com"
      || !key?.match(/^workday:hntb\.wd5\.myworkdayjobs\.com:hntb_(?:university_)?careers:r-\d+$/)) return null;
    return { key, reqid: key.split(":").at(-1)!.toUpperCase() };
  } catch { return null; }
}

export function parseMirrorPosting(row: CandidateJob, data: Record<string, unknown>, guid: string, target: string): Posting | null {
  const ref = mirrorReference(row);
  let application: URL;
  try { application = new URL(target); } catch { return null; }
  if (application.pathname.endsWith("/apply")) application.pathname = application.pathname.slice(0, -6);
  if (!ref || application.port || opportunityIdentity(application.toString()) !== ref.key || Object.hasOwn(data, "deleted_at")
    || data.guid !== guid || data.buid !== 48236 || data.company_exact !== "HNTB" || data.reqid !== ref.reqid
    || data.company_canonical_microsite !== "https://hntb.jobs/" || typeof data.title_exact !== "string"
    || typeof data.html_description !== "string" || typeof data.location !== "string" || !data.location.trim()
    || data.country_short_exact !== "USA") return null;
  const $ = load(data.html_description);
  $("script,style,template,noscript,[hidden],[aria-hidden='true']").remove();
  $("p,li,h1,h2,h3,div,br").prepend("\n").append("\n");
  const description = $.root().text().trim();
  const candidate = { ...row, title: data.title_exact.trim(), location: `${data.location}, United States`, rawText: description };
  if (description.length < 120 || !isEarlyCareerTitle(candidate.title, description) || hasRequiredExperienceConflict(description)
    || evaluateCompanyQuality({ name: row.company, title: candidate.title }, description, []).status === "rejected") return null;
  const tags = classifyRoleTags(candidate);
  if (!tags.length) return null;
  return { title: candidate.title, location: candidate.location,
    category: /\bintern(?:ship)?\b|\bco-?op\b/i.test(candidate.title) ? "Internship" : "New grad",
    term: inferTerm(`${candidate.title} ${description}`), workMode: inferWorkMode(`${candidate.title} ${description}`),
    // Persist factual classification metadata, not employer descriptions.
    rawText: `${candidate.title} ${candidate.location} ${tags.map(tag => ROLE_TAGS.find(r => r.value === tag)?.label ?? "").join(" ")}` };
}

export async function enrichEmployerMirrors(rows: CandidateJob[], saved: MirrorState, now: Date, fetcher: typeof fetch = fetch,
  holds = new Set<string>(), limit = 10) {
  const timestamp = now.getTime();
  if (!saved || typeof saved !== "object" || Array.isArray(saved) || Object.entries(saved).some(([key, record]) => !record
    || !["live", "unknown", "closed"].includes(record.status) || !Number.isFinite(Date.parse(record.checkedAt))
    || Date.parse(record.checkedAt) > timestamp || mirrorReference({ company: "HNTB", applyUrl: record.url })?.key !== key)) throw new Error("Invalid employer-mirror observation state");
  const held = (url: string) => holds.has(sourceReviewHoldIdentity(url) ?? "");
  const eligible = [...new Map(rows.filter(row => row.sourceActive !== false && mirrorReference(row) && !held(row.applyUrl))
    .map(row => [mirrorReference(row)!.key, row])).entries()];
  const state = structuredClone(saved);
  const waiting = eligible.filter(([key]) => !saved[key] || timestamp - Date.parse(saved[key].checkedAt) >= (saved[key].status === "live" ? 12 : 24) * 3600_000)
    .sort(([a], [b]) => Number(saved[b]?.status === "live") - Number(saved[a]?.status === "live")
      || Date.parse(saved[a]?.checkedAt ?? "1970-01-01") - Date.parse(saved[b]?.checkedAt ?? "1970-01-01") || a.localeCompare(b));
  const queues = [...Map.groupBy(waiting, ([key]) => key.split(":")[2]).values()];
  const due: typeof waiting = [];
  while (due.length < Math.min(10, Math.max(0, limit)) && queues.some(queue => queue.length)) for (const queue of queues) {
    if (due.length >= Math.min(10, Math.max(0, limit))) break;
    const entry = queue.shift(); if (entry) due.push(entry);
  }
  let requests = 0;
  const get = async (url: string, headers?: Record<string, string>) => {
    requests++;
    return fetcher(url, { headers, redirect: "manual", signal: AbortSignal.timeout(10_000) });
  };
  await inBatches(due, 2, async ([key, row]) => {
    state[key] = { url: row.applyUrl, checkedAt: now.toISOString(), status: "unknown" };
    try {
      const ref = mirrorReference(row)!;
      const search = new URL(SEARCH); search.searchParams.set("q", ref.reqid);
      const response = await get(search.toString(), { "X-Origin": "hntb.jobs", Accept: "application/json" });
      if (!response.ok) return;
      const result = await response.json() as { jobs?: Array<{ guid?: string; company_exact?: string; buid?: number; reqid?: string }> };
      const matches = result.jobs?.filter(job => job.company_exact === "HNTB" && job.buid === 48236 && job.reqid === ref.reqid
        && typeof job.guid === "string" && /^[A-F0-9]{32}$/.test(job.guid));
      if (matches?.length !== 1) return; // Missing/ambiguous mirror evidence is not closure.
      const guid = matches[0].guid!;
      const details = await get(`${DETAILS}${guid}.json`);
      if (!details.ok) return;
      const data = await details.json() as Record<string, unknown>;
      if (data.guid !== guid || data.reqid !== ref.reqid || data.company_exact !== "HNTB" || data.buid !== 48236) return;
      // This is the public site's own expiry check. Its search results also
      // contain is_posted:false, which the site does not use as an expiry flag.
      if (Object.hasOwn(data, "deleted_at")) return;
      // Only the exact Apply URL supplied by this reviewed provider is queried.
      if (data.link !== `https://de.jobsyn.org/${guid}10`) return;
      const apply = await get(data.link);
      const target = apply.headers.get("location");
      if (![301, 302, 303, 307, 308].includes(apply.status) || !target || held(target)) return;
      const posting = parseMirrorPosting(row, data, guid, target);
      if (posting) state[key] = { ...state[key], status: "live", posting };
    } catch { /* Failed rechecks replace old positives with unknown evidence. */ }
  });
  const checked = new Set(due.map(([key]) => key)), verified = new Set<string>(), reused = new Set<string>();
  const candidates = rows.map(row => {
    const ref = mirrorReference(row), record = ref && state[ref.key], posting = record?.posting;
    if (!ref || row.sourceActive === false || held(row.applyUrl) || record?.status !== "live" || !posting
      || timestamp - Date.parse(record.checkedAt) >= 24 * 3600_000 || typeof posting.title !== "string" || typeof posting.rawText !== "string"
      || typeof posting.location !== "string" || !isEarlyCareerTitle(posting.title, posting.rawText) || !classifyRoleTags(posting).length) return row;
    const candidate = { ...row, ...posting };
    positives.set(candidate, record.checkedAt); (checked.has(ref.key) ? verified : reused).add(ref.key);
    return candidate;
  });
  const observations: ListingHealthRecord[] = Object.values(state).map(record => ({ url: record.url,
    checkedAt: record.checkedAt, status: record.status, httpStatus: null }));
  return { candidates, state, requests, attempted: due.length, verified: verified.size, reused: reused.size, observations };
}
