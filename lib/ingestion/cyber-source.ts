import { discoverAtsBoard, isEarlyCareerTitle } from "../ats-boards";
import { canonicalizeUrl, inferTerm, inferWorkMode, normalizeDisplayText, type CandidateJob } from "../source-normalization";

// This pilot admits only direct, supported public ATS listings. Source labels
// and date_added are discovery hints, never employer eligibility/date evidence.
export function parseCyberSource(text: string, source: string, now = new Date()): CandidateJob[] {
  const payload: unknown = JSON.parse(text);
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as {rows?: unknown}).rows)) {
    throw new Error("Invalid cyber feed: expected a rows array");
  }
  const candidates: CandidateJob[] = [];
  for (const row of (payload as {rows: unknown[]}).rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (r.closed || r.closed_date || !["intern", "newgrad", "earlycareer"].includes(String(r.type))) continue;
    if (![r.company, r.role, r.location, r.url, r.date_added].every(v => typeof v === "string" && v.trim())) continue;
    const title = normalizeDisplayText(r.role as string);
    const company = normalizeDisplayText(r.company as string);
    const location = normalizeDisplayText(r.location as string);
    if (!isEarlyCareerTitle(title)) continue;
    let rawUrl: URL;
    try { rawUrl = new URL(r.url as string); } catch { continue; }
    if (rawUrl.protocol !== "https:" || rawUrl.username || rawUrl.password) continue;
    const applyUrl = canonicalizeUrl(rawUrl.href);
    if (!applyUrl) continue;
    const board = discoverAtsBoard(applyUrl, company, source);
    if (!board) continue;
    const listingPath = board.provider === "greenhouse" ? /^\/[^/]+\/jobs\/\d+\/?$/
      : /^\/[^/]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\/(?:application|apply))?\/?$/i;
    if (!listingPath.test(rawUrl.pathname)) continue;
    const date = r.date_added as string;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const postedAt = `${date}T00:00:00.000Z`;
    const time = Date.parse(postedAt);
    if (!Number.isFinite(time) || new Date(time).toISOString() !== postedAt || time > now.getTime()) continue;
    candidates.push({ company, title, location, applyUrl, source,
      postedAt, postedAtSource: "first_seen", term: inferTerm(title),
      category: /\bintern(?:ship)?\b|\bco-?op\b/i.test(title) ? "Internship" : "New grad",
      workMode: r.remote === true ? "remote" : inferWorkMode(`${title} ${location}`),
      salary: null, rawText: `${title} ${location}`,
    });
  }
  return candidates;
}
