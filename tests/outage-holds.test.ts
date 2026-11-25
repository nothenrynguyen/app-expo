import assert from "node:assert/strict";
import test from "node:test";
import { allSnapshotJobs, type PublicJob, type JobsSnapshot } from "../lib/jobs";
import { buildOutageHolds, validateOutageHolds } from "../lib/ingestion/outage-holds";
import { buildListingChanges } from "../lib/ingestion/listing-changes";
import { createListingChangeEvidence } from "../lib/ingestion/listing-change-evidence";
import { assessCoverage, assertCoverageSafe } from "../lib/ingestion/coverage-guard";
import { lastVerificationAt, canRestoreHeldJob } from "../lib/ingestion/last-verification";
import { workdayEvidenceKey } from "../lib/ingestion/workday-continuity";
import { buildJobsSummary } from "../lib/job-summary";
import { jobIdentity, opportunityIdentity } from "../lib/source-normalization";
import { recentRecoveryDenials, type RecoveryState } from "../lib/ingestion/employer-recovery";
import { createSnapshotPoller } from "../lib/snapshot-polling";
import { retainSavedDetails, missingSavedDetails } from "../lib/saved-job-details";
import { availabilityInventory } from "../lib/ingestion/availability-inventory";

const now = new Date("2026-11-17T23:00:00Z");
const job = (i = 1): PublicJob => ({id: `outage-${i}`, company: "Example", title: "Software Engineer Intern",
  category: "Internship", term: "Summer 2027", location: "Austin, TX", workMode: "unknown",
  postedAt: "2026-11-10T00:00:00Z", postedAtSource: "date_only", salary: null, linkedInUrl: null,
  applyUrl: `https://example.wd1.myworkdayjobs.com/External/job/USA/Software-Engineer-Intern_JR${i}`,
  sources: ["Feed"], verifiedCompany: true, lastVerifiedAt: "2026-11-15T12:00:00Z"});
const board = {id: "workday:example.wd1.myworkdayjobs.com:external", provider: "workday" as const,
  key: "example/External", company: "Example", status: "failed" as const, rows: 0, durationMs: 0,
  outcome: "cooldown" as const, message: "Cooldown after 429 Too Many Requests"};
type EvidenceInput = Parameters<typeof createListingChangeEvidence>[0];
function changes(previous: PublicJob[], current: PublicJob[] = [], override: Partial<EvidenceInput> = {},
  outcome: Parameters<typeof buildListingChanges>[0]["outcomeFor"] = () => "pendingVerification") {
  return buildListingChanges({generatedAt: now.toISOString(), previousGeneratedAt: "2026-11-16T00:00:00Z",
    previous, current, acceptedBeforeDedup: current, candidateUrls: [], outcomeFor: outcome, boardState: () => "unavailable",
    evidenceFor: createListingChangeEvidence({startedAt: now, generatedAt: now.toISOString(), listingHealth: {},
      workdayChecks: [], boardRegistry: [board], boardResults: new Map(), sourceDiagnostics: [], retired: new Set(), ...override})});
}

test("outage holds preserve IDs and positive timestamps without renewing verification", () => {
  const prior = job(), report = changes([prior]);
  const holds = buildOutageHolds([prior], report, now);
  assert.equal(holds.length, 1);
  assert.equal(holds[0].id, prior.id);
  assert.equal(holds[0].verification?.lastVerifiedAt, prior.lastVerifiedAt);
  assert.equal(holds[0].verification?.since, now.toISOString());
  validateOutageHolds([prior], [], holds, report, now);
  assert.throws(() => validateOutageHolds([prior], [], [{...holds[0], lastVerifiedAt: now.toISOString()}], report, now), /Unproven/);
  assert.throws(() => validateOutageHolds([prior], [prior], holds, report, now), /Unproven/);
  const tomorrow = new Date(now.getTime() + 86400000);
  const again = buildOutageHolds(holds, changes(holds), tomorrow);
  assert.equal(again[0].verification?.since, now.toISOString());
  assert.equal(again[0].verification?.lastVerifiedAt, prior.lastVerifiedAt);
  assert.equal(buildOutageHolds(holds, changes(holds, [{...prior, lastVerifiedAt: now.toISOString()}]), now).length, 0);
});

