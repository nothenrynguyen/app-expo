import assert from "node:assert/strict";
import test from "node:test";
import { createApplicationBackup, mergeApplicationBackup, readApplicationBackup } from "../lib/application-backup";
import type { Application } from "../lib/applications";
const record: Application = { id: "one", company: "Example", title: "Engineer", url: "https://example.com/job", status: "Applied", appliedOn: "2026-09-20", notes: "Private note", origin: "manual" };
test("backups round-trip all tracker fields and reject unsupported formats without partial imports", () => {
  assert.deepEqual(readApplicationBackup(createApplicationBackup([record])), [record]);
  assert.throws(() => readApplicationBackup("bad"), /valid JSON/);
  assert.throws(() => readApplicationBackup(JSON.stringify({ format: "app-expo-applications", version: 2, applications: [record] })), /version 1/);
  assert.throws(() => readApplicationBackup(createApplicationBackup([record, { ...record, id: "two", url: "javascript:bad" }])), /invalid records/);
  assert.throws(() => readApplicationBackup(createApplicationBackup([record, record])), /repeated IDs/);
});
test("merge preserves existing values, skips board duplicates and retains distinct manual applications", () => {
  const board: Application = { ...record, id: "board:a", origin: "app-expo", jobId: "a" };
  const incoming = [{ ...record, notes: "Overwrite attempt" }, { ...board, id: "board:another" }, { ...record, id: "manual-two" }];
  const merged = mergeApplicationBackup([record, board], incoming);
  assert.equal(merged.added, 1);
  assert.equal(merged.skipped, 2);
  assert.equal(merged.applications[0].notes, "Private note");
  assert.equal(mergeApplicationBackup(merged.applications, incoming).added, 0);
});
test("oversized backups and malformed dates are rejected", () => {
  assert.throws(() => readApplicationBackup(" ".repeat(5 * 1024 * 1024 + 1)), /too large/);
  assert.throws(() => readApplicationBackup(createApplicationBackup([{ ...record, appliedOn: "2026-02-30" }])), /invalid records/);
});
