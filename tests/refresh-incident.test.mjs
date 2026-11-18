import { test } from "node:test";
import assert from "node:assert/strict";
import { updateRefreshIncident } from "../scripts/refresh-incident.mjs";

test("refresh incident creates once, updates without comments, closes on recovery and ignores skipped runs", async () => {
  const issues = [], calls = [];
  const github = { paginate: async () => issues, rest: { issues: {
    listForRepo: () => {}, create: async data => { calls.push(["create", data]); issues.push({ number: 17, ...data }); },
    update: async data => { calls.push(["update", data]); Object.assign(issues[0], data); },
  } } };
  const input = { github, context: { repo: { owner: "owner", repo: "repo" }, serverUrl: "https://github.com", runId: 1 },
    conclusion: "success", report: { completedAt: new Date().toISOString(), status: "degraded" },
    changes: { availability: { current: 5200, awaitingVerification: 617 } } };
  assert.equal((await updateRefreshIncident(input)).action, "created");
  assert.equal((await updateRefreshIncident(input)).action, "updated");
  assert.equal(calls.filter(([method]) => method === "create").length, 1);
  assert.match(calls[1][1].body, /Current listings: 5200/);
  assert.equal((await updateRefreshIncident({ ...input, conclusion: "skipped" })).action, "skipped");
  assert.equal(calls.length, 2);
  await updateRefreshIncident({ ...input, conclusion: "failure", report: null, changes: null });
  assert.match(calls.at(-1)[1].title, /publication failed/);
  assert.doesNotMatch(calls.at(-1)[1].body, /Current listings/);
  await updateRefreshIncident({ ...input, report: { ...input.report, status: "healthy" }, changes: { availability: { current: 5817, awaitingVerification: 0 } } });
  assert.equal(calls.at(-1)[1].state, "closed");
});

test("a successful run with missing diagnostics cannot close an incident", async () => {
  await assert.rejects(updateRefreshIncident({ conclusion: "success" }), /Missing current refresh diagnostics/);
});
