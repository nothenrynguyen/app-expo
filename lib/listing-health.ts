import { jobIdentity } from "./source-normalization";

export type ListingStatus = "live" | "closed" | "unknown";

export type ListingHealthRecord = {
  url: string;
  status: ListingStatus;
  checkedAt: string;
  httpStatus: number | null;
};

export type ListingHealthFile = Record<string, ListingHealthRecord>;

const CLOSED_TEXT = [
  /job (?:is |has been )?no longer available/i,
  /position (?:is |has been )?(?:closed|filled|no longer available)/i,
  /job posting (?:is |has )?(?:closed|expired)/i,
  /this job has expired/i,
  /no longer accepting applications/i,
  /applications (?:are )?closed/i,
];

export function classifyListingResponse(status: number, body: string): ListingStatus {
  if (status === 404 || status === 410) return "closed";
  if (status < 200 || status >= 400) return "unknown";
  const sample = body.slice(0, 250_000);
  return CLOSED_TEXT.some((pattern) => pattern.test(sample)) ? "closed" : "live";
}

export async function verifyListing(url: string, now = new Date()): Promise<[string, ListingHealthRecord] | null> {
  const identity = jobIdentity(url);
  if (!identity) return null;
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { accept: "text/html,application/xhtml+xml", "user-agent": "App-Expo-Link-Check/0.2" },
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
