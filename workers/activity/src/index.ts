import { activityFlags, validateActivityEvent, type ActivityReport, type ActivityTotals } from "../../../lib/activity-contract";

// Narrow D1 interfaces keep the collector independent of the Next.js runtime.
export interface Statement {
  bind(...values: (string | number | null)[]): Statement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; meta?: { changes?: number } }>;
  run(): Promise<unknown>;
}
export interface Database {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<{ results: Record<string, unknown>[]; meta?: { changes?: number } }[]>;
}
export interface Env {
  DB: Database;
  ALLOWED_ORIGINS: string;
  COLLECTION_ENABLED: string;
  VISITOR_HMAC_KEY: string;
  REPORT_TOKEN_SHA256: string;
}
export const DAILY_EVENT_LIMIT = 4000;
export const BROWSER_EVENT_LIMIT = 120;
export const DETAIL_DAYS = 90;
const MAX_VISITORS = 250_000;
const encoder = new TextEncoder();
const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), (n) => n.toString(16).padStart(2, "0")).join("");
export async function sha256(value: string) { return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value))); }
async function visitorHash(id: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(id)));
}
async function authorized(request: Request, env: Env) {
  if (!/^[a-f0-9]{64}$/.test(env.REPORT_TOKEN_SHA256 ?? "")) return false;
  const auth = request.headers.get("Authorization") ?? "";
  if (!/^Bearer [A-Za-z0-9_-]{43,128}$/.test(auth)) return false;
  const actual = await sha256(auth.slice(7));
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual.charCodeAt(i) ^ env.REPORT_TOKEN_SHA256.charCodeAt(i);
  return difference === 0;
}
const dayAt = (date: Date) => date.toISOString().slice(0, 10);
function daysAgo(date: Date, days: number) { return dayAt(new Date(date.getTime() - days * 86400000)); }
function originAllowed(request: Request, env: Env) {
  const origin = request.headers.get("Origin");
  return !!origin && env.ALLOWED_ORIGINS.split(",").includes(origin);
}
function response(request: Request, env: Env, status: number, body?: unknown) {
  const headers = new Headers(jsonHeaders);
  headers.set("Vary", "Origin");
  if (originAllowed(request, env)) headers.set("Access-Control-Allow-Origin", request.headers.get("Origin")!);
  return new Response(body === undefined ? null : JSON.stringify(body), { status, headers });
}
// Best-effort, bounded, per-isolate throttle, not a distributed bot detector.
const rateBuckets = new Map<string, { start: number; count: number }>();
function withinBurstLimit(key: string, now: number) {
  if (rateBuckets.size > 2000) rateBuckets.clear();
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.start >= 60_000) { rateBuckets.set(key, { start: now, count: 1 }); return true; }
  return ++bucket.count <= 60;
}

async function readSmallJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get("Content-Length") ?? 0) > 1024) throw new Error("payload");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("payload");
  let bytes = 0;
  const parts: Uint8Array[] = [];
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > 1024) { await reader.cancel(); throw new Error("payload"); }
      parts.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const combined = new Uint8Array(bytes);
  let offset = 0;
  for (const part of parts) { combined.set(part, offset); offset += part.length; }
  return JSON.parse(new TextDecoder().decode(combined));
}

