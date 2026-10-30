import assert from "node:assert/strict";
import test from "node:test";
import { createAtsBoard, discoverAtsBoard, fetchAtsBoard } from "../lib/ats-boards";
import { selectRefreshBoards, completeBoardHistory, MAX_RETAINED_BOARDS } from "../lib/ingestion/board-history";
import { assessCoverage, assertCoverageSafe } from "../lib/ingestion/coverage-guard";
import { buildListingChanges, formatListingChangesSummary } from "../lib/ingestion/listing-changes";
import { createListingChangeEvidence } from "../lib/ingestion/listing-change-evidence";
import { createScreeningTracker } from "../lib/ingestion/screening";
import { jobIdentity } from "../lib/source-normalization";
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

const priorJob = { id: "old", company: "Example", title: "Software Engineer", category: "New grad", applyUrl: "https://example.com/jobs/old", sources: ["Feed"] } as PublicJob;
const generatedAt = "2026-10-29T05:02:00Z";
const evidence = (overrides: Partial<Parameters<typeof createListingChangeEvidence>[0]> = {}) => createListingChangeEvidence({
  startedAt: now, generatedAt, listingHealth: {}, workdayChecks: [], boardRegistry: [], boardResults: new Map(), sourceDiagnostics: [], retired: new Set(), ...overrides,
});
const changesFor = (overrides: Partial<Parameters<typeof buildListingChanges>[0]> = {}) => buildListingChanges({
  generatedAt, previousGeneratedAt: "2026-10-29T04:00:00Z", previous: [priorJob], current: [], acceptedBeforeDedup: [], candidateUrls: [], outcomeFor: () => undefined, boardState: () => null, evidenceFor: evidence(), ...overrides,
});

test("removal diagnoses require current posting evidence for closure, not board absence or stale screening", () => {
  const health = (checkedAt: string) => ({ [jobIdentity(priorJob.applyUrl)!]: { url: priorJob.applyUrl, status: "closed" as const, checkedAt, httpStatus: 404 } });
  for (const checkedAt of ["2026-10-28T05:00:00Z", "2026-10-30T05:00:00Z"]) {
    const report = changesFor({ outcomeFor: () => "closed", evidenceFor: evidence({ listingHealth: health(checkedAt) }) });
    assert.equal(report.removedOpportunities[0].category, "unresolved");
    assert.equal(report.removedOpportunities[0].evidence!.postingCheck!.currentRun, false);
  }
  const fresh = changesFor({ evidenceFor: evidence({ listingHealth: health("2026-10-29T05:01:00Z") }) });
  assert.equal(fresh.categoryCounts["confirmed-closed"], 1);
  assert.equal(changesFor({ boardState: () => "absent", outcomeFor: () => "closed" }).categoryCounts.unresolved, 1);
  assert.equal(changesFor({ outcomeFor: () => "role" }).categoryCounts["scope-exclusion"], 1);
  assert.equal(changesFor({ outcomeFor: () => "pendingVerification" }).categoryCounts["verification-pending"], 1);
  assert.equal(changesFor({ acceptedBeforeDedup: [priorJob] }).categoryCounts.deduplicated, 1);
});

