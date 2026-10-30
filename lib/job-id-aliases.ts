import type { PublicJob } from "./jobs";
import publishedAliases from "../data/job-id-aliases.json";

export const JOB_ID_ALIASES_EVENT = "app-expo:job-id-aliases-change";
let version = 0;
// Public ID compatibility ships with the static app too, so direct tracker
// visits and reloads do not depend on first visiting a board in this tab.
const aliases = new Map<string, string>(Object.entries(publishedAliases));
export const jobIdAliasesVersion = () => version;
export const canonicalJobId = (id: string) => aliases.get(id) ?? id;

// Compatibility is read-time only. No local records are rewritten on page load.
export function registerJobIdAliases(jobs: readonly PublicJob[]): boolean {
  const currentIds = new Set(jobs.map(job => job.id));
  const proposed = new Map<string, Set<string>>();
  for (const job of jobs) for (const old of job.previousIds ?? []) {
    if (old === job.id || currentIds.has(old)) continue;
    const targets = proposed.get(old) ?? new Set<string>();
    targets.add(job.id); proposed.set(old, targets);
  }
  let changed = false;
  for (const [old, targets] of proposed) {
    if (targets.size !== 1) continue;
    const target = [...targets][0];
    if (aliases.has(old) && aliases.get(old) !== target) continue;
    if (aliases.get(old) !== target) { aliases.set(old, target); changed = true; }
  }
  if (changed) version++;
  return changed;
}

export function announceJobIdAliases(jobs: readonly PublicJob[]) {
  if (registerJobIdAliases(jobs) && typeof window !== "undefined") window.dispatchEvent(new Event(JOB_ID_ALIASES_EVENT));
}

// The static app and JSON can briefly be from different refreshes. Normalize
// old snapshot IDs as well as private references, without changing stored data.
export function resolveSnapshotJobIds(jobs: readonly PublicJob[]): PublicJob[] {
  const resolved = new Map<string, PublicJob>();
  for (const job of jobs) {
    const id = canonicalJobId(job.id);
    const existing = resolved.get(id);
    resolved.set(id, existing ? { ...existing, sources: [...new Set([...existing.sources, ...job.sources])] } : { ...job, id });
  }
  return [...resolved.values()];
}