async function collect(request: Request, env: Env, now: Date) {
  if (!originAllowed(request, env)) return response(request, env, 403);
  if (env.COLLECTION_ENABLED !== "true" || !env.VISITOR_HMAC_KEY || env.VISITOR_HMAC_KEY.length < 32) return response(request, env, 503);
  if (request.headers.get("DNT") === "1" || request.headers.get("Sec-GPC") === "1" || /bot|crawler|spider|headless/i.test(request.headers.get("User-Agent") ?? "")) return response(request, env, 204);
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) return response(request, env, 415);
  let input: unknown;
  try { input = await readSmallJson(request); } catch { return response(request, env, 400); }
  const event = validateActivityEvent(input);
  if (!event) return response(request, env, 400);
  const visitor = await visitorHash(event.visitorId, env.VISITOR_HMAC_KEY);
  if (!withinBurstLimit(visitor, now.getTime())) return response(request, env, 429);
  const day = dayAt(now);
  const nonce = crypto.randomUUID();
  const flags = activityFlags(event);
  const dimension = event.name === "filter_use" ? `${event.filter}:${event.results}` : event.name === "page_view" ? `${event.source}:${event.device}` : "none";
  const allowed = "EXISTS (SELECT 1 FROM receipts WHERE id=? AND nonce=?)";
  // D1 batch is transactional. Each conditional write is tied to this request's
  // nonce, so concurrent retries cannot increment counters twice.
  const results = await env.DB.batch([
    env.DB.prepare(`INSERT INTO receipts(id,day,nonce) SELECT ?,?,?
      WHERE COALESCE((SELECT events FROM daily_stats WHERE day=?),0) < ?
      AND COALESCE((SELECT events FROM visitor_days WHERE day=? AND visitor=?),0) < ?
      AND (EXISTS (SELECT 1 FROM visitors WHERE visitor=?) OR CAST((SELECT value FROM metadata WHERE key='visitor_count') AS INTEGER) < ?)
      ON CONFLICT(id) DO NOTHING`).bind(event.eventId, day, nonce, day, DAILY_EVENT_LIMIT, day, visitor, BROWSER_EVENT_LIMIT, visitor, MAX_VISITORS),
    env.DB.prepare(`INSERT INTO visitors(visitor,first_day,last_day,flags) SELECT ?,?,?,? WHERE ${allowed}
      ON CONFLICT(visitor) DO UPDATE SET last_day=excluded.last_day,flags=visitors.flags | excluded.flags`).bind(visitor, day, day, flags, event.eventId, nonce),
    env.DB.prepare(`INSERT INTO visitor_days(day,visitor,flags,is_returning,events)
      SELECT ?,?,?,(SELECT first_day < ? FROM visitors WHERE visitor=?),1 WHERE ${allowed}
      ON CONFLICT(day,visitor) DO UPDATE SET flags=visitor_days.flags | excluded.flags,events=visitor_days.events+1`).bind(day, visitor, flags, day, visitor, event.eventId, nonce),
    env.DB.prepare(`INSERT INTO daily_stats(day,events,last_received_at) SELECT ?,1,? WHERE ${allowed}
      ON CONFLICT(day) DO UPDATE SET events=daily_stats.events+1,last_received_at=excluded.last_received_at`).bind(day, now.toISOString(), event.eventId, nonce),
    env.DB.prepare(`INSERT INTO counters(day,name,page,board,dimension,count) SELECT ?,?,?,?,?,1 WHERE ${allowed}
      ON CONFLICT(day,name,page,board,dimension) DO UPDATE SET count=counters.count+1`).bind(day, event.name, event.page, event.board, dimension, event.eventId, nonce),
    env.DB.prepare(`INSERT INTO metadata(key,value) SELECT 'tracking_since',? WHERE ${allowed} ON CONFLICT(key) DO NOTHING`).bind(now.toISOString(), event.eventId, nonce),
  ]);
  if (!results[0]?.meta?.changes) {
    // Duplicate delivery succeeds without a second count. A quota rejection is
    // marked as incomplete, without retaining its payload or visitor identity.
    const existing = await env.DB.prepare("SELECT 1 FROM receipts WHERE id=?").bind(event.eventId).all();
    if (existing.results.length) return response(request, env, 204);
    await env.DB.prepare("INSERT INTO daily_stats(day,limited) VALUES (?,1) ON CONFLICT(day) DO UPDATE SET limited=1").bind(day).run();
    return response(request, env, 429);
  }
  return response(request, env, 204);
}

const featureTotals = (table: string) => `COUNT(*) AS visitors,
  COALESCE(SUM((flags & 1)>0),0) AS active, COALESCE(SUM(${table === "visitors" ? "last_day>first_day" : "is_returning"}),0) AS "returning",
  COALESCE(SUM((flags & 2)>0),0) AS browsed, COALESCE(SUM((flags & 4)>0),0) AS applied,
  COALESCE(SUM((flags & 8)>0),0) AS saved, COALESCE(SUM((flags & 16)>0),0) AS filtered, COALESCE(SUM((flags & 32)>0),0) AS tracked`;

