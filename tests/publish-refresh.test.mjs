import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { gitCommand, publishRefresh, retryable } from "../scripts/publish-refresh.mjs";

const failed = text => ({ ok: false, text });

async function fixture(run) {
  const prefix = path.join(tmpdir(), "empluzzed-publish-");
  const root = await mkdtemp(prefix);
  const cwd = path.join(root, "local");
  const remote = path.join(root, "remote.git");
  const git = args => gitCommand(args, cwd);
  const checked = (args, dir = cwd) => {
    const result = gitCommand(args, dir);
    assert.equal(result.ok, true, result.text);
    return result.text.trim();
  };
  try {
    await mkdir(cwd);
    checked(["init", "--bare", remote], root);
    checked(["init", "-b", "main"]);
    checked(["config", "user.name", "test"]);
    checked(["config", "user.email", "test@example.invalid"]);
    await writeFile(path.join(cwd, "snapshot"), "baseline");
    checked(["add", "."]); checked(["commit", "-m", "baseline"]);
    checked(["remote", "add", "origin", remote]); checked(["push", "-u", "origin", "main"]);
    await writeFile(path.join(cwd, "snapshot"), "validated");
    checked(["add", "."]); checked(["commit", "-m", "validated snapshot"]);
    await run({ root, cwd, remote, git, checked });
  } finally {
    assert.ok(path.resolve(root).startsWith(path.resolve(prefix)));
    await rm(root, { recursive: true, force: true });
  }
}

for (const message of ["remote: Internal Server Error", "RPC failed; HTTP 408", "Failed to connect", "HTTP 503"]) {
  test(`publication recovers from ${message} without recollecting or recommitting`, () => fixture(async ({ git, checked }) => {
    let pushes = 0;
    const waits = [];
    const head = checked(["rev-parse", "HEAD"]);
    await publishRefresh({ git: args => args[0] === "push" && ++pushes === 1 ? failed(message) : git(args), wait: async ms => waits.push(ms), log: () => {} });
    assert.equal(pushes, 2); assert.deepEqual(waits, [5000]);
    assert.equal(checked(["rev-parse", "origin/main"]), head);
    assert.equal(checked(["rev-parse", "HEAD"]), head);
  }));
}

test("timeout after accepted upload is confirmed without pushing twice", () => fixture(async ({ git, checked }) => {
  let pushes = 0;
  await publishRefresh({ git: args => {
    const result = git(args);
    if (args[0] === "push") { pushes++; assert.equal(result.ok, true); return failed("HTTP 408"); }
    return result;
  }, wait: async () => {}, log: () => {} });
  assert.equal(pushes, 1);
  assert.equal(checked(["rev-parse", "origin/main"]), checked(["rev-parse", "HEAD"]));
}));

test("an accepted final upload is confirmed even after two earlier outages", () => fixture(async ({ git }) => {
  let pushes = 0;
  await publishRefresh({ git: args => {
    if (args[0] !== "push") return git(args);
    if (++pushes < 3) return failed("HTTP 503");
    assert.equal(git(args).ok, true);
    return failed("HTTP 408");
  }, wait: async () => {}, log: () => {} });
  assert.equal(pushes, 3);
}));

test("persistent transport failure stops after three attempts", () => fixture(async ({ git }) => {
  let pushes = 0; const waits = [];
  await assert.rejects(publishRefresh({ git: args => args[0] === "push" ? (++pushes, failed("HTTP 503")) : git(args), wait: async ms => waits.push(ms), log: () => {} }), /after 3 attempts/);
  assert.equal(pushes, 3); assert.deepEqual(waits, [5000, 15000]);
}));

test("fetch transport failures are bounded and retried before uploading", () => fixture(async ({ git }) => {
  let fetches = 0; let pushes = 0;
  await publishRefresh({ git: args => {
    if (args[0] === "fetch" && ++fetches < 3) return failed("HTTP 502");
    if (args[0] === "push") pushes++;
    return git(args);
  }, wait: async () => {}, log: () => {} });
  assert.equal(fetches, 3); assert.equal(pushes, 1);
}));

test("permission failures stop immediately and are never hidden", () => fixture(async ({ git }) => {
  let pushes = 0;
  await assert.rejects(publishRefresh({ git: args => args[0] === "push" ? (++pushes, failed("HTTP 403 Permission denied")) : git(args), wait: async () => assert.fail("must not wait"), log: () => {} }), /non-transient/);
  assert.equal(pushes, 1);
  assert.equal(retryable(failed("Authentication failed")), false);
  assert.equal(retryable(failed("unknown failure")), false);
  assert.equal(retryable({ ok: false, text: "", timedOut: true }), true);
}));

for (const conflict of [false, true]) {
  test(`remote advancement ${conflict ? "stops on a conflict" : "preserves both independent commits"}`, () => fixture(async ({ root, remote, git, checked, cwd }) => {
    const other = path.join(root, "other");
    checked(["clone", "-b", "main", remote, other], root);
    checked(["config", "user.name", "test"], other); checked(["config", "user.email", "test@example.invalid"], other);
    await writeFile(path.join(other, conflict ? "snapshot" : "independent"), "remote work");
    checked(["add", "."], other); checked(["commit", "-m", "remote work"], other); checked(["push"], other);
    const remoteHead = checked(["rev-parse", "HEAD"], other);
    const execute = () => publishRefresh({ git, wait: async () => {}, log: () => {} });
    if (conflict) {
      await assert.rejects(execute(), /rebase failed/);
      assert.equal(checked(["rev-parse", "main"], remote), remoteHead);
      assert.match(checked(["status", "--porcelain"]), /UU snapshot/);
    } else {
      await execute();
      assert.equal(checked(["show", "main:snapshot"], remote), "validated");
      assert.equal(checked(["show", "main:independent"], remote), "remote work");
      assert.equal(gitCommand(["merge-base", "--is-ancestor", remoteHead, "HEAD"], cwd).ok, true);
    }
  }));
}

test("retry-state publication leaves staged rejected snapshot out of the remote commit", () => fixture(async ({ cwd, git, checked, remote }) => {
  await writeFile(path.join(cwd, "snapshot"), "rejected"); checked(["add", "snapshot"]);
  await publishRefresh({ git, wait: async () => {}, log: () => {} });
  assert.equal(checked(["show", "main:snapshot"], remote), "validated");
  assert.match(checked(["status", "--porcelain"]), /snapshot/);
}));
