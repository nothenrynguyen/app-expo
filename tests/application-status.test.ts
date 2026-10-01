import assert from "node:assert/strict";
import test from "node:test";
import { matchesApplicationStatus, parseApplicationStatuses } from "../lib/application-status";

test("legacy saved IDs default to Saved and status filters match only the chosen status", () => {
  const statuses = { tracked: "Applied" as const };
  assert.equal(matchesApplicationStatus("legacy", statuses, "Saved"), true);
  assert.equal(matchesApplicationStatus("legacy", statuses, "Applied"), false);
  assert.equal(matchesApplicationStatus("tracked", statuses, "Applied"), true);
  assert.equal(matchesApplicationStatus("tracked", statuses, "All"), true);
  assert.equal(matchesApplicationStatus("tracked", statuses, "Rejected"), false);
  assert.equal(matchesApplicationStatus("constructor", statuses, "Saved"), true);
});

test("application status storage rejects malformed and unsupported records", () => {
  for (const raw of [null, "bad", "[]", "42"]) assert.deepEqual(parseApplicationStatuses(raw), {});
  assert.deepEqual(parseApplicationStatuses('{"job-1":"Applied","job-2":"Interviewing","job-3":"unknown","":"Saved"}'), { "job-1": "Applied", "job-2": "Interviewing" });
});
test("status parsing preserves safe own keys without prototype mutation", () => {
  const statuses = parseApplicationStatuses('{"__proto__":"Offered","constructor":"Rejected"}');
  assert.equal(Object.getPrototypeOf(statuses), Object.prototype);
  assert.equal(statuses["__proto__"], "Offered");
});