export async function buildReport(db: Database, range: ActivityReport["range"], now = new Date()): Promise<ActivityReport> {
  const end = dayAt(now);
  const start = range === "all" ? "0000-01-01" : range === "month" ? end.slice(0, 7) + "-01" : daysAgo(now, range === "7d" ? 6 : 29);
  const totalsSql = range === "all"
    ? `SELECT ${featureTotals("visitors")} FROM visitors`
    : `SELECT ${featureTotals("period")} FROM (SELECT visitor,MAX(is_returning) AS is_returning,
      MAX(flags & 1) | MAX(flags & 2) | MAX(flags & 4) | MAX(flags & 8) | MAX(flags & 16) | MAX(flags & 32) AS flags
      FROM visitor_days WHERE day>=? AND day<=? GROUP BY visitor) period`;
  const statements = [
    range === "all" ? db.prepare(totalsSql) : db.prepare(totalsSql).bind(start, end),
    db.prepare('SELECT day,visitors,active,is_returning AS "returning",events,limited FROM daily_stats WHERE day>=? AND day<=? ORDER BY day').bind(range === "all" ? daysAgo(now, 89) : start, end),
    db.prepare("SELECT name,page,board,dimension,SUM(count) AS count FROM counters WHERE day>=? AND day<=? GROUP BY name,page,board,dimension ORDER BY count DESC").bind(start, end),
    db.prepare("SELECT value FROM metadata WHERE key='tracking_since'"),
    db.prepare("SELECT MAX(last_received_at) AS last FROM daily_stats"),
  ];
  const [totals, daily, breakdown, since, last] = await db.batch(statements);
  return {
    version: 1, generatedAt: now.toISOString(), trackingSince: since.results[0]?.value as string ?? null,
    lastReceivedAt: last.results[0]?.last as string ?? null, range,
    start: range === "all" ? (since.results[0]?.value as string ?? end).slice(0, 10) : start, end,
    totals: totals.results[0] as ActivityTotals,
    daily: daily.results.map((row) => ({ ...row, limited: !!row.limited })) as ActivityReport["daily"],
    breakdown: breakdown.results as ActivityReport["breakdown"],
    limits: { dailyEvents: DAILY_EVENT_LIMIT, browserDailyEvents: BROWSER_EVENT_LIMIT, detailDays: DETAIL_DAYS },
  };
}

export async function handleRequest(request: Request, env: Env, now = new Date()): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "OPTIONS" && ["/collect", "/report"].includes(url.pathname)) {
    if (!originAllowed(request, env)) return response(request, env, 403);
    const res = response(request, env, 204);
    res.headers.set("Access-Control-Allow-Methods", url.pathname === "/collect" ? "POST" : "GET");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Max-Age", "600");
    return res;
  }
  if (request.method === "GET" && url.pathname === "/health") return response(request, env, 200, { service: "empluzzed-activity", collectionEnabled: env.COLLECTION_ENABLED === "true" });
  try {
    if (url.pathname === "/collect" && request.method === "POST" && !url.search) return await collect(request, env, now);
    if (url.pathname === "/report" && request.method === "GET") {
      if (request.headers.has("Origin") && !originAllowed(request, env)) return response(request, env, 403);
      if (!await authorized(request, env)) return response(request, env, 401, { error: "Owner access required." });
      const range = url.searchParams.get("range") ?? "30d";
      if (!["7d", "30d", "month", "all"].includes(range) || [...url.searchParams.keys()].some((key) => key !== "range")) return response(request, env, 400);
      return response(request, env, 200, await buildReport(env.DB, range as ActivityReport["range"], now));
    }
    return response(request, env, 404);
  } catch {
    // Never log request bodies, headers, IDs, secrets, or database errors.
    return response(request, env, 503, { error: "Analytics is temporarily unavailable. Browsing is unaffected." });
  }
}

export async function pruneDetails(db: Database, now = new Date()) {
  await db.batch([
    db.prepare("DELETE FROM visitor_days WHERE day < ?").bind(daysAgo(now, DETAIL_DAYS - 1)),
    db.prepare("DELETE FROM receipts WHERE day < ?").bind(daysAgo(now, 6)),
  ]);
}
const worker = {
  fetch(request: Request, env: Env) { return handleRequest(request, env); },
  async scheduled(_event: unknown, env: Env) { await pruneDetails(env.DB); },
};
export default worker;