test("recent exact recovery denials retain internal holds without granting current availability", () => {
  const prior = job(), checkedAt = new Date(now.getTime() - 3600_000).toISOString();
  const seeds = [{company:prior.company,url:prior.applyUrl}];
  const denials = recentRecoveryDenials(seeds, {[opportunityIdentity(prior.applyUrl)!]:{status:"unknown",accessDenied:true,checkedAt}}, now);
  const report = changes([prior], [], {boardRegistry:[], recoveryDenials:denials}, () => undefined);
  assert.equal(report.removedOpportunities[0].category, "source-unavailable");
  assert.equal(report.removedOpportunities[0].evidence?.recoveryDenial?.checkedAt, checkedAt);
  const holds = buildOutageHolds([prior], report, now);
  assert.equal(holds.length, 1);
  assert.equal(holds[0].id, prior.id);
  assert.equal(holds[0].lastVerifiedAt, prior.lastVerifiedAt);
  assert.equal(holds[0].verification?.source, "Employer recovery");
  validateOutageHolds([prior], [], holds, report, now);
  assert.equal(availabilityInventory([prior], holds, {}).length, 0);
  assert.equal(canRestoreHeldJob(holds[0], prior.lastVerifiedAt!, now), false);
  for (const reason of ["role", "location", "employer", "expired", "source-permission"] as const)
    assert.equal(buildOutageHolds([prior], changes([prior], [], {boardRegistry:[],recoveryDenials:denials}, () => reason), now).length, 0);
  assert.equal(buildOutageHolds([prior], changes([prior], [], {boardRegistry:[],recoveryDenials:denials,
    workdayChecks:[{url:prior.applyUrl,status:"live"}]}, () => undefined), now).length, 0);
});

test("recovery denial holds reject stale, future, generic, cross-site and unproven records", () => {
  const prior = job(), identity = opportunityIdentity(prior.applyUrl)!;
  const seeds = [{company:prior.company,url:prior.applyUrl}];
  for (const entry of [
    {status:"unknown",accessDenied:true,checkedAt:new Date(now.getTime()-24*3600_000).toISOString()},
    {status:"unknown",accessDenied:true,checkedAt:new Date(now.getTime()+1).toISOString()},
    {status:"unknown",accessDenied:true,checkedAt:"invalid"},
    {status:"unknown",checkedAt:now.toISOString()},
    {status:"live",accessDenied:true,checkedAt:now.toISOString()},
  ] as RecoveryState[string][]) assert.equal(recentRecoveryDenials(seeds, {[identity]:entry}, now).size, 0);
  const entry = {status:"unknown" as const,accessDenied:true,checkedAt:now.toISOString()};
  assert.equal(recentRecoveryDenials(seeds, {[jobIdentity(prior.applyUrl)!]:entry}, now).size, 0);
  const foreign = prior.applyUrl.replace("/External/", "/Internal/");
  assert.equal(recentRecoveryDenials(seeds, {[opportunityIdentity(foreign)!]:entry}, now).size, 0);
  const forged = new Map([[identity,{url:foreign,checkedAt:now.toISOString()}]]);
  assert.equal(buildOutageHolds([prior], changes([prior], [], {boardRegistry:[],recoveryDenials:forged}, () => undefined), now).length, 0);
});

test("closures, policy exclusions, positive conflicts and unexplained loss never become outage holds", () => {
  const prior = job();
  for (const status of ["closed", "ineligible", "live"] as const) {
    assert.equal(buildOutageHolds([prior], changes([prior], [], {workdayChecks: [{url: prior.applyUrl, status}]}), now).length, 0);
  }
  for (const reason of ["role", "location", "employer", "expired", "source-permission"] as const) {
    assert.equal(buildOutageHolds([prior], changes([prior], [], {}, () => reason), now).length, 0);
  }
  assert.equal(buildOutageHolds([prior], changes([prior], [], {retired: new Set([board.id])}), now).length, 0);
  assert.equal(buildOutageHolds([prior], changes([prior], [], {boardRegistry: []}), now).length, 0);
  assert.equal(buildOutageHolds([prior], changes([prior], [], {boardRegistry: [{...board, message: "404 Not Found", outcome: "unavailable"}]}), now).length, 0);
  const foreign = {...job(2), applyUrl: prior.applyUrl.replace("example.wd1", "other.wd1")};
  assert.equal(buildOutageHolds([foreign], changes([foreign]), now).length, 0);
});

