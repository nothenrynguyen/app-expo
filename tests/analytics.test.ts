import assert from "node:assert/strict";
import test from "node:test";
import {
  ANALYTICS_CONSENT_KEY, CONSENT_LIFETIME_MS, beforeAnalyticsSend,
  getAnalyticsConsent, isSafeAnalyticsReferrer, parseAnalyticsConsent,
  privacySignalEnabled, sanitizeAnalyticsEvent, setAnalyticsConsent,
} from "../lib/analytics";

test("analytics permits only known pageviews and removes all URL parameters", () => {
  assert.deepEqual(sanitizeAnalyticsEvent({ type: "pageview", url: "https://example.com/jobs/?search=secret&token=private#notes" }),
    { type: "pageview", url: "https://example.com/jobs" });
  for (const url of ["https://example.com/private/person", "https://example.com/jobs/person", "https://person:secret@example.com/jobs", "file:///jobs", "invalid"]) {
    assert.equal(sanitizeAnalyticsEvent({ type: "pageview", url }), null);
  }
  assert.equal(sanitizeAnalyticsEvent({ type: "event", url: "https://example.com/jobs" }), null);
});

test("consent fails closed for malformed, expired, or unsupported preferences", () => {
  const now = 1000;
  assert.equal(parseAnalyticsConsent(JSON.stringify({ choice: "allowed", expiresAt: now + CONSENT_LIFETIME_MS }), now), "allowed");
  for (const raw of [null, "invalid", "true", JSON.stringify({ choice: "allowed", expiresAt: now }), JSON.stringify({ choice: "allowed", expiresAt: now + CONSENT_LIFETIME_MS + 1 }), JSON.stringify({ choice: "other", expiresAt: now + 1 })]) {
    assert.equal(parseAnalyticsConsent(raw, now), "unset");
  }
});

test("privacy signals and sensitive referrers are excluded", () => {
  assert.equal(privacySignalEnabled({ doNotTrack: "1" }), true);
  assert.equal(privacySignalEnabled({ globalPrivacyControl: true }), true);
  assert.equal(privacySignalEnabled({ doNotTrack: "0" }), false);
  assert.equal(isSafeAnalyticsReferrer(""), true);
  assert.equal(isSafeAnalyticsReferrer("https://search.example/"), true);
  for (const referrer of ["https://example.com/profile/person", "https://example.com/?email=private", "https://example.com/#secret", "https://private@example.com/", "invalid"]) {
    assert.equal(isSafeAnalyticsReferrer(referrer), false);
  }
});

test("live provider hook blocks pre-consent, sensitive entry views, withdrawal, and other tabs", () => {
  const stored = new Map<string, string>();
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
  } } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { referrer: "https://example.com/profile/private?email=secret" } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { doNotTrack: "0" } });
  const event = { type: "pageview" as const, url: "https://app.example/jobs?token=secret#notes" };
  try {
    assert.equal(beforeAnalyticsSend(event), null);
    setAnalyticsConsent("allowed");
    assert.equal(getAnalyticsConsent(), "allowed");
    assert.equal(beforeAnalyticsSend(event), null);
    assert.deepEqual(beforeAnalyticsSend(event), { type: "pageview", url: "https://app.example/jobs" });
    setAnalyticsConsent("denied");
    assert.equal(beforeAnalyticsSend(event), null);
    setAnalyticsConsent("allowed");
    stored.delete(ANALYTICS_CONSENT_KEY);
    assert.equal(beforeAnalyticsSend(event), null);
    setAnalyticsConsent("allowed");
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { globalPrivacyControl: true } });
    assert.equal(beforeAnalyticsSend(event), null);
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { doNotTrack: "0" } });
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: {
      getItem: () => null,
      setItem: () => { throw new Error("Storage is read-only"); },
    } } });
    setAnalyticsConsent("allowed");
    assert.equal(getAnalyticsConsent(), "allowed");
    assert.notEqual(beforeAnalyticsSend(event), null);
    setAnalyticsConsent("denied");
    assert.equal(beforeAnalyticsSend(event), null);
  } finally {
    for (const [key, descriptor] of [["window", originalWindow], ["document", originalDocument], ["navigator", originalNavigator]] as const) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
