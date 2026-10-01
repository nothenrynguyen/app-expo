import assert from "node:assert/strict";
import test from "node:test";
import { importSavedApplications, parseApplications, safeApplicationUrl, validApplicationDate } from "../lib/applications";
const record = { id: "manual-1", company: "Example", title: "Engineer", url: "https://example.com/job", status: "Applied", appliedOn: "2026-09-15", notes: "Interview next week", origin: "manual" };
test("saved imports preserve maximum retained fields after reloading and ignore inherited status values", () => {
  const job = { id: "constructor", company: "c".repeat(1000), title: "t".repeat(2000), collection: "internships" as const };
  const imported = importSavedApplications([], [job], new Set([job.id]), {});
  assert.equal(imported[0].status, "Saved");
  assert.deepEqual(parseApplications(JSON.stringify(imported)), imported);
  const longest = { ...job, id: "j".repeat(500) };
  const records = importSavedApplications([], [longest], new Set([longest.id]), {});
  assert.deepEqual(parseApplications(JSON.stringify(records)), records);
});
test("manual records round-trip including dates and notes, while invalid links are rejected", () => {
  assert.equal(parseApplications(JSON.stringify([record]))[0].notes, record.notes);
  assert.deepEqual(parseApplications(JSON.stringify([{ ...record, url: "javascript:alert(1)" }])), []);
  assert.equal(safeApplicationUrl("https://user:password@example.com"), null);
  assert.equal(safeApplicationUrl(""), "");
  assert.equal(validApplicationDate("2026-02-30"), false);
  assert.equal(validApplicationDate("2024-02-29"), true);
  assert.equal(validApplicationDate(""), true);
});
test("saved import deduplicates by board identity and never invents an applied date", () => {
  const details = [{ id: "job", company: "Example", title: "Engineer", collection: "internships" as const }];
  const first = importSavedApplications([], details, new Set(["job"]), { job: "Interviewing" });
  assert.equal(first[0].status, "Interviewing");
  assert.equal(first[0].appliedOn, "");
  assert.deepEqual(importSavedApplications(first, details, new Set(["job"]), {}), first);
  assert.equal(importSavedApplications([], details, new Set(), {}).length, 0);
});