test("coverage tracks proven holds while still blocking unexplained disappearances", () => {
  const previous = Array.from({length: 100}, (_, i) => job(i));
  const current = Array.from({length: 12}, (_, i) => job(i + 200));
  const proposal = changes(previous, current);
  assert.throws(() => assertCoverageSafe(assessCoverage(previous, current, proposal)), /Refusing/);
  const holds = buildOutageHolds(previous, proposal, now);
  validateOutageHolds(previous, current, holds, proposal, now);
  const tracked = [...current, ...holds];
  assert.doesNotThrow(() => assertCoverageSafe(assessCoverage(previous, tracked, changes(previous, tracked))));
  const unexplained = changes(previous, current, {boardRegistry: []}, () => undefined);
  assert.equal(buildOutageHolds(previous, unexplained, now).length, 0);
  assert.throws(() => validateOutageHolds(previous, current, holds, unexplained, now), /Unproven/);
  assert.throws(() => assertCoverageSafe(assessCoverage(previous, current, unexplained)), /Refusing/);
});

test("summary, polling and saved details keep current and held jobs separate", async () => {
  const active = job(2), held = buildOutageHolds([job()], changes([job()]), now)[0];
  const snapshot: JobsSnapshot = {generatedAt: now.toISOString(), jobs: [active], awaitingVerification: [held], sourceHealth: [], quarantinedCount: 0};
  const summary = buildJobsSummary(snapshot);
  assert.equal(summary.totalJobs, 1);
  assert.equal(summary.internships, 1);
  assert.equal(summary.awaitingVerification?.internships, 1);
  const ids = new Set([held.id]);
  const details = retainSavedDetails([], ids, allSnapshotJobs(snapshot), "internships");
  assert.equal(details[0].title, held.title);
  assert.equal(missingSavedDetails(details, ids, allSnapshotJobs(snapshot), "internships").length, 0);
  let received: JobsSnapshot | undefined;
  const poller = createSnapshotPoller({type: "internships", isVisible: () => true,
    fetcher: async () => Response.json(snapshot), onInitialError: () => assert.fail("unexpected error"), onSnapshot: value => {received = value;}});
  await poller.refresh(); poller.stop();
  assert.equal(received?.jobs.length, 1);
  assert.equal(received?.awaitingVerification?.[0].id, held.id);
  assert.equal(received?.awaitingVerification?.[0].verification?.lastVerifiedAt, held.lastVerifiedAt);
});

test("verification time is never inferred from publication or cross-site Workday caches", () => {
  const prior = {...job(), lastVerifiedAt: undefined};
  const input = {workdayCache: {}, recoveryState: {}, listingHealth: {}, scopedCache: {}, boardResults: new Map()};
  assert.equal(lastVerificationAt(prior, now, input), null);
  assert.equal(lastVerificationAt(prior, now, {...input, scopedCache: {[jobIdentity(prior.applyUrl)!]: {
    status: "live", checkedAt: now.toISOString(), firstSeenAt: now.toISOString()}}}), null);
  const verified = "2026-11-16T12:00:00Z";
  assert.equal(lastVerificationAt(prior, now, {...input, workdayCache: {[workdayEvidenceKey(prior.applyUrl)!]: {checkedAt: verified, job: prior}}}), verified);
  assert.equal(lastVerificationAt(prior, now, {...input, workdayCache: {[workdayEvidenceKey(prior.applyUrl)!]: {checkedAt: "2027-01-01T00:00:00Z", job: prior}}}), null);
  assert.equal(lastVerificationAt(prior, now, {...input, workdayChecks: [{url: prior.applyUrl, status: "live"}]}), now.toISOString());
});

test("restoration requires a positive check after the last outage observation", () => {
  const held = buildOutageHolds([job()], changes([job()]), now)[0];
  const later = new Date(now.getTime() + 3600000);
  assert.equal(canRestoreHeldJob(held, null, later), false);
  assert.equal(canRestoreHeldJob(held, held.lastVerifiedAt ?? null, later), false);
  assert.equal(canRestoreHeldJob(held, now.toISOString(), later), false);
  assert.equal(canRestoreHeldJob(held, later.toISOString(), later), true);
  assert.equal(canRestoreHeldJob(held, new Date(later.getTime() + 1000).toISOString(), later), false);
  assert.equal(canRestoreHeldJob(held, later.toISOString(), new Date(later.getTime() + 86400000)), false);
});

test("known saved-ID aliases cannot inflate counts or bypass a held opportunity", () => {
  const canonical = job(), alias = {...job(2), id: "legacy", title: "Alternate source title"};
  const aliases = {legacy: canonical.id};
  const current = availabilityInventory([alias, canonical], [], aliases);
  assert.equal(current.length, 1);
  assert.equal(current[0].id, canonical.id);
  assert.equal(current[0].title, canonical.title);
  assert.ok(current[0].previousIds?.includes("legacy"));
  const held = buildOutageHolds([canonical], changes([canonical]), now);
  assert.equal(availabilityInventory([alias], held, aliases).length, 0);
});
