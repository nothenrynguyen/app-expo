import assert from "node:assert/strict";
import test from "node:test";
import { createAtsBoard } from "../lib/ats-boards";
import { selectRefreshBoards } from "../lib/ingestion/board-history";
import { countHealth } from "../lib/ingestion/source-health";
import { recordWorkdayAttempt, workdayCooldown, type WorkdaySchedule } from "../lib/ingestion/workday-schedule";
import { buildJobsSummary } from "../lib/job-summary";
import { buildRefreshReport } from "../lib/ingestion/refresh-report";
import type { PublicJob } from "../lib/jobs";
import { createWorkdayBoard, fetchWorkdayBoard } from "../lib/workday";
import { loadCandidates } from "../lib/ingestion/load-candidates";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const now = new Date("2026-10-29T12:00:00Z");

test("collector excludes retired application URLs while preserving unrelated feed candidates", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "empluzzed-retired-board-"));
  const original = globalThis.fetch;
  try {
    await mkdir(path.join(root, "data"));
    await writeFile(path.join(root, "data/source-licenses.json"), JSON.stringify({repositories: [{repository: "owner/jobs", status: "licensed", licenseUrl: "https://github.com/owner/jobs/blob/main/LICENSE"}]}));
    await writeFile(path.join(root, "data/retired-boards.json"), JSON.stringify([{id: "greenhouse:oldmissioncapital"}]));
    const retiredUrl = "https://boards.greenhouse.io/oldmissioncapital/jobs/123";
    let calls = 0;
    globalThis.fetch = async input => {
      calls++;
      assert.equal(String(input), "https://raw.githubusercontent.com/owner/jobs/main/README.md");
      return new Response(`| Company | Title | Location | Application | Date Posted |\n| --- | --- | --- | --- | --- |\n| Old Mission | Software Engineer Intern | Chicago, IL | [Apply](${retiredUrl}) | Oct 29, 2026 |\n| Other | Software Engineer Intern | Austin, TX | [Apply](https://example.com/apply) | Oct 29, 2026 |\n`);
    };
    const result = await loadCandidates(root, [{id: "test", name: "Test", kind: "markdown", repository: "owner/jobs", url: "https://raw.githubusercontent.com/owner/jobs/main/README.md", active: true, trustedCoverage: false}]);
    assert.equal(calls, 1);
    assert.deepEqual(result.candidates.map(candidate => candidate.company), ["Other"]);
    assert.deepEqual(result.preScreened, [{url: retiredUrl, outcome: "closed"}]);
    assert.deepEqual(result.retiredBoardIds, ["greenhouse:oldmissioncapital"]);
    assert.equal(result.boardRegistry.length, 0);
  } finally {globalThis.fetch = original; await rm(root, {recursive: true, force: true});}
});

test("collector persists a rate limit and makes zero board requests during the next refresh cooldown", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "empluzzed-workday-health-"));
  const original = globalThis.fetch;
  let calls = 0;
  try {
    await mkdir(path.join(root, "data"));
    await writeFile(path.join(root, "data/source-licenses.json"), JSON.stringify({repositories: []}));
    await writeFile(path.join(root, "data/workday-boards.json"), JSON.stringify([
      {host: "example.wd1.myworkdayjobs.com", tenant: "example", site: "Careers", company: "Example", searchTerms: ["intern"]},
    ]));
    globalThis.fetch = async () => {calls++; return new Response(null, {status: 429, headers: {"retry-after": "10800"}});};
    const first = await loadCandidates(root, []);
    assert.equal(first.sourceDiagnostics.find(record => record.kind === "workday")!.outcome, "rate_limited");
    assert.equal(first.sourceDiagnostics.find(record => record.kind === "workday")!.requestCount, 1);
    await writeFile(path.join(root, "data/workday-schedule.json"), JSON.stringify(first.workdaySchedule));
    const second = await loadCandidates(root, []);
    assert.equal(calls, 1);
    assert.equal(second.sourceDiagnostics.find(record => record.kind === "workday")!.outcome, "cooldown");
    assert.equal(second.sourceDiagnostics.find(record => record.kind === "workday")!.requestCount, 0);
    assert.equal(second.boardRegistry[0].status, "failed");
    assert.deepEqual(second.workdaySchedule, first.workdaySchedule);
  } finally {globalThis.fetch = original; await rm(root, {recursive: true, force: true});}
});

test("retired addresses cannot return through rediscovery, history or snapshot bootstrap", () => {
  const board = createAtsBoard({provider: "greenhouse", key: "example", company: "Example"});
  const history = {version: 1 as const, boards: [{provider: "greenhouse" as const, key: "example", company: "Example", lastDiscoveredAt: now.toISOString()}]};
  const retired = new Set([board.id]);
  const prior = {company: "Example", applyUrl: "https://boards.greenhouse.io/example/jobs/1"} as PublicJob;
  assert.equal(selectRefreshBoards([board], history, [prior], now, retired).boards.length, 0);
  assert.equal(selectRefreshBoards([], {version: 1, boards: []}, [prior], now, retired).boards.length, 0);
  const replacement = createAtsBoard({provider: "ashby", key: "example", company: "Example"});
  assert.deepEqual(selectRefreshBoards([replacement, board], history, [], now, retired).boards.map(b => b.id), [replacement.id]);
});

