import { createWorkdayBoard, parseWorkdayJob } from "../workday";
import { parseSmartRecruitersJobUrl } from "../smartrecruiters";
import { canonicalizeUrl, inferTerm, inferWorkMode, jobIdentity, type CandidateJob } from "../source-normalization";
import { isEarlyCareerTitle } from "../ats-boards";
import { classifyRoleTags, ROLE_TAGS } from "../role-areas";
import { evaluateCompanyQuality } from "../company-quality";
import { employerBoardIdentity } from "./reviewed-employer-coverage";
import { sourceVerificationKey } from "./source-verification";
import { inBatches } from "./concurrency";

export type RecoverySeed = {company: string; url: string};
export type RecoveryState = Record<string, {checkedAt: string; status: "live" | "unknown"; accessDenied?: boolean; candidate?: CandidateJob}>;
const liveThisRun = new WeakMap<CandidateJob, string>();
export const recoveryEvidenceAt = (candidate: CandidateJob) => liveThisRun.get(candidate);
export const isRecoveryLive = (candidate: CandidateJob) => liveThisRun.has(candidate);

export function recoveryEndpoint(seed: RecoverySeed): {url: string; provider: "workday" | "smartrecruiters"; site?: string; externalPath?: string} | null {
  try {
    const url = new URL(seed.url);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (/^[a-z0-9-]+\.wd\d+\.myworkdayjobs\.com$/i.test(url.hostname)) {
      const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
      const index = parts.indexOf("job");
      if (index < 1 || !parts[index + 2]) return null;
      const site = parts[index - 1];
      const externalPath = `/${parts.slice(index).map(encodeURIComponent).join("/")}`;
      return {provider: "workday", site, externalPath, url: `${url.origin}/wday/cxs/${url.hostname.split(".")[0]}/${encodeURIComponent(site)}${externalPath}`};
    }
    const posting = parseSmartRecruitersJobUrl(seed.url);
    return posting ? {provider: "smartrecruiters", url: posting.endpoint} : null;
  } catch { return null; }
}

export function parseRecoveryPosting(seed: RecoverySeed, data: Record<string, unknown>, now = new Date()): CandidateJob | null {
  const reference = recoveryEndpoint(seed);
  if (!reference) return null;
  let candidate: CandidateJob | null = null;
  if (reference.provider === "workday") {
    const info = data.jobPostingInfo as {title?: string; jobReqId?: string; posted?: boolean; canApply?: boolean; country?: {descriptor?: string}} | undefined;
    if (!info || info.posted !== true || info.canApply !== true || typeof info.title !== "string" || !info.title.trim() || typeof info.jobReqId !== "string") return null;
    const path = decodeURIComponent(new URL(seed.url).pathname).toLowerCase();
    const req = info.jobReqId.toLowerCase();
    if (!path.endsWith(`_${req}`) && !new RegExp(`_${req.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-\\d+$`).test(path)) return null;
    const board = createWorkdayBoard({host: new URL(seed.url).hostname, tenant: new URL(seed.url).hostname.split(".")[0], site: reference.site!, company: seed.company, searchTerms: ["intern"]});
    candidate = parseWorkdayJob(board, {externalPath: reference.externalPath}, data, now);
    if (candidate && info.country?.descriptor && !candidate.location.toLowerCase().includes(info.country.descriptor.toLowerCase())) candidate.location += `, ${info.country.descriptor}`;
  } else {
    const posting = data as {id?: string; company?: {identifier?: string}; active?: boolean; name?: string; releasedDate?: string; location?: {city?: string; region?: string; country?: string}; jobAd?: {sections?: Record<string, {text?: string}>}};
    if (posting.active !== true || typeof posting.name !== "string" || !posting.name.trim()) return null;
    const expected = parseSmartRecruitersJobUrl(seed.url)!;
    if (posting.id && String(posting.id) !== expected.jobId || posting.company?.identifier && posting.company.identifier.toLowerCase() !== expected.companyIdentifier.toLowerCase()) return null;
    const description = Object.values(posting.jobAd?.sections ?? {}).map(section => section.text ?? "").join(" ").replace(/<[^>]+>/g, " ");
    if (!isEarlyCareerTitle(posting.name, description)) return null;
    const country = posting.location?.country;
    const location = [posting.location?.city, posting.location?.region, country && /^[a-z]{2}$/i.test(country) ? new Intl.DisplayNames(["en"], {type: "region"}).of(country.toUpperCase()) : country].filter(Boolean).join(", ") || "Location not stated";
    const date = posting.releasedDate ? new Date(posting.releasedDate) : null;
    candidate = {company: seed.company, title: posting.name, applyUrl: seed.url, category: /\bintern(?:ship)?\b|\bco-?op\b/i.test(posting.name) ? "Internship" : "New grad", location, term: inferTerm(posting.name), workMode: inferWorkMode(`${posting.name} ${description}`), postedAt: date && Number.isFinite(date.getTime()) ? date.toISOString() : now.toISOString(), postedAtSource: date && Number.isFinite(date.getTime()) ? "exact" : "first_seen", source: "Employer recovery", salary: null, rawText: `${posting.name} ${description}`};
  }
  if (!candidate || sourceVerificationKey(candidate.applyUrl) !== sourceVerificationKey(seed.url) || employerBoardIdentity(candidate.applyUrl) !== employerBoardIdentity(seed.url) || evaluateCompanyQuality({name: seed.company, title: candidate.title}, candidate.rawText, []).status === "rejected") return null;
  const roleTags = classifyRoleTags(candidate);
  // Persist derived factual metadata, never employer job descriptions.
  return {...candidate, applyUrl: canonicalizeUrl(candidate.applyUrl)!, sourceActive: true, source: "Employer recovery", roleTags, rawText: `${candidate.title} ${candidate.location} ${roleTags.map(tag => ROLE_TAGS.find(role => role.value === tag)?.label ?? "").join(" ")}`};
}

