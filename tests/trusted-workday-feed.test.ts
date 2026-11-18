import { test } from "node:test";
import assert from "node:assert/strict";
import { trustedWorkdayFeedPolicy } from "../lib/ingestion/trusted-workday-feed";
import type { CandidateJob } from "../lib/source-normalization";
import type { JobSource } from "../lib/source-catalog";
import type { BoardRefreshDiagnostic } from "../lib/ingestion/types";
import { employerBoardIdentity } from "../lib/ingestion/reviewed-employer-coverage";

const now = new Date("2026-11-18T01:00:00Z");
const candidate: CandidateJob = { company: "Acme", title: "Software Engineer Intern", location: "Los Angeles, CA",
  term: "Summer 2027", category: "Internship", workMode: "in_person", postedAt: "2026-11-17T00:00:00Z",
  postedAtSource: "date_only", source: "Reviewed feed", salary: null, rawText: "Software Engineer Intern",
  applyUrl: "https://acme.wd5.myworkdayjobs.com/en-US/External/job/USA/Software-Intern_JR12345" };
const source: JobSource = { id: "feed", name: candidate.source, repository: "owner/repo", url: "https://example.com",
  kind: "markdown", active: true, trustedCoverage: false, workdayFeedFallback: true };
const board: BoardRefreshDiagnostic = { id: employerBoardIdentity(candidate.applyUrl)!, provider: "workday", key: "acme",
  company: candidate.company, status: "failed", outcome: "rate_limited", rows: 0, durationMs: 0, message: "429 Too Many Requests" };
const input = { sources: [source], candidates: [candidate], diagnostics: [{ name: source.name, kind: "markdown" as const,
  status: "ok" as const, rows: 1, requestCount: 1, durationMs: 0 }], boards: [board], state: {}, now };

test("a current opted-in feed grants availability evidence during an exact-site outage, not employer verification", () => {
  const policy = trustedWorkdayFeedPolicy(input);
  assert.deepEqual(policy.evidenceFor(candidate), { kind: "trusted-feed", source: source.name,
    observedAt: now.toISOString(), expiresAt: "2026-11-25T01:00:00.000Z" });
  assert.equal(candidate.lastVerifiedAt, undefined);
  assert.equal("verifiedCompany" in candidate, false);
  assert.equal(trustedWorkdayFeedPolicy({ ...input, sources: [{ ...source, workdayFeedFallback: false }] }).evidenceFor(candidate), undefined);
  assert.equal(trustedWorkdayFeedPolicy({ ...input, sources: [{ ...source, active: false }] }).evidenceFor(candidate), undefined);
  assert.equal(trustedWorkdayFeedPolicy({ ...input, diagnostics: [{ ...input.diagnostics[0], status: "failed" }] }).evidenceFor(candidate), undefined);
  assert.equal(trustedWorkdayFeedPolicy({ ...input, diagnostics: [{ ...input.diagnostics[0], outcome: "partial" }] }).evidenceFor(candidate), undefined);
});

test("successful, absent, terminal and different Workday sites cannot create outage fallback", () => {
  for (const boards of [[], [{ ...board, status: "ok" as const, outcome: "healthy" as const }],
    [{ ...board, message: "404 Not Found" }], [{ ...board, id: board.id!.replace("external", "internal") }]]) {
    assert.equal(trustedWorkdayFeedPolicy({ ...input, boards }).evidenceFor(candidate), undefined);
  }
  const closed = { ...candidate, sourceActive: false };
  assert.equal(trustedWorkdayFeedPolicy({ ...input, candidates: [closed] }).evidenceFor(closed), undefined);
  const notWorkday = { ...candidate, applyUrl: "https://example.com/jobs/JR12345" };
  assert.equal(trustedWorkdayFeedPolicy({ ...input, candidates: [notWorkday] }).evidenceFor(notWorkday), undefined);
});

test("unchanged fetches, new dates, renamed jobs and different feeds never renew the fixed observation deadline", () => {
  const initial = trustedWorkdayFeedPolicy(input);
  const next = { ...candidate, title: "Renamed intern", postedAt: "2026-11-26T00:00:00Z", source: "Other reviewed feed" };
  const later = trustedWorkdayFeedPolicy({ ...input, sources: [{ ...source, name: next.source }],
    diagnostics: [{ ...input.diagnostics[0], name: next.source }], candidates: [next], state: initial.state,
    now: new Date("2026-11-26T01:00:00Z") });
  assert.equal(later.evidenceFor(next), undefined);
  assert.deepEqual(later.state, initial.state);
  assert.equal(later.counts.expired, 1);
});

test("old, future or invalid source dates are rejected and unknown dates have at most three days", () => {
  for (const postedAt of ["2026-09-01T00:00:00Z", "2026-12-01T00:00:00Z", "invalid"]) {
    const row = { ...candidate, postedAt };
    assert.equal(trustedWorkdayFeedPolicy({ ...input, candidates: [row] }).evidenceFor(row), undefined);
  }
  const row = { ...candidate, postedAtSource: "first_seen" as const };
  const initial = trustedWorkdayFeedPolicy({ ...input, candidates: [row] });
  assert.equal(initial.evidenceFor(row)?.expiresAt, "2026-11-21T01:00:00.000Z");
  assert.equal(trustedWorkdayFeedPolicy({ ...input, candidates: [row], state: initial.state,
    now: new Date("2026-11-21T01:00:00Z") }).evidenceFor(row), undefined);
  assert.throws(() => trustedWorkdayFeedPolicy({ ...input, state: { invalid: { firstSeenAt: now.toISOString(), expiresAt: now.toISOString() } } }), /Invalid/);
});
