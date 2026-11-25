import type { PublicJob } from "../jobs";
import { createHash } from "node:crypto";
import { workdayOpportunityIdentity } from "../workday-identity";
import { smartRecruitersOpportunityIdentity } from "../smartrecruiters";
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

// Only actually published IDs become aliases. Native posting identity is stable
// across slug and tracking changes, including a return after a snapshot gap.
export function preserveSmartRecruitersJobIds(current: PublicJob[], previous: PublicJob[], known: Record<string, string> = publishedAliases): PublicJob[] {
  const prior = new Map<string, PublicJob[]>();
  for (const job of previous) {
    const key = smartRecruitersOpportunityIdentity(job.applyUrl);
    if (key) prior.set(key, [...(prior.get(key) ?? []), job]);
  }
  const aliasesByTarget = new Map<string, string[]>();
  for (const [old, target] of Object.entries(known)) aliasesByTarget.set(target, [...(aliasesByTarget.get(target) ?? []), old]);
  return current.map(job => {
    const key = smartRecruitersOpportunityIdentity(job.applyUrl);
    if (!key) return job;
    const id = createHash("sha256").update(key).digest("hex").slice(0, 24);
    const previousIds = [...new Set([...(aliasesByTarget.get(id) ?? []),
      ...(prior.get(key) ?? []).flatMap(old => [old.id, ...(old.previousIds ?? [])])])].filter(old => old !== id);
    const result = {...job, id};
    delete result.previousIds;
    return {...result, ...(previousIds.length ? {previousIds} : {})};
  });
}

export function preserveEmployerJobIds(current: PublicJob[], previous: PublicJob[]) {
  return preserveSmartRecruitersJobIds(preserveWorkdayJobIds(current, previous), previous);
}

export function collectJobIdAliases(jobs: PublicJob[], existing: Record<string, string>) {
  const aliases = { ...existing };
  for (const job of jobs) for (const old of job.previousIds ?? []) {
    if (aliases[old] && aliases[old] !== job.id) throw new Error(`Conflicting public job ID alias: ${old}`);
    aliases[old] = job.id;
  }
  return aliases;
}
