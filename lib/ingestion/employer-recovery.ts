import { createWorkdayBoard, parseWorkdayJob } from "../workday";
import { parseSmartRecruitersJobUrl } from "../smartrecruiters";
import { canonicalizeUrl, inferTerm, inferWorkMode, jobIdentity, opportunityIdentity, type CandidateJob } from "../source-normalization";
import type { PublicJob } from "../jobs";
import { currentWorkdayEvidence, type WorkdayCheck } from "./workday-continuity";
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
  return recoveryCandidate(candidate);
}

function recoveryCandidate(candidate: CandidateJob): CandidateJob {
  const roleTags = classifyRoleTags(candidate);
  // Persist derived factual metadata, never employer job descriptions.
  return {...candidate, applyUrl: canonicalizeUrl(candidate.applyUrl)!, sourceActive: true, source: "Employer recovery", roleTags, rawText: `${candidate.title} ${candidate.location} ${roleTags.map(tag => ROLE_TAGS.find(role => role.value === tag)?.label ?? "").join(" ")}`};
}

export async function loadEmployerRecovery(seeds: RecoverySeed[], saved: RecoveryState, now = new Date(), fetcher: typeof fetch = fetch, limit = 500, options: {
  previousJobs?: PublicJob[]; seenUrls?: string[]; workdayPostings?: CandidateJob[]; workdayChecks?: WorkdayCheck[];
} = {}) {
  if (!Number.isInteger(limit) || limit < 0 || limit > 500) throw new Error("Recovery request budget must be an integer from 0 to 500");
  const state: RecoveryState = {...saved};
  const candidates: CandidateJob[] = [];
  const unique = [...new Map(seeds.filter(seed => seed.company?.trim() && recoveryEndpoint(seed)).map(seed => [opportunityIdentity(seed.url)!, seed])).entries()];
  // Import legacy positive entries only when their full opportunity and employer
  // match. Unattributed legacy denials still pause that host, never grant trust.
  const stoppedHosts = new Set(unique.filter(([id, seed]) => {
    const entry = state[id] ?? saved[jobIdentity(seed.url)!];
    return entry?.accessDenied && now.getTime() >= Date.parse(entry.checkedAt) && now.getTime() - Date.parse(entry.checkedAt) < 24 * 60 * 60_000;
  }).map(([, seed]) => new URL(recoveryEndpoint(seed)!.url).hostname));
  const current = currentWorkdayEvidence(options.workdayPostings ?? [], options.workdayChecks ?? []);
  const currentById = new Map(current.postings.map(job => [opportunityIdentity(job.applyUrl), job]));
  const terminal = new Set((options.workdayChecks ?? []).filter(check => check.status === "closed" || check.status === "ineligible").map(check => opportunityIdentity(check.url)));
  let reusedCurrentPostings = 0;
  for (const [id, seed] of unique) {
    const legacyKey = jobIdentity(seed.url)!;
    const legacy = saved[legacyKey];
    if (!state[id] && legacy?.candidate && opportunityIdentity(legacy.candidate.applyUrl) === id && legacy.candidate.company === seed.company) {
      state[id] = legacy;
      if (legacyKey !== id) delete state[legacyKey];
    }
    if (terminal.has(id)) {
      state[id] = { checkedAt: now.toISOString(), status: "unknown" };
      continue;
    }
    const posting = currentById.get(id);
    if (posting && current.matches({ ...seed, applyUrl: seed.url }) && posting.company === seed.company) {
      state[id] = { checkedAt: now.toISOString(), status: "live", candidate: recoveryCandidate(posting) };
      reusedCurrentPostings++;
    }
  }
  const published = new Set((options.previousJobs ?? []).map(job => opportunityIdentity(job.applyUrl)));
  const seen = new Set((options.seenUrls ?? []).map(opportunityIdentity));
  const allDue = unique.filter(([, seed]) => !stoppedHosts.has(new URL(recoveryEndpoint(seed)!.url).hostname)).filter(([id]) => !state[id] || !Number.isFinite(Date.parse(state[id].checkedAt)) || now.getTime() - Date.parse(state[id].checkedAt) >= (state[id].status === "live" ? 12 : 24) * 60 * 60_000)
    .sort(([a], [b]) => Number(published.has(b) && !seen.has(b)) - Number(published.has(a) && !seen.has(a))
      || (Date.parse(state[a]?.checkedAt ?? "1970-01-01") - Date.parse(state[b]?.checkedAt ?? "1970-01-01")) || a.localeCompare(b));
  const maintenance = allDue.filter(([id]) => published.has(id));
  const discovery = allDue.filter(([id]) => !published.has(id));
  // Reserve a discovery share, then reuse spare capacity. Old unknown seeds
  // cannot starve expiring published listings within the same request budget.
  const due = [...maintenance.slice(0, Math.ceil(limit * 0.8)), ...discovery.slice(0, Math.floor(limit * 0.2))];
  const chosen = new Set(due.map(([id]) => id));
  for (const row of [...maintenance, ...discovery]) if (due.length < limit && !chosen.has(row[0])) { due.push(row); chosen.add(row[0]); }
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
    if (entry?.status === "live" && entry.candidate && age >= 0 && age < 24 * 60 * 60_000 && opportunityIdentity(entry.candidate.applyUrl) === id && entry.candidate.company === seed.company && employerBoardIdentity(entry.candidate.applyUrl) === employerBoardIdentity(seed.url)) {
      liveThisRun.set(entry.candidate, entry.checkedAt); candidates.push(entry.candidate);
    }
  }
  return {state, candidates, requests, reusedCurrentPostings, targets: unique.length, attempted: requests, unknown: unique.filter(([id]) => state[id]?.status === "unknown").length, pausedHosts: stoppedHosts.size, remaining: unique.filter(([id]) => !state[id]).length, durationMs: Date.now() - started};
}
