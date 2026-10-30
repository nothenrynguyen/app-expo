import type { PublicJob } from "../jobs";
import { createHash } from "node:crypto";
import { workdayOpportunityIdentity } from "../workday-identity";
import legacy from "../../data/workday-legacy-ids.json";
import publishedAliases from "../../data/job-id-aliases.json";

export function preserveWorkdayJobIds(current: PublicJob[], previous: PublicJob[]): PublicJob[] {
  const byOpportunity = new Map<string, PublicJob[]>();
  for (const job of previous) {
    const key = workdayOpportunityIdentity(job.applyUrl);
    if (key) byOpportunity.set(key, [...(byOpportunity.get(key) ?? []), job]);
  }
  return current.map(job => {
    const key = workdayOpportunityIdentity(job.applyUrl);
    if (!key) return job;
    const prior = byOpportunity.get(key) ?? [];
    // Stable even after a posting leaves the previous snapshot, then returns
    // under a different locale, title or company display name.
    const id = createHash("sha256").update(key).digest("hex").slice(0, 24);
    // Only IDs that were actually published for this opportunity can be
    // aliases. A provisional legacy hash can collide across career sites.
    const known = publishedAliases as Record<string, string>;
    const carried = [job.id, ...(job.previousIds ?? [])].filter(old => known[old] === id);
    const previousIds = [...new Set([...carried, ...prior.flatMap(p => [p.id, ...(p.previousIds ?? [])]),
      ...((legacy as Record<string, string[]>)[key] ?? [])])].filter(value => value !== id);
    return { ...job, id, ...(previousIds.length ? { previousIds } : {}) };
  });
}

export function collectJobIdAliases(jobs: PublicJob[], existing: Record<string, string>) {
  const aliases = { ...existing };
  for (const job of jobs) for (const old of job.previousIds ?? []) {
    if (aliases[old] && aliases[old] !== job.id) throw new Error(`Conflicting public job ID alias: ${old}`);
    aliases[old] = job.id;
  }
  return aliases;
}
