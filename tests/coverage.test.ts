import assert from "node:assert/strict";
import test from "node:test";
import { createAtsBoard, discoverAtsBoard, fetchAtsBoard } from "../lib/ats-boards";
import { selectRefreshBoards, completeBoardHistory, MAX_RETAINED_BOARDS } from "../lib/ingestion/board-history";
import { assessCoverage, assertCoverageSafe } from "../lib/ingestion/coverage-guard";
import { buildListingChanges } from "../lib/ingestion/listing-changes";
import { classifyRoleTags } from "../lib/role-areas";
import type { PublicJob } from "../lib/jobs";
import { boardRecoveryPolicy } from "../lib/ingestion/last-known-good";
import { loadCandidates } from "../lib/ingestion/load-candidates";
import { getJobLocationMetadata } from "../lib/job-location-policy";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const now = new Date("2026-10-29T05:00:00Z");
const board = createAtsBoard({ provider: "greenhouse", key: "example", company: "Example" });
const history = { version: 1 as const, boards: [{ provider: "greenhouse" as const, key: "example", company: "Example", lastDiscoveredAt: "2026-10-21T00:00:00Z" }] };

test("successful source omission retains the official board without granting employer trust", () => {
  const result = selectRefreshBoards([], history, [], now);
  assert.equal(result.retained, 1);
  assert.equal(result.boards[0].endpoint, board.endpoint);
  assert.deepEqual(result.history, history);
  const rediscovered = selectRefreshBoards([board, board], history, [], now);
  assert.equal(rediscovered.boards.length, 1);
  assert.equal(rediscovered.history.boards[0].lastDiscoveredAt, now.toISOString());
});

test("retention expires and request limits fail visibly instead of silently dropping boards", () => {
  assert.equal(selectRefreshBoards([], history, [], new Date("2027-02-01")).boards.length, 0);
  const many = { version: 1 as const, boards: Array.from({ length: MAX_RETAINED_BOARDS + 1 }, (_, i) => ({ ...history.boards[0], key: `board${i}` })) };
  assert.throws(() => selectRefreshBoards([], many, [], now), /budget exceeded/);
  assert.throws(() => selectRefreshBoards([], { version: 1, boards: [{ ...history.boards[0], lastDiscoveredAt: "invalid" }] }, [], now), /Invalid/);
  const healthy = completeBoardHistory(history, [{ provider: "greenhouse", key: "example", company: "Example", status: "ok", rows: 1, durationMs: 1 }], new Date("2027-01-01"));
  assert.equal(selectRefreshBoards([], healthy, [], new Date("2027-02-01")).retained, 1);
  const empty = completeBoardHistory(history, [{ provider: "greenhouse", key: "example", company: "Example", status: "ok", rows: 0, durationMs: 1 }], new Date("2027-01-01"));
  assert.equal(selectRefreshBoards([], empty, [], new Date("2027-02-01")).retained, 0);
});

test("European Lever boards retain their region and permanent missing boards retire", () => {
  const eu = discoverAtsBoard("https://jobs.eu.lever.co/example/123", "Example", "test")!;
  const first = selectRefreshBoards([eu, board], { version: 1, boards: [] }, [], now);
  const next = selectRefreshBoards([], first.history, [], now);
  assert.ok(next.boards.some(b => b.id === eu.id && b.endpoint.includes("api.eu.lever.co")));
  assert.equal(completeBoardHistory(next.history, [{ provider: "greenhouse", key: "example", company: "Example", status: "failed", rows: 0, durationMs: 1, message: "404 Not Found" }]).boards.length, 1);
  assert.equal(completeBoardHistory(next.history, [{ provider: "greenhouse", key: "example", company: "Example", status: "failed", rows: 0, durationMs: 1, message: "503 Unavailable" }]).boards.length, 2);
});

test("malformed official responses fail rather than falsely confirming every job closed", async () => {
  const original = globalThis.fetch;
  try {
    for (const provider of ["greenhouse", "lever", "ashby"] as const) {
      const b = createAtsBoard({ provider, key: "example", company: "Example" });
      globalThis.fetch = async () => Response.json({ error: "unexpected response" });
      await assert.rejects(fetchAtsBoard(b), /Invalid.*payload/);
      globalThis.fetch = async () => Response.json(provider === "lever" ? [{}] : { jobs: [{}] });
      await assert.rejects(fetchAtsBoard(b), /missing job title or URL/);
      globalThis.fetch = async () => Response.json(provider === "lever" ? [] : { jobs: [] });
      assert.equal((await fetchAtsBoard(b)).liveIdentities.size, 0);
    }
  } finally { globalThis.fetch = original; }
});

