import assert from "node:assert/strict";
import test from "node:test";
import { checkRefresh, refreshSlot } from "../workers/refresh/src/index";
import { createSnapshotPoller } from "../lib/snapshot-polling";
import type { JobsSnapshot } from "../lib/jobs";

const now = Date.parse("2026-10-26T12:37:00Z");
const slot = "2026-10-26T12:17:00.000Z";
const env = { SCHEDULER_ENABLED: "true", GITHUB_ACTIONS_TOKEN: "test-only-credential" };
type Run = { status: string; display_title: string; created_at: string };
function schedulerFixture({ repositoryAt = "2026-10-26T11:20:00Z", publishedAt = repositoryAt,
  runs = [], failure = "" }: { repositoryAt?: string; publishedAt?: string; runs?: Run[]; failure?: string } = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (failure && url.includes(failure)) return new Response("private provider error", { status: 503 });
    if (url.includes("raw.githubusercontent.com")) return Response.json({ generatedAt: repositoryAt });
    if (url.includes("empluzzed.fyi")) return Response.json({ generatedAt: publishedAt });
    if (url.includes("/runs?")) return Response.json({ workflow_runs: runs });
    assert.ok(url.endsWith("/dispatches"));
    return new Response(null, { status: 204 });
  };
  return { calls, fetcher };
}

test("hourly slots stay at :17 across midnight and daylight-saving dates", () => {
  assert.equal(refreshSlot(Date.parse("2026-10-26T00:16:00Z")), "2026-10-25T23:17:00.000Z");
  assert.equal(refreshSlot(Date.parse("2026-11-01T09:57:00Z")), "2026-11-01T09:17:00.000Z");
});

test("disabled or unconfigured scheduler cannot trigger anything", async () => {
  const f = schedulerFixture();
  assert.equal((await checkRefresh({ SCHEDULER_ENABLED: "false" }, now, f.fetcher)).status, "disabled");
  await assert.rejects(checkRefresh({ SCHEDULER_ENABLED: "true" }, now, f.fetcher), /missing/);
  assert.equal(f.calls.length, 0);
});

test("stale snapshot triggers only the fixed repository workflow and slot", async () => {
  const f = schedulerFixture();
  assert.deepEqual(await checkRefresh(env, now, f.fetcher), { status: "dispatched", slot, attempt: 1 });
  const dispatch = f.calls.at(-1)!;
  assert.equal(dispatch.url, "https://api.github.com/repos/nothenrynguyen/app-expo/actions/workflows/sync-jobs.yml/dispatches");
  assert.deepEqual(JSON.parse(String(dispatch.init?.body)), { ref: "main", inputs: { refresh_slot: slot } });
  assert.equal(dispatch.init?.redirect, "error");
  for (const call of f.calls.filter((c) => !c.url.startsWith("https://api.github.com/"))) {
    assert.equal(new Headers(call.init?.headers).has("Authorization"), false);
  }
});

test("new published snapshot suppresses redundant ingestion", async () => {
  const f = schedulerFixture({ repositoryAt: "2026-10-26T12:20:00Z" });
  assert.deepEqual(await checkRefresh(env, now, f.fetcher), { status: "fresh", slot });
  assert.equal(f.calls.length, 2);
});

test("deployment lag is reported without rerunning ingestion", async () => {
  const f = schedulerFixture({ repositoryAt: "2026-10-26T12:20:00Z", publishedAt: "2026-10-26T11:20:00Z" });
  await assert.rejects(checkRefresh(env, now, f.fetcher), /production publication/);
  assert.equal(f.calls.length, 2);
});

test("queued and running refreshes suppress duplicate dispatches", async () => {
  for (const status of ["queued", "in_progress", "waiting", "pending", "requested"]) {
    const f = schedulerFixture({ runs: [{ status, display_title: "Manual refresh", created_at: slot }] });
    assert.equal((await checkRefresh(env, now, f.fetcher)).status, "running");
    assert.equal(f.calls.length, 2);
  }
});