test("Workday cooldowns survive serialization, expire, back off and reset", () => {
  let state: WorkdaySchedule = {};
  recordWorkdayAttempt(state, "example", "rate_limited", now, "429 Too Many Requests", 3 * 3_600_000);
  state = JSON.parse(JSON.stringify(state));
  assert.ok(workdayCooldown(state, "example", new Date(now.getTime() + 2 * 3_600_000)));
  assert.equal(workdayCooldown(state, "example", new Date(now.getTime() + 3 * 3_600_000)), null);
  const previous = {...state.example};
  recordWorkdayAttempt(state, "example", "cooldown", now, "skipped");
  assert.deepEqual(state.example, previous);
  recordWorkdayAttempt(state, "example", "rate_limited", now, "429 Too Many Requests");
  assert.equal(state.example.nextAttemptAt, new Date(now.getTime() + 4 * 3_600_000).toISOString());
  recordWorkdayAttempt(state, "example", "healthy", now, "");
  assert.equal(workdayCooldown(state, "example", now), null);
  recordWorkdayAttempt(state, "example", "unavailable", now, "500 Internal Server Error");
  assert.equal(state.example.failures, 1);
  recordWorkdayAttempt(state, "denied", "unavailable", now, "403 Forbidden");
  assert.equal(state.denied.nextAttemptAt, new Date(now.getTime() + 24 * 3_600_000).toISOString());
});

test("health groups include every employer and separate recovery from feeds", () => {
  const report = buildRefreshReport({startedAt: now, completedAt: now,
    sourceDiagnostics: [
      {name: "Community", kind: "markdown", status: "ok", rows: 1, requestCount: 1, durationMs: 1},
      {name: "Workday", kind: "workday", status: "failed", outcome: "partial", rows: 1, requestCount: 1, durationMs: 1},
      {name: "Recovery", kind: "employer_recovery", status: "ok", outcome: "partial", rows: 1, requestCount: 1, durationMs: 1},
    ], boardDiagnostics: [
      {company: "One", provider: "ashby", key: "one", status: "ok", rows: 1, durationMs: 1},
      {company: "Two", provider: "workday", key: "two", status: "ok", outcome: "partial", rows: 1, durationMs: 1},
      {company: "Three", provider: "workday", key: "three", status: "failed", outcome: "cooldown", rows: 0, durationMs: 0, requestCount: 0},
    ], verificationDiagnostics: [], candidates: 1, accepted: 1, quarantined: 0, rejected: 0,
    preservedFromLastHealthySnapshot: 0, checksAttempted: 0, checksCompleted: 0, knownClosed: 0});
  const summary = buildJobsSummary({generatedAt: now.toISOString(), jobs: [], sourceHealth: [], quarantinedCount: 0}, report);
  assert.equal(summary.health!.feeds.total, 1);
  assert.equal(summary.health!.feeds.healthy, 1);
  assert.equal(summary.health!.employers.total, 3);
  assert.equal(summary.health!.employers.healthy, 1);
  assert.equal(summary.health!.employers.partial, 1);
  assert.equal(summary.health!.employers.cooldown, 1);
  assert.equal(summary.health!.recovery.partial, 1);
  assert.equal(report.status, "degraded");
  assert.equal(countHealth([{status: "ok", detailFailures: 3}]).partial, 1);
});

test("Workday detail rate limits expose causes and Retry-After without retrying or renewing evidence", async () => {
  const board = createWorkdayBoard({host: "example.wd1.myworkdayjobs.com", tenant: "example", site: "Careers", company: "Example", searchTerms: ["intern"]});
  let requests = 0;
  const result = await fetchWorkdayBoard(board, now, {retryDelayMs: 0, fetchImpl: (async (_url, init) => {
    requests++;
    if (init?.method === "POST") return Response.json({total: 2, jobPostings: [
      {title: "Software Engineer Intern", externalPath: "/job/USA/Intern_JR1"},
      {title: "Software Engineer Intern", externalPath: "/job/USA/Intern_JR2"},
    ]});
    return new Response(null, {status: 429, headers: {"retry-after": "10800"}});
  }) as typeof fetch});
  assert.ok(requests <= 3);
  assert.equal(result.diagnostics.requestCount, requests);
  assert.equal(result.diagnostics.accessDenied, 429);
  assert.equal(result.diagnostics.retryAfterMs, 10_800_000);
  assert.equal(result.diagnostics.detailFailures, 2);
  assert.equal(Object.values(result.diagnostics.failureReasons).reduce((a,b) => a+b, 0), 2);
  assert.ok(result.checks.every(check => check.status === "unknown"));
  assert.equal(result.jobs.length, 0);
});