test("coverage guard blocks unexplained removals by collection, even if additions hide total loss", () => {
  const jobs = Array.from({ length: 100 }, (_, i) => ({ id: `${i}`, title: "Software Engineer", category: "New grad", applyUrl: `https://example.com/jobs/${i}` } as PublicJob));
  const current = [...jobs.slice(30), ...jobs.slice(0, 30).map(j => ({ ...j, id: `new${j.id}`, applyUrl: `${j.applyUrl}-new` }))];
  const changes = buildListingChanges({ generatedAt: now.toISOString(), previousGeneratedAt: null, previous: jobs, current, acceptedBeforeDedup: current, candidateUrls: current.map(j => j.applyUrl), outcomeFor: () => undefined, boardState: () => null });
  const coverage = assessCoverage(jobs, current, changes);
  assert.equal(coverage.find(c => c.collection === "fulltime")!.unexplained, 30);
  assert.throws(() => assertCoverageSafe(coverage), /Refusing unexplained/);
  const closed = { ...changes, removed: changes.removed.map(j => ({ ...j, reason: "closed" as const })) };
  assert.doesNotThrow(() => assertCoverageSafe(assessCoverage(jobs, [], closed)));
  assert.equal(assessCoverage(jobs, [], closed)[1].largeDrop, true);
});

test("restoring employer coverage cannot reintroduce seasonal retail operations", () => {
  assert.deepEqual(classifyRoleTags({ title: "Seasonal Operations Associate (Part-Time) - Dadeland Mall", category: "New grad" }), []);
  for (const title of ["Operations Associate (Full-Time)", "Sales Associate (Full-Time) - Garden State Plaza"]) {
    assert.deepEqual(classifyRoleTags({ title, category: "New grad", rawText: "Support the retail store team" }), []);
  }
  assert.ok(classifyRoleTags({ title: "Retail Operations Analyst", category: "New grad", rawText: "Support the retail store team" }).includes("operations-supply-chain"));
  assert.ok(classifyRoleTags({ title: "Sales Associate", category: "New grad", rawText: "Financial services" }).includes("marketing-sales"));
});

test("restored Australian listings cannot qualify as UK jobs through New South Wales", () => {
  assert.equal(getJobLocationMetadata({ location: "Australia; Melbourne, Victoria, Australia; Sydney, New South Wales, Australia" }).eligible, false);
  assert.deepEqual(getJobLocationMetadata({ location: "Cardiff, Wales, United Kingdom" }).regions, ["uk"]);
  assert.deepEqual(getJobLocationMetadata({ location: "South Wales" }).regions, ["uk"]);
  assert.deepEqual(getJobLocationMetadata({ location: "Sydney, New South Wales, Australia; London, United Kingdom" }).regions, ["uk"]);
});

test("an unrelated board failure cannot restore jobs omitted by healthy sources", () => {
  const prior = { company: "Example", applyUrl: "https://boards.greenhouse.io/example/jobs/123", sources: ["Healthy feed"] } as PublicJob;
  const diagnostics = [{ provider: "greenhouse" as const, key: "other", company: "Other", status: "failed" as const, rows: 0, durationMs: 1, message: "timeout" }];
  assert.equal(boardRecoveryPolicy(diagnostics, new Map()).mayRecover(prior, new Set()), false);
  assert.equal(boardRecoveryPolicy(diagnostics, new Map()).mayRecover(prior, new Set(["Healthy feed"])), true);
  const healthy = new Map([[board.id, { board, jobs: [], liveIdentities: new Set<string>() }]]);
  assert.equal(boardRecoveryPolicy(diagnostics, healthy).mayRecover(prior, new Set(["Healthy feed"])), false);
  const permanent = [{ ...diagnostics[0], key: "example", message: "404 Not Found" }];
  assert.equal(boardRecoveryPolicy(permanent, new Map()).mayRecover(prior, new Set(["Healthy feed"])), false);
});

test("collector refreshes an omitted board, still detects closure, and fails on corrupt history", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "empluzzed-coverage-"));
  const original = globalThis.fetch;
  const h = { ...history, boards: [{ ...history.boards[0], lastDiscoveredAt: new Date().toISOString() }] };
  try {
    await mkdir(path.join(root, "data"));
    await writeFile(path.join(root, "data/board-history.json"), JSON.stringify(h));
    const url = "https://boards.greenhouse.io/example/jobs/1234567";
    const previous = [{ company: "Example", title: "Software Engineer", applyUrl: url, sources: ["Old feed"] } as PublicJob];
    globalThis.fetch = async input => {
      assert.equal(String(input), board.endpoint);
      return Response.json({ jobs: [{ title: "Software Engineer I", absolute_url: url, location: { name: "New York, NY" } }] });
    };
    const live = await loadCandidates(root, [], previous);
    assert.equal(live.boardCoverage.retained, 1);
    assert.equal(live.candidates.length, 1);
    assert.equal(live.pinnedCompanies.length, 0);
    assert.equal(boardRecoveryPolicy(live.boardRegistry, live.boardResults).confirmedClosed(previous[0]), false);
    globalThis.fetch = async () => Response.json({ jobs: [] });
    const closed = await loadCandidates(root, [], previous);
    assert.equal(boardRecoveryPolicy(closed.boardRegistry, closed.boardResults).confirmedClosed(previous[0]), true);
    globalThis.fetch = async () => Response.json({ unexpected: [] });
    const malformed = await loadCandidates(root, [], previous);
    assert.equal(malformed.boardRegistry[0].status, "failed");
    assert.equal(boardRecoveryPolicy(malformed.boardRegistry, malformed.boardResults).affected(previous[0]), true);
    await writeFile(path.join(root, "data/board-history.json"), "{");
    await assert.rejects(loadCandidates(root, [], previous), SyntaxError);
  } finally { globalThis.fetch = original; await rm(root, { recursive: true, force: true }); }
});
