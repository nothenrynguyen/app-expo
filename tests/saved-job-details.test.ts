import assert from "node:assert/strict";
import test from "node:test";
import { missingSavedDetails, parseSavedJobDetails, retainSavedDetails } from "../lib/saved-job-details";
import type { PublicJob } from "../lib/jobs";

const job = { id: "one", company: "Example", title: "Engineer" } as PublicJob;
test("saved details survive feed removal and remain scoped to their collection", () => {
  const ids = new Set(["one"]);
  const details = retainSavedDetails([], ids, [job], "internships");
  assert.equal(missingSavedDetails(details, ids, [job], "internships").length, 0);
  assert.deepEqual(retainSavedDetails(details, ids, [], "internships"), details);
  assert.equal(missingSavedDetails(details, ids, [], "internships").length, 1);
  assert.equal(missingSavedDetails(details, ids, [], "fulltime").length, 0);
  assert.deepEqual(retainSavedDetails(details, new Set(), [], "internships"), []);
});
test("legacy IDs receive details from current listings and updates prefer fresh titles", () => {
  const ids = new Set(["one"]);
  const old = retainSavedDetails([], ids, [job], "fulltime");
  const fresh = retainSavedDetails(old, ids, [{ ...job, title: "Updated" }], "fulltime");
  assert.equal(fresh[0].title, "Updated");
  assert.deepEqual(retainSavedDetails([], ids, [], "fulltime"), []);
});
test("stored details reject corruption and discard extra fields such as application URLs", () => {
  assert.deepEqual(parseSavedJobDetails("bad"), []);
  assert.deepEqual(parseSavedJobDetails('{"id":"one"}'), []);
  const parsed = parseSavedJobDetails(JSON.stringify([{ ...job, collection: "internships", applyUrl: "javascript:bad" }, { id: 42 }]));
  assert.deepEqual(parsed, [{ ...job, collection: "internships" }]);
});
