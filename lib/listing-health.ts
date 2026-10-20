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