test("Workday alias compaction reconciles openings separately from rows and retains exact site evidence", () => {
  const url = (site: string, slug = "Old") => `https://example.wd1.myworkdayjobs.com/${site}/job/Austin/${slug}_JR12345`;
  const a = { ...priorJob, applyUrl: url("External") };
  const alias = { ...a, id: "alias", applyUrl: url("en-US/External", "New") };
  const internal = { ...a, id: "internal", applyUrl: url("Internal") };
  const e = evidence({ workdayChecks: [{ url: alias.applyUrl, status: "closed" }] });
  const report = changesFor({ previous: [a, alias, internal], current: [internal], acceptedBeforeDedup: [internal], evidenceFor: e });
  assert.deepEqual(report.reconciliation, { unit: "opportunities", previous: 2, current: 1, retained: 1, added: 0, removed: 1, net: -1 });
  assert.equal(report.removedCount, 2);
  assert.equal(report.removedOpportunities.length, 1);
  assert.equal(report.removedOpportunities[0].previousUrls.length, 2);
  assert.equal(report.categoryCounts["confirmed-closed"], 1);
  assert.equal(e(internal).workdayChecks.length, 0);
  const compact = changesFor({ previous: [a, alias], current: [alias], acceptedBeforeDedup: [alias] });
  assert.equal(compact.reconciliation.removed, 0);
  assert.equal(compact.rowCounts.net, -1);
  assert.equal(compact.rowCounts.previousDuplicateRows, 1);
  assert.equal(compact.urlChanges.length, 1);
  const conflict = changesFor({ previous: [a], evidenceFor: evidence({ workdayChecks: [{ url: a.applyUrl, status: "closed" }, { url: alias.applyUrl, status: "live" }] }) });
  assert.equal(conflict.categoryCounts.unresolved, 1);
  assert.match(conflict.removedOpportunities[0].explanation, /conflict/);
  assert.match(formatListingChangesSummary(report), /2 \+ 0 added - 1 removed = 1/);
});

test("report evidence distinguishes posting failures, healthy board omissions and unattempted sources", () => {
  const job = { ...priorJob, applyUrl: "https://boards.greenhouse.io/example/jobs/1234567" };
  const healthyBoard = { board, jobs: [], liveIdentities: new Set<string>() };
  const runEvidence = evidence({ boardResults: new Map([[board.id, healthyBoard]]), boardRegistry: [{ ...board, status: "ok", rows: 0, durationMs: 1 }] });
  const r = changesFor({ previous: [job], boardState: () => "absent", evidenceFor: runEvidence });
  assert.equal(r.removedOpportunities[0].category, "unresolved");
  assert.equal(r.removedOpportunities[0].evidence!.board!.membership, "absent");
  assert.equal(r.removedOpportunities[0].evidence!.sources[0].status, "not-checked");
  const failed = changesFor({ evidenceFor: evidence({ sourceDiagnostics: [{ name: "Feed", kind: "markdown", status: "failed", outcome: "cooldown", rows: 0, requestCount: 0, durationMs: 0 }] }) });
  assert.equal(failed.categoryCounts["source-unavailable"], 1);
  assert.equal(failed.removedOpportunities[0].requiresInvestigation, true);
  const recovery = changesFor({ previous: [{ ...priorJob, sources: ["Employer recovery"] }], evidenceFor: evidence({ sourceDiagnostics: [{ name: "Original employer link recovery", kind: "employer_recovery", status: "ok", outcome: "partial", rows: 10, requestCount: 2, durationMs: 1 }] }) });
  assert.equal(recovery.categoryCounts["source-unavailable"], 1);
  assert.equal(recovery.removedOpportunities[0].evidence!.sources[0].diagnosticName, "Original employer link recovery");
  assert.equal(recovery.removedOpportunities[0].evidence!.sources[0].outcome, "partial");
  assert.equal(changesFor({ previous: [job], evidenceFor: evidence({ retired: new Set([board.id]) }) }).categoryCounts["confirmed-closed"], 0);
});

test("screening diagnostics follow locale aliases without crossing Workday sites and preserve the verification reason", () => {
  const tracker = createScreeningTracker();
  const url = "https://example.wd1.myworkdayjobs.com/External/job/Austin/Engineer_JR12345";
  tracker.record(url, "pendingVerification", "Employer ownership not verified.");
  const alias = url.replace("/External/", "/en-US/external/");
  assert.equal(tracker.opportunityOutcomeFor(alias), "pendingVerification");
  assert.equal(tracker.opportunityOutcomeFor(url.replace("/External/", "/Internal/")), undefined);
  const e = evidence({ screeningFor: tracker.decisionsFor });
  assert.equal(e({ ...priorJob, applyUrl: alias }).screening[0].detail, "Employer ownership not verified.");
});

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
  const policy = {...changes, removed: changes.removed.map(j => ({...j, reason: "pendingVerification" as const}))};
  assert.throws(() => assertCoverageSafe(assessCoverage(jobs, [], policy)));
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
    await writeFile(path.join(root, "data/source-licenses.json"), JSON.stringify({ repositories: [] }));
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
