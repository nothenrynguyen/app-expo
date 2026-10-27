import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT = "https://collector.example/collect";
Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, writable: true, enumerable: true });
const client = await import("../lib/activity-client");
const consent = await import("../lib/analytics");
const { validActivityEndpoint } = await import("../lib/activity-contract");

test("activity requires fresh consent, excludes private values, and stops after withdrawal", async () => {
  const values = new Map<string, string>();
  const sent: { url: string; init: RequestInit }[] = [];
  const originals = Object.fromEntries(["window", "document", "navigator", "fetch"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const location = { pathname: "/jobs", origin: "https://empluzzed.fyi", search: "?search=private", hash: "#private" };
  const navigator = { doNotTrack: "0", globalPrivacyControl: false, userAgent: "desktop test" };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location, localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { referrer: "https://www.google.com/search?q=secret" } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: navigator });
  Object.defineProperty(globalThis, "fetch", { configurable: true, value: async (url: string, init: RequestInit) => { sent.push({ url, init }); return new Response(null, { status: 204 }); } });
  try {
    values.set("app-expo.analytics-consent.v1", JSON.stringify({ choice: "denied", expiresAt: Date.now() + 10000 }));
    assert.equal(consent.getAnalyticsConsent(), "denied");
    // v1 permission must not silently authorize persistent browser IDs.
    values.set("app-expo.analytics-consent.v1", JSON.stringify({ choice: "allowed", expiresAt: Date.now() + 10000 }));
    client.trackActivity("page_view"); assert.equal(sent.length, 0); assert.equal(values.has(client.ACTIVITY_ID_KEY), false);
    consent.setAnalyticsConsent("allowed");
    client.trackActivity("page_view");
    client.trackActivity("filter_use", "search", 0);
    client.trackActivity("apply_click");
    assert.equal(sent.length, 3);
    const e = JSON.parse(sent[0].init.body as string);
    assert.equal(e.source, "search"); assert.equal(e.page, "/jobs");
    assert.equal(JSON.parse(sent[1].init.body as string).results, "zero");
    assert.equal(JSON.parse(sent[2].init.body as string).visitorId, e.visitorId);
    assert.ok(!JSON.stringify(sent).includes("private"));
    assert.equal(sent[0].init.credentials, "omit"); assert.equal(sent[0].init.referrerPolicy, "no-referrer");
    navigator.globalPrivacyControl = true; client.trackActivity("apply_click"); assert.equal(sent.length, 3);
    navigator.globalPrivacyControl = false;
    client.setOwnerExclusion(true); client.trackActivity("apply_click"); assert.equal(sent.length, 3);
    client.setOwnerExclusion(false);
    const storageDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("Storage blocked"); } });
    client.setOwnerExclusion(true); client.trackActivity("apply_click"); assert.equal(sent.length, 3);
    client.setOwnerExclusion(false);
    Object.defineProperty(window, "localStorage", storageDescriptor);
    location.pathname = "/analytics"; client.trackActivity("page_view"); assert.equal(sent.length, 3);
    location.pathname = "/applications"; client.trackActivity("page_view"); assert.equal(sent.length, 3);
    client.trackActivity("application_add"); assert.equal(sent.length, 4);
    client.stopActivityCollection(); consent.setAnalyticsConsent("denied");
    assert.equal(values.has(client.ACTIVITY_ID_KEY), false);
    client.trackActivity("application_add"); assert.equal(sent.length, 4);
    consent.setAnalyticsConsent("allowed"); location.pathname = "/jobs";
    Object.defineProperty(globalThis, "fetch", { configurable: true, value: () => Promise.reject(new Error("offline")) });
    assert.doesNotThrow(() => client.trackActivity("apply_click"));
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    client.stopActivityCollection();
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
  }
});

test("identity and endpoint parsing reject malformed or excessive lifetimes", () => {
  const now = Date.now();
  const id = crypto.randomUUID();
  assert.ok(client.parseActivityIdentity(JSON.stringify({ id, expiresAt: now + 1000 }), now));
  for (const value of [null, "bad", JSON.stringify({ id: "email@example.com", expiresAt: now + 100 }), JSON.stringify({ id, expiresAt: now }), JSON.stringify({ id, expiresAt: now + consent.CONSENT_LIFETIME_MS + 1 })]) assert.equal(client.parseActivityIdentity(value, now), null);
  assert.equal(validActivityEndpoint("https://collector.example/collect"), true);
  for (const url of ["http://collector.example/collect", "https://token@collector.example/collect", "https://collector.example/collect?token=secret", "https://collector.example/other", "not a URL"]) assert.equal(validActivityEndpoint(url), false);
  assert.equal(client.referralSource("https://www.linkedin.com/in/private", "https://empluzzed.fyi"), "social");
});
