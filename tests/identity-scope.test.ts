import assert from "node:assert/strict";
import test from "node:test";
import type { PublicJob } from "../lib/jobs";
import { classifyRoleTags, getJobRoleTags } from "../lib/role-areas";
import { workdayOpportunityIdentity } from "../lib/workday-identity";
import { deduplicateCrossSourceJobs } from "../lib/job-dedup";
import { preserveWorkdayJobIds, collectJobIdAliases } from "../lib/ingestion/preserve-job-ids";
import { buildListingChanges } from "../lib/ingestion/listing-changes";
import { assessCoverage } from "../lib/ingestion/coverage-guard";
import { registerJobIdAliases, canonicalJobId, jobIdAliasesVersion, resolveSnapshotJobIds } from "../lib/job-id-aliases";
import { parseSavedJobIds, toggleSavedJobId } from "../lib/saved-jobs";
import { parseApplicationStatuses } from "../lib/application-status";
import { parseSavedJobDetails, missingSavedDetails } from "../lib/saved-job-details";
import { parseApplications, markSavedJobApplied } from "../lib/applications";
import { opportunityIdentity } from "../lib/source-normalization";
import { preserveLastKnownGoodJobs } from "../lib/ingestion/last-known-good";

const url = (id = "R10258160", site = "External", host = "ngc.wd1.myworkdayjobs.com", locale = "") => `https://${host}/${locale}${site}/job/United-States/Software-Engineer_${id}`;
const job = (id: string, applyUrl = url()): PublicJob => ({ id, applyUrl, company: "Employer", title: "Software Engineer I", location: "Austin, TX", category: "New grad", term: "Not stated", workMode: "unknown", postedAt: "2026-10-29T00:00:00Z", postedAtSource: "exact", linkedInUrl: null, salary: null, sources: ["Test"], verifiedCompany: true });

test("People, Legal and lab operations cannot gain broad Operations eligibility, including old tags", () => {
  for (const title of ["People Operations Generalist", "People Operations Analyst", "Legal Operations Analyst", "Legal Operations Associate", "Talent Acquisition Operations Coordinator", "Human Resources Operations Intern", "Lab Operations Assistant", "Clinical Operations Coordinator"]) {
    assert.deepEqual(classifyRoleTags({ title, category: "New grad" }), [], title);
    assert.deepEqual(getJobRoleTags({ title, category: "New grad", roleTags: ["operations-supply-chain"] }), [], title);
  }
  for (const [title, tag] of [["Human Resources Intern, HR Analytics", "analytics"], ["AI Solutions Engineer, Talent Acquisition", "ai-ml-engineering"], ["Software Engineer, Clinical Operations", "software-engineering"], ["Supply Chain Operations Analyst", "operations-supply-chain"], ["TDS Clinical Supply Chain Planning Co-Op", "operations-supply-chain"], ["Logistics Engineer I", "operations-supply-chain"]] as const) {
    assert.ok(classifyRoleTags({ title, category: "New grad" }).includes(tag), title);
  }
});

test("Workday opportunity aliases require exact host, site and complete requisition", () => {
  for (const req of ["R10258160", "R10257986", "R10258192", "JR-2604163", "REQ-2026-18618", "JR37472-1"]) {
    assert.equal(workdayOpportunityIdentity(url(req)), workdayOpportunityIdentity(url(req, "external", undefined, "en-US/")));
  }
  const key = workdayOpportunityIdentity(url());
  for (const other of [url("R10258161"), url(undefined, "Internal"), url(undefined, undefined, "ngc.wd5.myworkdayjobs.com"), url(undefined, undefined, "other.wd1.myworkdayjobs.com")]) assert.notEqual(key, workdayOpportunityIdentity(other));
  assert.notEqual(opportunityIdentity(url("JR123-unknown")), opportunityIdentity(url("JR123-unknown", "Internal")));
  for (const invalid of [url().replace("https:", "http:"), url().replace("https://", "https://user:pass@"), "https://example.com/External/job/US/Title_R10258160", "https://ngc.wd1.myworkdayjobs.com/External/job/Title_R10258160", url().replace("R10258160", "unknown")]) assert.equal(workdayOpportunityIdentity(invalid), null);
});

