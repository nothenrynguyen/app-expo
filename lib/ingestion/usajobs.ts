import config from "../../data/usajobs-config.json";
import { officialUsaJobsUrl, reviewUsaJobsPosting, type UsaJobsSeed } from "../usajobs";
import type { CandidateJob } from "../source-normalization";

// Only objects verified in this process through authenticated discovery + official pages.
const verifiedThisRun = new WeakSet<CandidateJob>();
export function reviewedFederalCoverage(candidate: CandidateJob): boolean {
  return verifiedThisRun.has(candidate) && candidate.source === "USAJOBS selective review" && Boolean(candidate.federal) && Boolean(officialUsaJobsUrl(candidate.applyUrl));
}

type Options = { fetcher?: typeof fetch; apiKey?: string; email?: string; costReviewed?: boolean };
export async function loadReviewedUsaJobs(
  enabled = process.env.USAJOBS_ENABLE_DISCOVERY === "false" ? false : config.enabled || process.env.USAJOBS_ENABLE_DISCOVERY === "true",
  options: Options = {},
) {
  if (!enabled) return null;
  const fetcher = options.fetcher ?? fetch;
  const key = options.apiKey ?? process.env.USAJOBS_API_KEY;
  const email = options.email ?? process.env.USAJOBS_EMAIL;
  const costReviewed = options.costReviewed ?? process.env.USAJOBS_PILOT_COST_REVIEWED === "true";
  const candidates: CandidateJob[] = [];
  const holds: Array<{ url: string; reason: string }> = [];
  const searches: Array<{ query: string; page: number; rows: number; matched: number }> = [];
  const seeds = new Map<string, UsaJobsSeed>();
  const startedAt = Date.now();
  const requestSignal = () => {
    const remaining = 120_000 - (Date.now() - startedAt);
    if (remaining <= 0) throw new Error("Discovery time budget exhausted");
    return AbortSignal.timeout(Math.min(15_000, remaining));
  };
  let requests = 0;
  let searchRequests = 0;
  let detailRequests = 0;
  let failed = false;
  let truncated = false;
  if (!key || !email || !costReviewed) return { candidates, holds: [{ url: "", reason: "credentials-or-cost-review-missing" }], failed: true, requests, searchRequests, detailRequests, searches, discovered: 0, truncated, durationMs: Date.now() - startedAt };
  try {
    for (const query of config.queries) {
      for (let page = 1; page <= config.maxPagesPerQuery; page++) {
        if (searchRequests >= config.maxSearchRequests) { truncated = true; break; }
        const url = new URL("https://data.usajobs.gov/api/search");
        url.search = new URLSearchParams({ JobCategoryCode: query.series, HiringPath: query.hiringPath, ResultsPerPage: String(config.pageSize), Page: String(page), Fields: "Full", SortField: "opendate", SortDirection: "Desc" }).toString();
        requests++; searchRequests++;
        const response = await fetcher(url, { redirect: "error", signal: requestSignal(), headers: { "User-Agent": email, "Authorization-Key": key, Accept: "application/json" } });
        if (!response.ok) throw new Error(`search-http-${response.status}`);
        const body = await response.json();
        const items = body?.SearchResult?.SearchResultItems;
        const matched = Number(body?.SearchResult?.SearchResultCountAll);
        if (!Array.isArray(items) || items.length > config.pageSize || !Number.isFinite(matched) || matched < 0) throw new Error("search-schema-failed");
        searches.push({ query: query.name, page, rows: items.length, matched });
        for (const item of items) {
          const job = item?.MatchedObjectDescriptor;
          const official = typeof job?.PositionURI === "string" ? officialUsaJobsUrl(job.PositionURI) : null;
          if (!official || typeof job.PositionTitle !== "string" || typeof job.OrganizationName !== "string" || !job.OrganizationName.trim()) continue;
          seeds.set(official, { url: official, title: job.PositionTitle, agency: job.OrganizationName });
        }
        if (page * config.pageSize >= matched || items.length === 0) break;
        if (page === config.maxPagesPerQuery) truncated = true;
      }
    }
  } catch (error) {
    failed = true;
    // Only emit our own fixed error labels, never raw errors/response bodies/headers.
    const reason = error instanceof Error && /^(search-http-\d{3}|search-schema-failed)$/.test(error.message) ? error.message : "search-request-failed";
    holds.push({ url: "", reason });
  }
  // An incomplete discovery run must not silently publish a partial federal refresh.
  if (!failed) {
    const ordered = [...seeds.values()].sort((a, b) => Number(/intern|trainee|recent graduate/i.test(b.title)) - Number(/intern|trainee|recent graduate/i.test(a.title)));
    if (ordered.length > config.maxDetails) truncated = true;
    for (const seed of ordered.slice(0, config.maxDetails)) {
      try {
        requests++; detailRequests++;
        const response = await fetcher(seed.url, { redirect: "error", signal: requestSignal(), headers: { "User-Agent": "empluzzed-source-review" } });
        if (!response.ok) {
          holds.push({ url: seed.url, reason: `detail-http-${response.status}` });
          if ([401, 403, 429].includes(response.status)) { failed = true; break; }
          if (response.status >= 500) failed = true;
          continue;
        }
        const html = await response.text();
        if (html.length > 3_000_000) throw new Error("Oversized posting");
        const review = reviewUsaJobsPosting(seed, html);
        if (review.status === "candidate") { verifiedThisRun.add(review.candidate); candidates.push(review.candidate); }
        else holds.push({ url: seed.url, reason: review.reason });
      } catch { failed = true; holds.push({ url: seed.url, reason: "detail-request-or-schema-failed" }); break; }
    }
  }
  if (failed) candidates.length = 0;
  return { candidates, holds, failed, requests, searchRequests, detailRequests, searches, discovered: seeds.size, truncated, durationMs: Date.now() - startedAt };
}
