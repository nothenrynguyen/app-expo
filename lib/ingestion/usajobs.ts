import config from "../../data/usajobs-local-review.json";
import { officialUsaJobsUrl, reviewUsaJobsPosting } from "../usajobs";
import type { CandidateJob } from "../source-normalization";

export function reviewedFederalCoverage(candidate: CandidateJob): boolean {
  return candidate.source === "USAJOBS selective review" && Boolean(candidate.federal)
    && config.agencies.some(agency => agency.name === candidate.company)
    && config.announcements.some(seed => seed.agency === candidate.company && seed.title === candidate.title && seed.url === officialUsaJobsUrl(candidate.applyUrl));
}

export async function loadReviewedUsaJobs(enabled = config.enabled || process.env.USAJOBS_ENABLE_LOCAL_REVIEW === "true") {
  if (!enabled) return null;
  const candidates: CandidateJob[] = [];
  const holds: Array<{ url: string; reason: string }> = [];
  let failed = false;
  let requests = 0;
  const startedAt = Date.now();
  if (config.announcements.length > 10) throw new Error("USAJOBS reviewed announcement cap exceeded");
  for (const seed of config.announcements) {
    const url = officialUsaJobsUrl(seed.url);
    if (!url || !config.agencies.some(agency => agency.name === seed.agency)) { holds.push({ url: seed.url, reason: "unreviewed-agency-or-url" }); continue; }
    try {
      requests++;
      const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15_000), headers: { "User-Agent": "empluzzed-source-review" } });
      if (!response.ok) { failed = true; holds.push({ url, reason: `http-${response.status}` }); if ([401, 403, 429].includes(response.status)) break; continue; }
      const html = await response.text();
      if (html.length > 3_000_000) throw new Error("Oversized posting");
      const review = reviewUsaJobsPosting(seed, html);
      if (review.status === "candidate") candidates.push(review.candidate);
      else holds.push({ url, reason: review.reason });
    } catch { failed = true; holds.push({ url, reason: "request-or-schema-failed" }); }
  }
  return { candidates, holds, failed, requests, durationMs: Date.now() - startedAt };
}
