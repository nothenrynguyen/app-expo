import { load } from "cheerio";
import type { CandidateJob } from "./source-normalization";

type SchemaCountry = string | { name?: unknown };
type SchemaAddress = { addressCountry?: SchemaCountry; addressLocality?: unknown; addressRegion?: unknown };
type SchemaJobLocation = { address?: SchemaAddress };
type SchemaJobPosting = {
  "@type"?: unknown;
  datePosted?: unknown;
  jobLocation?: SchemaJobLocation | SchemaJobLocation[];
};

export type MicrosoftCareersPosting = { postedAt: string | null; location: string | null };

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function countryName(value: SchemaCountry | undefined): string {
  const country = asText(typeof value === "string" ? value : value?.name);
  if (!/^[A-Za-z]{2}$/.test(country)) return country;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(country.toUpperCase()) ?? country;
  } catch {
    return country;
  }
}

function parseDate(value: unknown): string | null {
  const raw = asText(value);
  if (!raw) return null;
  const withTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw) ? raw : `${raw}Z`;
  const date = new Date(withTimezone);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function formatLocation(value: SchemaJobPosting["jobLocation"]): string | null {
  const locations = (Array.isArray(value) ? value : value ? [value] : []).flatMap((entry) => {
    const address = entry?.address;
    if (!address) return [];
    const country = countryName(address.addressCountry);
    const locality = asText(address.addressLocality);
    const region = asText(address.addressRegion);
    const domesticCountry = /^(?:US|United States(?: of America)?)$/i.test(country);
    const parts = [locality, region, domesticCountry && (locality || region) ? "" : country].filter(Boolean);
    return parts.length > 0 ? [parts.join(", ")] : [];
  });
  const unique = [...new Set(locations)];
  return unique.length > 0 ? unique.join("; ") : null;
}

export function parseMicrosoftCareersJobUrl(value: string): { jobId: string; endpoint: string } | null {
  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase() !== "apply.careers.microsoft.com") return null;
    const jobId = url.pathname.match(/\/careers\/job\/(\d+)/i)?.[1] ?? url.searchParams.get("pid")?.match(/^\d+$/)?.[0];
    return jobId ? { jobId, endpoint: `https://apply.careers.microsoft.com/careers/job/${jobId}` } : null;
  } catch {
    return null;
  }
}

export function parseMicrosoftCareersPosting(html: string): MicrosoftCareersPosting | null {
  const $ = load(html);
  for (const script of $("script[type='application/ld+json']").toArray()) {
    try {
      const value = JSON.parse($(script).text()) as SchemaJobPosting | SchemaJobPosting[];
      const postings = Array.isArray(value) ? value : [value];
      const posting = postings.find((entry) => entry?.["@type"] === "JobPosting");
      if (posting) return { postedAt: parseDate(posting.datePosted), location: formatLocation(posting.jobLocation) };
    } catch {
      // Ignore unrelated or malformed structured-data blocks.
    }
  }
  return null;
}

export async function fetchMicrosoftCareersPosting(value: string): Promise<MicrosoftCareersPosting | null> {
  const job = parseMicrosoftCareersJobUrl(value);
  if (!job) return null;
  const response = await fetch(job.endpoint, {
    headers: { accept: "text/html,application/xhtml+xml", "user-agent": "App-Expo/0.4" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return null;
  return parseMicrosoftCareersPosting(await response.text());
}

export function applyMicrosoftCareersPosting(candidate: CandidateJob, posting: MicrosoftCareersPosting): CandidateJob {
  return {
    ...candidate,
    postedAt: posting.postedAt ?? candidate.postedAt,
    postedAtSource: posting.postedAt ? "exact" : candidate.postedAtSource,
    location: posting.location ?? candidate.location,
  };
}