test("failure allows one retry per slot, then stops", async () => {
  const run = { status: "completed", display_title: `Hourly refresh ${slot}`, created_at: slot };
  const first = schedulerFixture({ runs: [run] });
  assert.equal((await checkRefresh(env, now, first.fetcher)).attempt, 2);
  const second = schedulerFixture({ runs: [run, run] });
  await assert.rejects(checkRefresh(env, now, second.fetcher), /retry limit/);
  assert.equal(second.calls.length, 2);
});

test("dependency errors and bad timestamps fail closed without exposing response bodies", async () => {
  for (const failure of ["raw.githubusercontent.com", "/runs?", "/dispatches"]) {
    const f = schedulerFixture({ failure });
    await assert.rejects(checkRefresh(env, now, f.fetcher), { message: "Refresh dependency returned HTTP 503" });
  }
  for (const repositoryAt of ["invalid", "2027-01-01T00:00:00Z"]) {
    const f = schedulerFixture({ repositoryAt });
    await assert.rejects(checkRefresh(env, now, f.fetcher), /Invalid snapshot/);
    assert.equal(f.calls.length, 1);
  }
});

function snapshot(generatedAt: string): JobsSnapshot {
  return { generatedAt, jobs: [], quarantinedCount: 0, sourceHealth: [] };
}
function browserFixture() {
  const seen: JobsSnapshot[] = [];
  const calls: string[] = [];
  let visible = true;
  let fail = false;
  let current = snapshot("2026-10-26T11:20:00Z");
  let initialErrors = 0;
  const poller = createSnapshotPoller({
    type: "internships", isVisible: () => visible,
    onSnapshot: (next) => seen.push(next), onInitialError: () => { initialErrors++; },
    fetcher: async (url, init) => {
      assert.equal(init?.cache, "no-store");
      calls.push(String(url));
      if (fail) throw new Error("offline");
      return Response.json(String(url) === "/summary.json" ? { generatedAt: current.generatedAt } : current);
    },
  });
  return { poller, calls, seen, errors: () => initialErrors, setVisible: (value: boolean) => { visible = value; },
    setFail: (value: boolean) => { fail = value; }, setSnapshot: (value: JobsSnapshot) => { current = value; } };
}

test("open board checks small summary and only downloads newer collections", async () => {
  const f = browserFixture();
  await f.poller.refresh();
  await f.poller.refresh();
  assert.deepEqual(f.calls, ["/internships.json", "/summary.json"]);
  assert.equal(f.seen.length, 1);
  f.setSnapshot(snapshot("2026-10-26T12:20:00Z"));
  await f.poller.refresh();
  assert.deepEqual(f.calls.slice(-2), ["/summary.json", "/internships.json"]);
  assert.equal(f.seen.at(-1)?.generatedAt, "2026-10-26T12:20:00Z");
});

test("hidden and disposed boards make no requests", async () => {
  const f = browserFixture();
  f.setVisible(false);
  await f.poller.refresh();
  assert.equal(f.calls.length, 0);
  f.setVisible(true);
  await f.poller.refresh();
  f.poller.stop();
  await f.poller.refresh();
  assert.equal(f.calls.length, 1);
});

test("network errors preserve loaded jobs and initial errors can recover", async () => {
  const f = browserFixture();
  f.setFail(true);
  await f.poller.refresh();
  assert.equal(f.errors(), 1);
  f.setFail(false);
  await f.poller.refresh();
  f.setFail(true);
  await f.poller.refresh();
  assert.equal(f.errors(), 1);
  assert.equal(f.seen.length, 1);
});

test("concurrent polling and cleanup never publish duplicate or unmounted results", async () => {
  let resolve!: (value: Response) => void;
  let requests = 0;
  const seen: JobsSnapshot[] = [];
  const poller = createSnapshotPoller({ type: "fulltime", isVisible: () => true,
    onInitialError: () => assert.fail("aborted initial request should be ignored"), onSnapshot: (s) => seen.push(s),
    fetcher: () => { requests++; return new Promise<Response>((done) => { resolve = done; }); },
  });
  const pending = poller.refresh();
  await poller.refresh();
  assert.equal(requests, 1);
  poller.stop();
  resolve(Response.json(snapshot("2026-10-26T12:20:00Z")));
  await pending;
  assert.equal(seen.length, 0);
});
