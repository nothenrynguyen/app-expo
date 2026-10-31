// Shared by the browser and collector. Never accept arbitrary event properties.
export const ACTIVITY_PAGES = ["/", "/internships", "/jobs", "/about", "/sources", "/methodology", "/privacy", "/feedback"] as const;
export const ACTIVITY_EVENTS = ["page_view", "filter_use", "apply_click", "save_click", "unsave_click", "application_add"] as const;
export const FILTER_CATEGORIES = ["search", "region", "metro", "workplace", "term", "company_tier", "role", "saved", "status"] as const;
export const REFERRAL_SOURCES = ["direct_unknown", "internal", "search", "social", "other"] as const;
export const RESULT_BUCKETS = ["none", "zero", "1_10", "11_50", "51_plus"] as const;
export type ActivityEventName = typeof ACTIVITY_EVENTS[number];
export type ActivityPage = typeof ACTIVITY_PAGES[number] | "/applications";
export type FilterCategory = typeof FILTER_CATEGORIES[number];
export type ActivityEvent = {
  version: 1;
  eventId: string;
  visitorId: string;
  name: ActivityEventName;
  page: ActivityPage;
  board: "none" | "internships" | "fulltime";
  filter: "none" | FilterCategory;
  results: typeof RESULT_BUCKETS[number];
  source: typeof REFERRAL_SOURCES[number];
  device: "desktop" | "mobile" | "tablet" | "unknown";
};
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validActivityEndpoint(value: string): boolean {
  try { const u = new URL(value); return u.protocol === "https:" && u.pathname === "/collect" && !u.search && !u.hash && !u.username && !u.password; }
  catch { return false; }
}
const KEYS = ["version", "eventId", "visitorId", "name", "page", "board", "filter", "results", "source", "device"].sort().join(",");
const includes = (values: readonly string[], value: unknown) => typeof value === "string" && values.includes(value);

export function validateActivityEvent(input: unknown): ActivityEvent | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const e = input as Record<string, unknown>;
  if (Object.keys(e).sort().join(",") !== KEYS || e.version !== 1 ||
    typeof e.eventId !== "string" || !UUID_PATTERN.test(e.eventId) ||
    typeof e.visitorId !== "string" || !UUID_PATTERN.test(e.visitorId) ||
    !includes(ACTIVITY_EVENTS, e.name) || !includes([...ACTIVITY_PAGES, "/applications"], e.page) ||
    !includes(["none", "internships", "fulltime"], e.board) ||
    !includes(["none", ...FILTER_CATEGORIES], e.filter) || !includes(RESULT_BUCKETS, e.results) ||
    !includes(REFERRAL_SOURCES, e.source) || !includes(["desktop", "mobile", "tablet", "unknown"], e.device)) return null;
  if (e.name === "page_view") {
    if (e.page === "/applications" || e.filter !== "none" || e.results !== "none") return null;
  } else if (e.source !== "direct_unknown" || e.device !== "unknown") return null;
  if (e.name === "filter_use") {
    if (e.filter === "none" || e.results === "none" || !["/internships", "/jobs"].includes(e.page as string)) return null;
  } else if (e.filter !== "none" || e.results !== "none") return null;
  if (e.name === "application_add") {
    if (e.page !== "/applications" || e.board !== "none") return null;
  } else if (e.page === "/applications") {
    if (!["apply_click", "unsave_click"].includes(e.name as string) || e.board !== "none") return null;
  } else {
    const expectedBoard = e.page === "/internships" ? "internships" : e.page === "/jobs" ? "fulltime" : "none";
    if (e.board !== expectedBoard || (e.name !== "page_view" && expectedBoard === "none")) return null;
  }
  return input as ActivityEvent;
}

export function resultBucket(count: number): ActivityEvent["results"] {
  return count === 0 ? "zero" : count <= 10 ? "1_10" : count <= 50 ? "11_50" : "51_plus";
}

// A bitset records feature reach per browser/day, without retaining event histories.
export function activityFlags(e: ActivityEvent): number {
  return (e.name === "page_view" ? 0 : 1) |
    (e.page === "/internships" || e.page === "/jobs" ? 2 : 0) |
    (e.name === "apply_click" ? 4 : 0) | (e.name === "save_click" ? 8 : 0) |
    (e.name === "filter_use" ? 16 : 0) | (e.name === "application_add" ? 32 : 0);
}

export type ActivityTotals = { visitors: number; active: number; returning: number; browsed: number; applied: number; saved: number; filtered: number; tracked: number };
export type ActivityReport = {
  version: 1;
  generatedAt: string;
  trackingSince: string | null;
  lastReceivedAt: string | null;
  range: "7d" | "30d" | "month" | "all";
  start: string;
  end: string;
  totals: ActivityTotals;
  daily: { day: string; visitors: number; active: number; returning: number; events: number; clicks?: number; limited: boolean }[];
  breakdown: { name: ActivityEventName; page: ActivityPage; board: ActivityEvent["board"]; dimension: string; count: number }[];
  monthly?: { month: string; visitors: number; active: number; applied: number; clicks: number; limited: boolean }[];
  limits: { dailyEvents: number; browserDailyEvents: number; detailDays: number };
};
