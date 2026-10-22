import { browserPrivacySignalEnabled, getAnalyticsConsent, CONSENT_LIFETIME_MS } from "./analytics";
import { ACTIVITY_PAGES, UUID_PATTERN, resultBucket, validActivityEndpoint, validateActivityEvent, type ActivityEvent, type ActivityEventName, type FilterCategory } from "./activity-contract";

export const ACTIVITY_ID_KEY = "empluzzed.activity-browser.v1";
const OWNER_EXCLUSION_KEY = "empluzzed.activity-excluded.v1";
export const activityEndpoint = process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT ?? "";
export const activityConfigured = validActivityEndpoint(activityEndpoint);
const enabled = process.env.NODE_ENV === "production" && activityConfigured;
const controllers = new Set<AbortController>();
let memoryId: { id: string; expiresAt: number } | null = null;
let count = 0;
let countDay = "";
let ownerExcludedInMemory = false;

export function setOwnerExclusion(exclude: boolean) {
  ownerExcludedInMemory = exclude;
  try { if (exclude) window.localStorage.setItem(OWNER_EXCLUSION_KEY, "true"); else window.localStorage.removeItem(OWNER_EXCLUSION_KEY); } catch { /* No persistent exclusion when storage is unavailable. */ }
  if (exclude) stopActivityCollection();
}
export function stopActivityCollection() {
  controllers.forEach((controller) => controller.abort());
  controllers.clear();
  memoryId = null;
  try { window.localStorage.removeItem(ACTIVITY_ID_KEY); } catch { /* Storage is optional. */ }
}
export function parseActivityIdentity(raw: string | null, now = Date.now()) {
  try {
    const v = JSON.parse(raw ?? "null");
    if (v && typeof v.id === "string" && UUID_PATTERN.test(v.id) && typeof v.expiresAt === "number" &&
      v.expiresAt > now && v.expiresAt <= now + CONSENT_LIFETIME_MS) return { id: v.id as string, expiresAt: v.expiresAt as number };
  } catch { /* Invalid IDs are replaced only after consent. */ }
  return null;
}
function browserId() {
  try { const stored = parseActivityIdentity(window.localStorage.getItem(ACTIVITY_ID_KEY)); if (stored) return stored.id; } catch { /* Fall back to page memory. */ }
  memoryId = parseActivityIdentity(JSON.stringify(memoryId)) ?? { id: crypto.randomUUID(), expiresAt: Date.now() + CONSENT_LIFETIME_MS };
  try { window.localStorage.setItem(ACTIVITY_ID_KEY, JSON.stringify(memoryId)); } catch { /* Page-only identity. */ }
  return memoryId.id;
}
export function referralSource(referrer: string, origin: string): ActivityEvent["source"] {
  if (!referrer) return "direct_unknown";
  try {
    const u = new URL(referrer);
    if (!["http:", "https:"].includes(u.protocol)) return "direct_unknown";
    if (u.origin === origin) return "internal";
    if (/(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/.test(u.hostname)) return "search";
    if (/(^|\.)(linkedin\.com|reddit\.com|instagram\.com|facebook\.com|twitter\.com|x\.com|t\.co|discord\.com|discord\.gg|tiktok\.com)$/.test(u.hostname)) return "social";
    return "other";
  } catch { return "direct_unknown"; }
}
function deviceType(): ActivityEvent["device"] {
  const ua = navigator.userAgent;
  if (/ipad|tablet/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  return /mobile|iphone|ipod/i.test(ua) ? "mobile" : "desktop";
}

// No job object, record, query, URL, or arbitrary properties can enter this API.
export function trackActivity(name: ActivityEventName, filter?: FilterCategory, resultCount?: number): void {
  try {
    if (!enabled || ownerExcludedInMemory || getAnalyticsConsent() !== "allowed" || browserPrivacySignalEnabled()) return;
    try { if (window.localStorage.getItem(OWNER_EXCLUSION_KEY) === "true") return; } catch { /* Continue without exclusion storage. */ }
    const page = window.location.pathname.replace(/\/$/, "") || "/";
    if (!([...ACTIVITY_PAGES, "/applications"] as readonly string[]).includes(page)) return;
    const day = new Date().toISOString().slice(0, 10);
    if (day !== countDay) { countDay = day; count = 0; }
    if (count >= 120) return;
    const event = validateActivityEvent({
      version: 1, eventId: crypto.randomUUID(), visitorId: browserId(), name, page,
      board: page === "/internships" ? "internships" : page === "/jobs" ? "fulltime" : "none",
      filter: filter ?? "none", results: resultCount === undefined ? "none" : resultBucket(resultCount),
      source: name === "page_view" ? referralSource(document.referrer, window.location.origin) : "direct_unknown",
      device: name === "page_view" ? deviceType() : "unknown",
    });
    if (!event) return;
    count++;
    const controller = new AbortController();
    controllers.add(controller);
    // credentials/referrer omitted. No retries or durable queues of visitor actions.
    void fetch(activityEndpoint, { method: "POST", mode: "cors", credentials: "omit", referrerPolicy: "no-referrer",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(event), keepalive: true,
      signal: controller.signal,
    }).catch(() => {}).finally(() => controllers.delete(controller));
  } catch { /* Analytics must never interrupt a product action. */ }
}
