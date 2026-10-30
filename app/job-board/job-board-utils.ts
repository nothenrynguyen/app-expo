import { normalizeJobLocation } from "@/lib/job-locations";
import type { PublicJob } from "@/lib/jobs";

export const PAGE_SIZE = 100;
export const LAYOUT_TRANSITION_MS = 1050;

export type ViewMode = "compact" | "cards";

export const modeLabels: Record<PublicJob["workMode"], string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  in_person: "In person",
  unknown: "",
};

export function displayText(value: string): string {
  return value.replace(/[\u2013\u2014]/g, "-");
}

function splitLocations(location: string): string[] {
  const semicolonLocations = location
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);

  if (semicolonLocations.length > 1) return semicolonLocations;

  const cityStateLocations = location
    .match(/(?:[^,;]+,\s*)?[A-Za-z .'-]+,\s*[A-Z]{2}(?:,\s*Canada)?/g)
    ?.map((item) => item.trim()) ?? [];

  return cityStateLocations.length > 1 ? cityStateLocations : semicolonLocations;
}

export function getLocationDisplay(location: string, workMode?: PublicJob["workMode"]) {
  const normalized = displayText(normalizeJobLocation(location));
  // Remote country restrictions and country-only locations are meaningful.
  const countryOnly = /^(?:United States(?: of America)?|USA|US)$/i;
  const parts = normalized.split(/\s*[;|]\s*/).filter(Boolean);
  const hasSpecificLocation = parts.some((part) => !countryOnly.test(part));
  const full = workMode === "remote" || /\bremote\b/i.test(normalized) || !hasSpecificLocation
    ? normalized
    : parts.filter((part) => !countryOnly.test(part))
      .map((part) => normalizeJobLocation(part.replace(/,\s*(?:United States(?: of America)?|USA|US)(?=\s*(?:,|\(|$))/gi, "")))
      .join("; ");
  const locations = splitLocations(full);
  const hasMore = locations.length > 1;

  return {
    full,
    hasMore,
    compact: hasMore ? `${locations[0]} + ${locations.length - 1} more` : full,
  };
}

export function getPaginationState(totalItems: number, requestedPage: number, pageSize = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.max(0, Math.min(requestedPage, pageCount - 1));

  return {
    pageCount,
    safePage,
    startIndex: safePage * pageSize,
    endIndex: (safePage + 1) * pageSize,
  };
}

export function getLinkedInUrl(job: PublicJob): string {
  return job.linkedInUrl
    ?? `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(job.company)}`;
}
