import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { handleRequest, buildReport, pruneDetails, sha256, DAILY_EVENT_LIMIT, BROWSER_EVENT_LIMIT, type Database, type Statement, type Env } from "../workers/activity/src/index";
import { validateActivityEvent, type ActivityEvent } from "../lib/activity-contract";

type NativeDatabase = { exec(sql: string): void; prepare(sql: string): { all(...args: (string | number | null)[]): Record<string, unknown>[] }; close(): void };
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as { DatabaseSync: new (path: string) => NativeDatabase };
class SqlStatement implements Statement {
  constructor(private db: NativeDatabase, private sql: string, private values: (string | number | null)[] = []) {}
  bind(...values: (string | number | null)[]) { return new SqlStatement(this.db, this.sql, values); }
  execute() {
    const results = this.db.prepare(this.sql).all(...this.values).map((row) => ({ ...row }));
    const changes = this.db.prepare("SELECT changes() AS n").all()[0].n as number;
    return { results, meta: { changes } };
  }
  async all<T = Record<string, unknown>>() { return this.execute() as { results: T[]; meta: { changes: number } }; }
  async run() { return this.execute(); }
}
export class SqliteD1 implements Database {
  native = new DatabaseSync(":memory:");
  constructor() { this.native.exec(readFileSync(new URL("../workers/activity/migrations/0001_activity.sql", import.meta.url), "utf8")); }
  prepare(sql: string) { return new SqlStatement(this.native, sql); }
  async batch(statements: Statement[]) {
    this.native.exec("BEGIN IMMEDIATE");
    try { const results = statements.map((s) => (s as SqlStatement).execute()); this.native.exec("COMMIT"); return results; }
    catch (error) { this.native.exec("ROLLBACK"); throw error; }
  }
}
const origin = "https://empluzzed.fyi";
const day = new Date("2026-10-22T12:00:00Z");
const ownerToken = "a".repeat(43); // Test-only, never used outside this in-memory fixture.
async function fixture() {
  const db = new SqliteD1();
  const env: Env = { DB: db, ALLOWED_ORIGINS: origin, COLLECTION_ENABLED: "true", VISITOR_HMAC_KEY: "test-only-hmac-secret-not-production", REPORT_TOKEN_SHA256: await sha256(ownerToken) };
  return { db, env };
}
function event(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return { version: 1, eventId: crypto.randomUUID(), visitorId: crypto.randomUUID(), name: "page_view", page: "/", board: "none", filter: "none", results: "none", source: "direct_unknown", device: "desktop", ...overrides };
}
function request(input: unknown, headers: Record<string, string> = {}) {
  return new Request("https://collector.example/collect", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", ...headers }, body: JSON.stringify(input) });
}

test("collector rejects sensitive extras and impossible event combinations", () => {
  const valid = event();
  assert.ok(validateActivityEvent(valid));
  for (const extra of [{ search: "private query" }, { jobId: "private" }, { company: "private" }, { url: "https://employer.example" }, { notes: "private" }]) assert.equal(validateActivityEvent({ ...valid, ...extra }), null);
  for (const change of [{ page: "/analytics" }, { page: "/jobs?search=secret" }, { name: "purchase" }, { page: "/applications" }, { name: "apply_click" }, { visitorId: "person@example.com" }, { board: "fulltime" }]) assert.equal(validateActivityEvent({ ...valid, ...change }), null);
  assert.ok(validateActivityEvent(event({ name: "filter_use", page: "/jobs", board: "fulltime", filter: "search", results: "zero", device: "unknown" })));
});

test("concurrent repeated deliveries count once, and stored rows exclude raw identity", async () => {
  const { db, env } = await fixture();
  const e = event();
  const responses = await Promise.all([handleRequest(request(e), env, day), handleRequest(request(e), env, day)]);
  assert.deepEqual(responses.map((r) => r.status), [204, 204]);
  const report = await buildReport(db, "30d", day);
  assert.equal(report.totals.visitors, 1);
  assert.equal(report.daily[0].events, 1);
  assert.equal(report.breakdown[0].count, 1);
  const rows = await db.prepare("SELECT * FROM visitors").all();
  assert.match(rows.results[0].visitor as string, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(rows.results).includes(e.visitorId));
  const receipt = await db.prepare("SELECT * FROM receipts").all();
  assert.deepEqual(Object.keys(receipt.results[0]).sort(), ["day", "id", "nonce"]);
  db.native.close();
});

test("monthly totals deduplicate across days and feature flags survive repeat actions", async () => {
  const { db, env } = await fixture();
  const a = crypto.randomUUID(), b = crypto.randomUUID();
  const send = async (visitorId: string, date: string, overrides: Partial<ActivityEvent> = {}) => {
    const e = event({ visitorId, ...overrides });
    assert.equal((await handleRequest(request(e), env, new Date(date))).status, 204);
  };
  await send(a, "2026-10-20T10:00Z");
  await send(a, "2026-10-20T10:01Z", { page: "/jobs", board: "fulltime" });
  await send(a, "2026-10-20T10:02Z", { name: "apply_click", page: "/jobs", board: "fulltime", device: "unknown" });
  await send(a, "2026-10-21T10:00Z", { page: "/internships", board: "internships" });
  await send(a, "2026-10-21T10:01Z", { name: "save_click", page: "/internships", board: "internships", device: "unknown" });
  await send(b, "2026-10-21T10:00Z");
  await send(b, "2026-10-21T10:01Z", { name: "application_add", page: "/applications", device: "unknown" });
  await send(a, "2026-10-22T10:00Z", { name: "filter_use", page: "/internships", board: "internships", filter: "search", results: "zero", device: "unknown" });
  const report = await buildReport(db, "month", day);
  assert.deepEqual(report.totals, { visitors: 2, active: 2, returning: 1, browsed: 1, applied: 1, saved: 1, filtered: 1, tracked: 1 });
  assert.equal(report.daily.reduce((sum, row) => sum + row.visitors, 0), 4);
  assert.deepEqual(report.daily.map((row) => row.active), [1, 2, 1]);
  assert.deepEqual((await buildReport(db, "all", day)).totals, report.totals);
  db.native.close();
});

test("UTC ranges exclude previous months and retention preserves all-time totals", async () => {
  const { db, env } = await fixture();
  const visitorId = crypto.randomUUID();
  await handleRequest(request(event({ visitorId })), env, new Date("2026-06-01T23:59Z"));
  await handleRequest(request(event({ visitorId })), env, new Date("2026-09-30T23:59Z"));
  await handleRequest(request(event({ visitorId })), env, new Date("2026-10-01T00:00Z"));
  assert.equal((await buildReport(db, "month", day)).totals.visitors, 1);
  assert.equal((await buildReport(db, "7d", day)).totals.visitors, 0);
  await pruneDetails(db, day);
  assert.equal((await db.prepare("SELECT * FROM receipts").all()).results.length, 0);
  assert.equal((await db.prepare("SELECT * FROM visitor_days").all()).results.length, 2);
  const all = await buildReport(db, "all", day);
  assert.equal(all.totals.visitors, 1);
  assert.equal(all.totals.returning, 1);
  assert.equal(all.breakdown.reduce((sum, row) => sum + row.count, 0), 3);
  assert.equal(all.daily.length, 2);
  db.native.close();
});

test("reports require server authentication and never allow arbitrary origins or token URLs", async () => {
  const { db, env } = await fixture();
  for (const headers of [{}, { Authorization: "Bearer wrong" }, { Authorization: `Bearer ${"b".repeat(43)}` }] as Record<string, string>[]) {
    const response = await handleRequest(new Request("https://collector.example/report", { headers }), env, day);
    assert.equal(response.status, 401);
    assert.ok(!(await response.text()).includes("visitors"));
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
  assert.equal((await handleRequest(new Request(`https://collector.example/report?token=${ownerToken}`), env, day)).status, 401);
  const good = { Authorization: `Bearer ${ownerToken}`, Origin: origin };
  const report = await handleRequest(new Request("https://collector.example/report?range=all", { headers: good }), env, day);
  assert.equal(report.status, 200);
  assert.equal(report.headers.get("Access-Control-Allow-Origin"), origin);
  assert.equal((await handleRequest(new Request("https://collector.example/report", { headers: { ...good, Origin: "https://evil.example" } }), env, day)).status, 403);
  assert.equal((await handleRequest(new Request("https://collector.example/report?range=invalid", { headers: good }), env, day)).status, 400);
  assert.equal((await handleRequest(new Request("https://collector.example/report", { headers: good }), { ...env, REPORT_TOKEN_SHA256: "" }, day)).status, 401);
  db.native.close();
});

test("consent-related network signals, disabled collection, malformed bodies and origins fail closed", async () => {
  const { db, env } = await fixture();
  assert.equal((await handleRequest(request(event(), { Origin: "https://evil.example" }), env, day)).status, 403);
  assert.equal((await handleRequest(request(event()), { ...env, COLLECTION_ENABLED: "false" }, day)).status, 503);
  for (const headers of [{ DNT: "1" }, { "Sec-GPC": "1" }, { "User-Agent": "ExampleBot" }] as Record<string, string>[]) assert.equal((await handleRequest(request(event(), headers), env, day)).status, 204);
  assert.equal((await buildReport(db, "all", day)).totals.visitors, 0);
  assert.equal((await handleRequest(request({ ...event(), notes: "x".repeat(2000) }), env, day)).status, 400);
  assert.equal((await handleRequest(request(event(), { "Content-Type": "text/plain" }), env, day)).status, 415);
  const preflight = await handleRequest(new Request("https://collector.example/collect", { method: "OPTIONS", headers: { Origin: origin } }), env, day);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Methods"), "POST");
  db.native.close();
});

test("quota exhaustion and database errors stop collection without exposing payloads", async () => {
  const { db, env } = await fixture();
  const e = event();
  await handleRequest(request(e), env, day);
  await db.prepare("UPDATE visitor_days SET events=?").bind(BROWSER_EVENT_LIMIT).run();
  assert.equal((await handleRequest(request(event({ visitorId: e.visitorId })), env, day)).status, 429);
  assert.equal((await buildReport(db, "all", day)).daily[0].limited, true);
  await db.prepare("UPDATE daily_stats SET events=?").bind(DAILY_EVENT_LIMIT).run();
  assert.equal((await handleRequest(request(event()), env, day)).status, 429);
  assert.equal((await buildReport(db, "all", day)).totals.visitors, 1);
  // The next UTC day resumes collection without an upgrade.
  assert.equal((await handleRequest(request(event()), env, new Date("2026-10-23T00:01Z"))).status, 204);
  const broken: Env = { ...env, DB: { prepare() { throw new Error("sensitive database internals"); }, batch() { throw new Error("private data"); } } };
  const response = await handleRequest(request(event()), broken, day);
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes("private"));
  db.native.close();
});
