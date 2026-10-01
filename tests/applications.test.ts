import assert from "node:assert/strict";
import test from "node:test";
import { importSavedApplications, parseApplications, safeApplicationUrl, validApplicationDate } from "../lib/applications";
const record = { id: "manual-1", company: "Example", title: "Engineer", url: "https://example.com/job", status: "Applied", appliedOn: "2026-09-15", notes: "Interview next week", origin: "manual" };
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
