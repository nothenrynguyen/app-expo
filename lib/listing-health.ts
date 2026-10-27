import { jobIdentity } from "./source-normalization";
import { load } from "cheerio";

export type ListingStatus = "live" | "closed" | "unavailable" | "unknown";

export type ListingHealthRecord = {
  url: string;
  status: ListingStatus;
  checkedAt: string;
  httpStatus: number | null;
};

export type ListingHealthFile = Record<string, ListingHealthRecord>;

export function isListingUnavailable(record: ListingHealthRecord | undefined): boolean {
  return record?.status === "closed" || record?.status === "unavailable";
}

const CLOSED_TEXT = [
  /job (?:is |has been )?no longer available/i,
  /position (?:is |has been )?(?:closed|filled|no longer available)/i,
  /job posting (?:is |has )?(?:closed|expired)/i,
  /this job has expired/i,
  /no longer accepting applications/i,
  /applications (?:are )?closed/i,
  /(?:this |the )?role (?:does not exist or is |is )no longer available/i,
];

export function classifyListingResponse(status: number, body: string): ListingStatus {
  if (status === 404 || status === 410) return "closed";
  if (status < 200 || status >= 300) return "unknown";
  const $ = load(body);
  // Some retired ATS links serve an employer privacy page with HTTP 200.
  // Hold that destination without claiming the underlying vacancy is filled.
  const canonical = $("link[rel='canonical']").attr("href") ?? "";
  const title = $("title").text().trim();
  const structuredJob = $("script[type='application/ld+json']").toArray().some(node => /"@type"\s*:\s*"JobPosting"/.test($(node).text()));
  if (!structuredJob && /^privacy (?:notice|policy)\b/i.test(title) && /^https?:\/\/[^/]+\/privacy(?:-notice|-policy)?\/?(?:[?#].*)?$/i.test(canonical)) return "unavailable";
  // Translation bundles, navigation and hidden templates can mention closure on
  // an open listing. Inspect the visible main content rather than raw HTML.
  $("script, style, template, noscript, nav, header, footer, aside, [hidden], [aria-hidden='true']").remove();
  $("br").replaceWith(" ");
  $("h1, h2, h3, h4, p, div, section, article, button, li").prepend(" ").append(" ");
  const main = $("main, [role='main']").first();
  const sample = (main.length ? main.text() : $("body").text()).replace(/\s+/g, " ").trim();
  if (!sample || /verify (?:that )?you are human|access denied|enable javascript|checking your browser/i.test(sample)) return "unknown";
  if (CLOSED_TEXT.some((pattern) => pattern.test(sample))) return "closed";
  // A successful response may be only an ATS application shell or a generic
  // careers page. Require job-specific evidence before calling it live.
  return /\bapply (?:now|for this (?:open )?(?:job|position|role))\b|\b(?:submit (?:your )?application|job description|minimum qualifications|basic qualifications)\b/i.test(sample)
    ? "live"
    : "unknown";
}

export async function verifyListing(url: string, now = new Date()): Promise<[string, ListingHealthRecord] | null> {
  const identity = jobIdentity(url);
  if (!identity) return null;
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { accept: "text/html,application/xhtml+xml", "user-agent": "empluzzed-Link-Check/0.2" },
      signal: AbortSignal.timeout(10_000),
    });
    const body = response.ok ? await response.text() : "";
    return [identity, { url, status: classifyListingResponse(response.status, body), checkedAt: now.toISOString(), httpStatus: response.status }];
  } catch {
    return [identity, { url, status: "unknown", checkedAt: now.toISOString(), httpStatus: null }];
  }
}

export function needsListingCheck(record: ListingHealthRecord | undefined, now = new Date()): boolean {
  if (!record) return true;
  const checked = new Date(record.checkedAt).getTime();
  return !Number.isFinite(checked) || now.getTime() - checked >= 24 * 60 * 60 * 1000;
}


// These employer-detail APIs provide job-specific evidence. Every non-positive
// response, including access denial and malformed content, remains unknown.
export async function verifyScopedListing(url: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  try {
    const target = new URL(url);
    if (target.protocol !== "https:" || target.username || target.password) return false;
    const parts = target.pathname.split("/").filter(Boolean);
    let endpoint: string;
    let provider: "greenhouse" | "workday";
    if (target.hostname === "job-boards.greenhouse.io" && parts.length === 3 && parts[1] === "jobs" && /^\d+$/.test(parts[2])) {
      provider = "greenhouse";
      endpoint = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(parts[0])}/jobs/${parts[2]}`;
    } else if (/^[a-z0-9-]+\.wd\d+\.myworkdayjobs\.com$/i.test(target.hostname) && parts.length >= 4 && parts[1].toLowerCase() === "job") {
      provider = "workday";
      endpoint = `${target.origin}/wday/cxs/${encodeURIComponent(target.hostname.split(".")[0])}/${parts.map(encodeURIComponent).join("/")}`;
    } else return false;
    const response = await fetchImpl(endpoint, { headers: { accept: "application/json", "user-agent": "empluzzed-Link-Check/0.2" }, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return false;
    const data = await response.json();
    if (provider === "workday") return data?.jobPostingInfo?.posted === true && data.jobPostingInfo.canApply === true && typeof data.jobPostingInfo.title === "string" && !!data.jobPostingInfo.title.trim();
    return String(data?.id ?? "") === parts[2] && typeof data?.title === "string" && !!data.title.trim();
  } catch { return false; }
}
