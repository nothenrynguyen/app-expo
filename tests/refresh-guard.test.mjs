import assert from "node:assert/strict";
import test from "node:test";
import { refreshNeeded } from "../scripts/check-refresh-needed.mjs";

const now = Date.parse("2026-10-26T12:37:00Z");
test("workflow skips a queued duplicate only after its slot has been generated", () => {
  assert.equal(refreshNeeded("2026-10-26T12:20:00Z", "workflow_dispatch", "2026-10-26T12:17:00.000Z", now), false);
  assert.equal(refreshNeeded("2026-10-26T11:20:00Z", "workflow_dispatch", "2026-10-26T12:17:00.000Z", now), true);
});
test("manual refresh remains available while backup cron avoids recent ingestion", () => {
  assert.equal(refreshNeeded("2026-10-26T12:20:00Z", "workflow_dispatch", "", now), true);
  assert.equal(refreshNeeded("2026-10-26T12:20:00Z", "schedule", "", now), false);
  assert.equal(refreshNeeded("2026-10-26T11:20:00Z", "schedule", "", now), true);
});
test("missing snapshot regenerates and invalid scheduler slots are rejected", () => {
  assert.equal(refreshNeeded(undefined, "schedule", "", now), true);
  assert.throws(() => refreshNeeded("2026-10-26T11:20:00Z", "workflow_dispatch", "bad", now), /Invalid refresh slot/);
  assert.throws(() => refreshNeeded("2026-10-26T11:20:00Z", "workflow_dispatch", "2027-01-01T00:00:00.000Z", now), /Invalid refresh slot/);
});