test("Workday aliases and title corrections retain IDs; distinct sites and requisitions remain separate", () => {
  const old = job("prior-id");
  const changed = { ...job("generated-id", url(undefined, "external", undefined, "en-US/")), title: "Corrected title", company: "Corrected employer" };
  const [retained] = preserveWorkdayJobIds([changed], [old]);
  assert.ok(retained.previousIds?.includes(old.id));
  assert.ok(!retained.previousIds?.includes("generated-id"));
  assert.equal(preserveWorkdayJobIds([retained], [retained])[0].id, retained.id);
  assert.equal(preserveWorkdayJobIds([changed], [])[0].id, retained.id);
  assert.equal(deduplicateCrossSourceJobs([old, changed]).length, 1);
  assert.equal(deduplicateCrossSourceJobs([old, job("site", url(undefined, "Internal")), job("req", url("R10258161"))]).length, 3);
  const jrExternal = job("jr-external", url("JR12345"));
  const jrInternal = job("jr-internal", url("JR12345", "Internal"));
  assert.notEqual(opportunityIdentity(jrExternal.applyUrl), opportunityIdentity(jrInternal.applyUrl));
  const current = new Map([[opportunityIdentity(jrExternal.applyUrl)!, jrExternal]]);
  assert.equal(preserveLastKnownGoodJobs(current, [jrInternal], j => j), 1);
  assert.equal(current.size, 2);
  const differentSites = preserveWorkdayJobIds([{...jrExternal, id: "unpublished-provisional-id"}, {...jrInternal, id: "unpublished-provisional-id"}], []);
  assert.notEqual(differentSites[0].id, differentSites[1].id);
  assert.deepEqual(collectJobIdAliases(differentSites, {}), {});
  assert.throws(() => collectJobIdAliases([{...job("target-a"), previousIds: ["conflict"]}, {...job("target-b"), previousIds: ["conflict"]}], {}), /Conflicting/);
  assert.equal(preserveLastKnownGoodJobs(current, [{ ...jrExternal, applyUrl: url("JR12345", "external", undefined, "en-US/") }], j => j), 0);
  const external = job("current-id", url(undefined, "northrop_grumman_external_site", undefined, "en-US/"));
  assert.ok(preserveWorkdayJobIds([external], [external])[0].previousIds?.includes("497acd3e95f7a3331ad560b4"));
});

test("alias URL changes do not become lost opportunities or trip coverage guards, but closures remain removals", () => {
  const previous = Array.from({ length: 60 }, (_, i) => job(`prior-${i}`, url(`R${100000 + i}`)));
  const current = previous.map(j => ({ ...j, applyUrl: j.applyUrl.replace("/External/", "/en-US/external/") }));
  const input = { generatedAt: "2026-10-30T00:00:00Z", previousGeneratedAt: null, previous, current, acceptedBeforeDedup: current, candidateUrls: current.map(j => j.applyUrl), outcomeFor: () => undefined, boardState: () => null };
  const changes = buildListingChanges(input);
  assert.equal(changes.added, 0); assert.equal(changes.removedCount, 0);
  assert.equal(changes.urlChanges.length, 60);
  assert.equal(assessCoverage(previous, current, changes)[1].blocked, false);
  const aliasRows = Array.from({ length: 60 }, (_, i) => job(`duplicate-${i}`, url().replace("Software-Engineer", `Title-${i}`)));
  const compact = [aliasRows[0]];
  const compactChanges = buildListingChanges({ ...input, previous: aliasRows, current: compact });
  assert.equal(assessCoverage(aliasRows, compact, compactChanges)[1].blocked, false);
  const closed = buildListingChanges({ ...input, current: current.slice(1), acceptedBeforeDedup: current.slice(1), outcomeFor: () => "closed" });
  assert.equal(closed.removedCount, 1); assert.equal(closed.counts.closed, 1);
});

test("saved aliases retain status, details and tracker notes without requiring storage writes", () => {
  // The static compatibility map covers a hard reload/direct tracker visit,
  // before any board snapshot registers its runtime aliases.
  const oldPublishedId = "497acd3e95f7a3331ad560b4";
  const [published] = preserveWorkdayJobIds([job("unused", url(undefined, "northrop_grumman_external_site"))], []);
  assert.deepEqual(parseSavedJobIds(JSON.stringify([oldPublishedId])), [published.id]);
  assert.equal(resolveSnapshotJobIds([job(oldPublishedId)])[0].id, published.id);
  const current = { ...job("alias-current"), previousIds: ["alias-old"] };
  const rawSave = '["alias-old"]';
  assert.equal(registerJobIdAliases([current]), true);
  const version = jobIdAliasesVersion();
  assert.equal(registerJobIdAliases([current]), false); assert.equal(jobIdAliasesVersion(), version);
  const ids = parseSavedJobIds(rawSave);
  assert.deepEqual(ids, [current.id]); assert.equal(rawSave, '["alias-old"]');
  assert.equal(resolveSnapshotJobIds([job("alias-old"), current]).length, 1);
  assert.deepEqual(toggleSavedJobId(ids, current.id), []);
  assert.deepEqual(parseApplicationStatuses('{"alias-old":"Applied"}'), { "alias-current": "Applied" });
  assert.deepEqual(parseApplicationStatuses('{"alias-current":"Interviewing","alias-old":"Applied"}'), { "alias-current": "Interviewing" });
  const details = parseSavedJobDetails(JSON.stringify([{id: "alias-old", title: "Prior title", company: "Employer", collection: "fulltime"}]));
  assert.equal(missingSavedDetails(details, new Set(ids), [current], "fulltime").length, 0);
  const records = parseApplications(JSON.stringify([{id: "record-untouched", jobId: "alias-old", origin: "app-expo", company: "Employer", title: "Prior title", location: "Austin", url: url(), status: "Applied", appliedOn: "2026-10-29", notes: "Keep my notes"}]));
  assert.equal(records[0].jobId, current.id); assert.equal(records[0].id, "record-untouched");
  assert.equal(records[0].notes, "Keep my notes"); assert.equal(records[0].appliedOn, "2026-10-29");
  assert.equal(markSavedJobApplied(records, current).length, 1);
  registerJobIdAliases([{...job("collision-a"), previousIds: ["ambiguous-old"]}, {...job("collision-b"), previousIds: ["ambiguous-old"]}]);
  assert.equal(canonicalJobId("ambiguous-old"), "ambiguous-old");
});
