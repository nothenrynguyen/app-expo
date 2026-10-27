// This Worker only triggers the existing public-repository workflow. It never
// collects jobs, accepts public requests, or stores visitor information.
export type RefreshEnv = { GITHUB_ACTIONS_TOKEN?: string; SCHEDULER_ENABLED: string };
type WorkflowRun = { status: string; display_title: string; created_at: string };
type Fetcher = typeof fetch;

const HOUR = 3_600_000;
const OFFSET = 17 * 60_000;
const REPO = "nothenrynguyen/app-expo";
const API = `https://api.github.com/repos/${REPO}/actions/workflows/sync-jobs.yml`;
const SITE_SUMMARY = "https://empluzzed.fyi/summary.json";
const REPO_SUMMARY = `https://raw.githubusercontent.com/${REPO}/main/public/summary.json`;
const ACTIVE = new Set(["queued", "in_progress", "waiting", "pending", "requested"]);

export function refreshSlot(now: number): string {
  return new Date(Math.floor((now - OFFSET) / HOUR) * HOUR + OFFSET).toISOString();
}

async function request(fetcher: Fetcher, url: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetcher(url, {
    ...init, redirect: "error", signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Refresh dependency returned HTTP ${response.status}`);
  return response;
}

async function timestamp(fetcher: Fetcher, url: string, now: number): Promise<number> {
  const response = await request(fetcher, `${url}?refresh_check=${now}`, {
    headers: { "Cache-Control": "no-cache", "User-Agent": "empluzzed-refresh" },
  });
  const data = await response.json() as { generatedAt?: unknown };
  const value = typeof data.generatedAt === "string" ? Date.parse(data.generatedAt) : NaN;
  if (!Number.isFinite(value) || value > now + 60_000) throw new Error("Invalid snapshot timestamp");
  return value;
}

export async function checkRefresh(env: RefreshEnv, now = Date.now(), fetcher: Fetcher = fetch) {
  if (env.SCHEDULER_ENABLED !== "true") return { status: "disabled" };
  if (!env.GITHUB_ACTIONS_TOKEN) throw new Error("Scheduler GitHub credential is missing");
  const slot = refreshSlot(now);
  const target = Date.parse(slot);
  const title = `Hourly refresh ${slot}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${env.GITHUB_ACTIONS_TOKEN}`,
    "User-Agent": "empluzzed-refresh",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // A new repository snapshot means ingestion succeeded. A stale deployment is
  // a separate failure and must not cause repeated employer-board requests.
  const repositoryAt = await timestamp(fetcher, REPO_SUMMARY, now);
  if (repositoryAt >= target) {
    const publishedAt = await timestamp(fetcher, SITE_SUMMARY, now);
    if (publishedAt < target) throw new Error("New job snapshot is awaiting production publication");
    return { status: "fresh", slot };
  }

  const response = await request(fetcher, `${API}/runs?branch=main&per_page=50`, { headers });
  const data = await response.json() as { workflow_runs?: WorkflowRun[] };
  if (!Array.isArray(data.workflow_runs)) throw new Error("Invalid workflow history");
  if (data.workflow_runs.some((run) => ACTIVE.has(run.status))) return { status: "running", slot };
  const attempts = data.workflow_runs.filter((run) => run.display_title === title).length;
  // Three checks each hour allow one initial attempt and at most one retry.
  // The third check verifies publication rather than endlessly dispatching.
  if (attempts >= 2) throw new Error("Hourly refresh retry limit reached");
  await request(fetcher, `${API}/dispatches`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "main", inputs: { refresh_slot: slot } }),
  });
  return { status: "dispatched", slot, attempt: attempts + 1 };
}

const worker = {
  async scheduled(_event: unknown, env: RefreshEnv) {
    // Throwing marks the Cron invocation as failed. Errors contain no tokens or
    // provider response bodies; cron status is visible in Cloudflare's dashboard.
    return checkRefresh(env);
  },
};

export default worker;
