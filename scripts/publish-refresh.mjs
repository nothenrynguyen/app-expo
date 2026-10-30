import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function gitCommand(args, cwd = process.cwd()) {
  const result = spawnSync("git", args, {
    cwd, encoding: "utf8", timeout: 45_000, maxBuffer: 2 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  return { ok: result.status === 0, text: `${result.stdout || ""}${result.stderr || ""}`, timedOut: result.error?.code === "ETIMEDOUT" };
}

export function retryable(result) {
  // Authentication, permissions, conflicts and invalid repositories are not transient.
  if (/authentication failed|permission denied|could not read username|repository not found|HTTP (?:401|403)|CONFLICT|cannot rebase/i.test(result.text)) return false;
  return result.timedOut || /HTTP (?:408|429|5\d\d)|Internal Server Error|Bad Gateway|Service Unavailable|Gateway Timeout|timed? out|connection (?:reset|closed)|remote end hung up|unexpected disconnect|could not resolve host|failed to connect|non-fast-forward|fetch first/i.test(result.text);
}

export async function publishRefresh({ git = gitCommand, wait = ms => new Promise(resolve => setTimeout(resolve, ms)), log = console.log } = {}) {
  const requireGit = args => {
    const result = git(args);
    if (!result.ok) throw new Error(`Publication stopped: git ${args[0]} failed. Inspect the repository before retrying.`);
    return result.text.trim();
  };
  // Push only committed work. A blocked refresh may leave rejected files dirty;
  // those must never be stashed, added, or included in the retry-state commit.
  let intended = requireGit(["rev-parse", "HEAD"]);
  for (let attempt = 1; attempt <= 3; attempt++) {
    log(`Publish attempt ${attempt}/3.`);
    const fetched = git(["fetch", "origin", "main"]);
    let failure = fetched;
    if (fetched.ok) {
      const remote = requireGit(["rev-parse", "refs/remotes/origin/main"]);
      // Also handles an upload accepted by GitHub before the connection timed out.
      if (git(["merge-base", "--is-ancestor", intended, remote]).ok) {
        log("Publication confirmed on origin/main.");
        return;
      }
      if (!git(["merge-base", "--is-ancestor", remote, "HEAD"]).ok) {
        if (requireGit(["status", "--porcelain", "--untracked-files=no"])) throw new Error("Publication stopped: remote advanced while tracked changes remain uncommitted.");
        log("Remote advanced; reconciling without overwriting remote work.");
        requireGit(["rebase", "refs/remotes/origin/main"]);
        intended = requireGit(["rev-parse", "HEAD"]);
      }
      failure = git(["push", "origin", "HEAD:refs/heads/main"]);
      if (failure.ok) {
        log("Publication succeeded.");
        return;
      }
    }
    if (!retryable(failure)) throw new Error("Publication failed with a non-transient Git error. No automatic retry or overwrite was attempted.");
    if (attempt === 3) {
      // The final push can also succeed remotely while returning a timeout.
      const confirmation = git(["fetch", "origin", "main"]);
      if (confirmation.ok && git(["merge-base", "--is-ancestor", intended, "refs/remotes/origin/main"]).ok) {
        log("Publication confirmed on origin/main after the final transport error.");
        return;
      }
      throw new Error("Publication failed after 3 attempts. The remote outcome may be uncertain; check origin/main before retrying.");
    }
    const delay = attempt === 1 ? 5_000 : 15_000;
    log(`Temporary Git transport failure; checking remote state again in ${delay / 1000}s.`);
    await wait(delay);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  publishRefresh().catch(error => { console.error(error.message); process.exitCode = 1; });
}
