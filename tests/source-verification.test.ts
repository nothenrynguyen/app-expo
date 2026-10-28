import assert from "node:assert/strict";
import test from "node:test";
import { buildSourceVerificationTargets, createSourceListingVerifier, sourceListingIsAllowed, sourceVerificationKey } from "../lib/ingestion/source-verification";
import { scopedListingIsLive, selectScopedChecks, type ScopedListingCache } from "../lib/ingestion/scoped-listing-cache";
import type { JobSource } from "../lib/source-catalog";
import type { CandidateJob } from "../lib/source-normalization";
import type { PublicJob } from "../lib/jobs";
import { jobIdentity } from "../lib/source-normalization";

const source: JobSource = { id: "guarded", name: "Guarded", kind: "keryx_markdown", repository: "test/repo", url: "https://example.com/feed", active: true, trustedCoverage: false, requireLiveListing: true };
const url = "https://employer.wd1.myworkdayjobs.com/External/job/NY/Engineer_JR-2501678";
const alias = "https://employer.wd5.myworkdayjobs.com/en-US/Other/job/NY/Changed-Slug_JR-2501678-1";
const candidate = { source: source.name, applyUrl: url } as CandidateJob;
const response = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;

test("source guard survives aliases, failed/empty feeds, attribution changes and stale evidence", () => {
  const initial = buildSourceVerificationTargets([source], [candidate], [], {});
  const key = sourceVerificationKey(url)!;
  assert.equal(sourceVerificationKey(alias), key);
  assert.equal(sourceVerificationKey("https://boards.greenhouse.io/employer/jobs/1234567"), sourceVerificationKey("https://job-boards.greenhouse.io/employer/jobs/1234567?gh_src=example"));
  assert.equal(sourceVerificationKey("https://jobs.smartrecruiters.com/Employer/123456"), sourceVerificationKey("https://jobs.smartrecruiters.com/Employer/123456-graduate-engineer"));
  assert.equal(sourceListingIsAllowed(alias, initial, new Set()), false);
  const persisted = buildSourceVerificationTargets([source], [], [{ applyUrl: alias, sources: ["Other feed"] } as PublicJob], initial);
  assert.equal(sourceListingIsAllowed(alias, persisted, new Set()), false);
  assert.equal(sourceListingIsAllowed(alias, persisted, new Set([key])), true);
  const now = new Date("2026-10-27T12:00:00Z");
  const cache: ScopedListingCache = { [key]: { status: "live", checkedAt: "2026-10-25T00:00:00Z", firstSeenAt: "2026-10-24T00:00:00Z" } };
  const verified = new Set(Object.keys(cache).filter(id => scopedListingIsLive(cache[id], now)));
  assert.equal(sourceListingIsAllowed(alias, persisted, verified), false);
  assert.equal(selectScopedChecks(Object.entries(persisted).map(([id, target]) => [id, target.url]), cache, now, 0).length, 0);
  assert.equal(sourceListingIsAllowed(alias, persisted, verified), false);
  assert.equal(sourceListingIsAllowed("https://other.example/job/1", persisted, verified), true);
  const retired = buildSourceVerificationTargets([{ ...source, active: false }], [], [], persisted);
  assert.equal(sourceListingIsAllowed(alias, retired, new Set()), false);
  assert.deepEqual(buildSourceVerificationTargets([{ ...source, active: false, requireLiveListing: false }], [], [], persisted), {});
});

test("prior source provenance restores a guard, and corrupt target state fails closed", () => {
  const targets = buildSourceVerificationTargets([source], [], [{ applyUrl: alias, sources: [source.name] } as PublicJob], {});
  assert.equal(sourceListingIsAllowed(url, targets, new Set()), false);
  assert.throws(() => buildSourceVerificationTargets([source], [], [], { invalid: { url, sourceIds: [source.id] } }), /Invalid persisted/);
  assert.throws(() => buildSourceVerificationTargets([source], [], [], [] as unknown as Parameters<typeof buildSourceVerificationTargets>[3]), /Invalid persisted/);
});

test("Workday verification requires matching requisition, title and explicit application flags", async () => {
  const good = { title: "Graduate Engineer", jobReqId: "JR-2501678", posted: true, canApply: true };
  for (const value of [url, alias]) assert.equal(await createSourceListingVerifier({ fetchImpl: response({ jobPostingInfo: good }) })(value), true);
  for (const change of [{ jobReqId: "JR-9999999" }, { canApply: false }, { posted: false }, { posted: undefined }, { title: "" }]) {
    assert.equal(await createSourceListingVerifier({ fetchImpl: response({ jobPostingInfo: { ...good, ...change } }) })(url), false);
  }
  assert.equal(await createSourceListingVerifier({ fetchImpl: response({}, 403) })(url), false);
  assert.equal(await createSourceListingVerifier({ fetchImpl: (async () => { throw new Error("timeout"); }) as typeof fetch })(url), false);
  assert.equal(await createSourceListingVerifier({ fetchImpl: response({}) })("https://example.com/jobs/1"), false);
  assert.equal(await createSourceListingVerifier({ fetchImpl: response({}) })(url.replace("https://", "https://user:password@")), false);
});

test("board checks require exact membership, reuse fetched evidence, and do not expand candidates", async () => {
  const lever = "https://jobs.lever.co/employer/abc";
  let calls = 0;
  const verify = createSourceListingVerifier({ fetchBoard: async () => { calls++; return { liveIdentities: new Set([jobIdentity(lever)!]) }; } });
  assert.equal(await verify(lever), true);
  assert.equal(await verify("https://jobs.lever.co/employer/def"), false);
  assert.equal(calls, 1);
  const existing = createSourceListingVerifier({ boardResults: new Map([["lever:api.lever.co:employer", { liveIdentities: new Set([jobIdentity(lever)!]) }]]), fetchBoard: async () => { throw new Error("Unexpected request"); } });
  assert.equal(await existing(lever), true);
  const failed = createSourceListingVerifier({ fetchBoard: async () => { throw new Error("403"); } });
  assert.equal(await failed(lever), false);
});

test("SmartRecruiters needs positive active metadata rather than a successful shell", async () => {
  const posting = "https://jobs.smartrecruiters.com/Employer/123456";
  assert.equal(await createSourceListingVerifier({ fetchImpl: response({ active: true, name: "Graduate Engineer" }) })(posting), true);
  for (const body of [{}, { active: false, name: "Graduate Engineer" }, { active: true, name: "" }]) {
    assert.equal(await createSourceListingVerifier({ fetchImpl: response(body) })(posting), false);
  }
});

test("Greenhouse detail can confirm a job after a board outage but rejects wrong IDs and closure", async () => {
  const posting = "https://boards.greenhouse.io/employer/jobs/1234567";
  assert.equal(await createSourceListingVerifier({ fetchImpl: response({ id: 1234567, title: "Graduate Engineer" }) })(posting), true);
  assert.equal(await createSourceListingVerifier({ fetchImpl: response({ id: 7654321, title: "Graduate Engineer" }) })(posting), false);
  assert.equal(await createSourceListingVerifier({ fetchImpl: response({}, 404) })(posting), false);
  assert.equal(await createSourceListingVerifier({ boardResults: new Map([["greenhouse:employer", { liveIdentities: new Set() }]]), fetchImpl: response({ id: 1234567, title: "Graduate Engineer" }) })(posting), false);
});
