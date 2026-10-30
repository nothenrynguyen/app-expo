import { announceJobIdAliases, resolveSnapshotJobIds } from "./job-id-aliases";
import type { JobsSnapshot } from "./jobs";

export const SNAPSHOT_POLL_MS = 5 * 60_000;

type SnapshotPollingOptions = {
  type: "internships" | "fulltime";
  onSnapshot: (snapshot: JobsSnapshot) => void;
  onInitialError: () => void;
  fetcher?: typeof fetch;
  isVisible?: () => boolean;
};

export function createSnapshotPoller({ type, onSnapshot, onInitialError, fetcher = fetch,
  isVisible = () => document.visibilityState === "visible" }: SnapshotPollingOptions) {
  const controller = new AbortController();
  let currentTimestamp = -Infinity;
  let busy = false;
  let stopped = false;

  async function read(url: string) {
    const response = await fetcher(url, {
      cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]),
    });
    if (!response.ok) throw new Error("Could not load jobs");
    return response.json();
  }

  async function refresh() {
    if (stopped || busy || !isVisible()) return;
    busy = true;
    try {
      if (Number.isFinite(currentTimestamp)) {
        const summary = await read("/summary.json") as { generatedAt?: string };
        if (!(Date.parse(summary.generatedAt ?? "") > currentTimestamp)) return;
      }
      const snapshot = await read(`/${type}.json`) as JobsSnapshot;
      const timestamp = Date.parse(snapshot.generatedAt);
      if (!Number.isFinite(timestamp) || !Array.isArray(snapshot.jobs)) throw new Error("Invalid job snapshot");
      if (!stopped && timestamp > currentTimestamp) {
        currentTimestamp = timestamp;
        announceJobIdAliases(snapshot.jobs);
        onSnapshot({ ...snapshot, jobs: resolveSnapshotJobIds(snapshot.jobs) });
      }
    } catch {
      // Keep the last successfully loaded jobs during network/provider failures.
      if (!stopped && !Number.isFinite(currentTimestamp)) onInitialError();
    } finally {
      busy = false;
    }
  }

  return { refresh, stop: () => { stopped = true; controller.abort(); } };
}
