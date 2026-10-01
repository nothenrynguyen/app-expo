import type { BeforeSendEvent } from "@vercel/analytics/react";

export const ANALYTICS_CONSENT_KEY = "app-expo.analytics-consent.v1";
export const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
export type AnalyticsConsent = "unset" | "allowed" | "denied";
const PUBLIC_PATHS = new Set(["/", "/internships", "/jobs", "/methodology", "/sources", "/privacy"]);

export function parseAnalyticsConsent(raw: string | null, now = Date.now()): AnalyticsConsent {
  try {
    const value = JSON.parse(raw ?? "null");
    if (value && (value.choice === "allowed" || value.choice === "denied") &&
      typeof value.expiresAt === "number" && value.expiresAt > now &&
      value.expiresAt <= now + CONSENT_LIFETIME_MS) return value.choice;
  } catch { /* Invalid preferences never grant consent. */ }
  return "unset";
}

export function privacySignalEnabled(signal: { doNotTrack?: string | null; globalPrivacyControl?: boolean }): boolean {
  return signal.doNotTrack === "1" || signal.globalPrivacyControl === true;
}

export function sanitizeAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  if (event.type !== "pageview") return null;
  try {
    const url = new URL(event.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    if (!PUBLIC_PATHS.has(path) || !["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    url.pathname = path;
    url.search = "";
    url.hash = "";
    return { type: "pageview", url: url.href };
  } catch { return null; }
}

// The provider hook cannot rewrite referrers. Only root origins are safe to send.
export function isSafeAnalyticsReferrer(referrer: string): boolean {
  if (!referrer) return true;
  try {
    const url = new URL(referrer);
    return ["http:", "https:"].includes(url.protocol) && url.pathname === "/" &&
      !url.search && !url.hash && !url.username && !url.password;
  } catch { return false; }
}

let memoryPreference: string | null = null;
let memoryOnly = false;
const listeners = new Set<() => void>();
export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return "unset";
  if (memoryOnly) return parseAnalyticsConsent(memoryPreference);
  try { return parseAnalyticsConsent(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)); }
  catch { return parseAnalyticsConsent(memoryPreference); }
}
export function setAnalyticsConsent(choice: "allowed" | "denied") {
  memoryPreference = JSON.stringify({ choice, expiresAt: Date.now() + CONSENT_LIFETIME_MS });
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, memoryPreference);
    memoryOnly = false;
  } catch { memoryOnly = true; }
  listeners.forEach((listener) => listener());
}
export function subscribeAnalyticsConsent(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === ANALYTICS_CONSENT_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}

export function browserPrivacySignalEnabled() {
  return privacySignalEnabled(navigator as Navigator & { globalPrivacyControl?: boolean });
}

// Kept outside React so withdrawal also blocks the already-loaded provider script.
let firstPageview = true;
export function beforeAnalyticsSend(event: BeforeSendEvent): BeforeSendEvent | null {
  if (getAnalyticsConsent() !== "allowed" || browserPrivacySignalEnabled()) return null;
  if (event.type === "pageview" && firstPageview) {
    firstPageview = false;
    if (!isSafeAnalyticsReferrer(document.referrer)) return null;
  }
  return sanitizeAnalyticsEvent(event);
}