export async function loadEmployerRecovery(seeds: RecoverySeed[], saved: RecoveryState, now = new Date(), fetcher: typeof fetch = fetch, limit = 500) {
  const state: RecoveryState = {...saved};
  const candidates: CandidateJob[] = [];
  const unique = [...new Map(seeds.filter(seed => seed.company?.trim() && recoveryEndpoint(seed)).map(seed => [jobIdentity(seed.url)!, seed])).entries()];
  const stoppedHosts = new Set(unique.filter(([id]) => state[id]?.accessDenied && now.getTime() - Date.parse(state[id].checkedAt) < 24 * 60 * 60_000).map(([, seed]) => new URL(recoveryEndpoint(seed)!.url).hostname));
  const due = unique.filter(([, seed]) => !stoppedHosts.has(new URL(recoveryEndpoint(seed)!.url).hostname)).filter(([id]) => !state[id] || !Number.isFinite(Date.parse(state[id].checkedAt)) || now.getTime() - Date.parse(state[id].checkedAt) >= (state[id].status === "live" ? 12 : 24) * 60 * 60_000).sort(([a], [b]) => (Date.parse(state[a]?.checkedAt ?? "1970-01-01") - Date.parse(state[b]?.checkedAt ?? "1970-01-01")) || a.localeCompare(b)).slice(0, limit);
  const started = Date.now();
  let requests = 0;
  await inBatches(due, 8, async ([id, seed]) => {
    const endpoint = recoveryEndpoint(seed)!;
    const host = new URL(endpoint.url).hostname;
    if (Date.now() - started >= 120_000 || stoppedHosts.has(host)) return;
    requests++;
    try {
      const response = await fetcher(endpoint.url, {headers: {accept: "application/json", connection: "close", "user-agent": "empluzzed/0.4"}, signal: AbortSignal.timeout(Math.min(8_000, 120_000 - (Date.now() - started)))});
      if ([401, 403, 429].includes(response.status)) stoppedHosts.add(host);
      const candidate = response.ok ? parseRecoveryPosting(seed, await response.json(), now) : null;
      state[id] = candidate ? {checkedAt: now.toISOString(), status: "live", candidate} : {checkedAt: now.toISOString(), status: "unknown", accessDenied: [401, 403, 429].includes(response.status)};
    } catch { state[id] = {checkedAt: now.toISOString(), status: "unknown"}; }
  });
  for (const [id, seed] of unique) {
    const entry = state[id];
    const age = now.getTime() - Date.parse(entry?.checkedAt ?? "");
    if (entry?.status === "live" && entry.candidate && age >= 0 && age < 24 * 60 * 60_000 && sourceVerificationKey(entry.candidate.applyUrl) === sourceVerificationKey(seed.url) && entry.candidate.company === seed.company && employerBoardIdentity(entry.candidate.applyUrl) === employerBoardIdentity(seed.url)) {
      liveThisRun.set(entry.candidate, entry.checkedAt); candidates.push(entry.candidate);
    }
  }
  return {state, candidates, requests, targets: unique.length, attempted: requests, unknown: unique.filter(([id]) => state[id]?.status === "unknown").length, pausedHosts: stoppedHosts.size, remaining: unique.filter(([id]) => !state[id]).length, durationMs: Date.now() - started};
}
