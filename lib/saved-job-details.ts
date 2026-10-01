import type { PublicJob } from "./jobs";

export const SAVED_DETAILS_KEY = "app-expo:saved-job-details:v1";
export type SavedJobDetails = { id: string; company: string; title: string; collection: "internships" | "fulltime" };
export const EMPTY_SAVED_DETAILS: readonly SavedJobDetails[] = [];

export function parseSavedJobDetails(raw: string | null): readonly SavedJobDetails[] {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!Array.isArray(value)) return EMPTY_SAVED_DETAILS;
    const unique = new Map<string, SavedJobDetails>();
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const { id, company, title, collection } = item;
      if (typeof id !== "string" || !id || id.length > 500 || typeof company !== "string" || company.length > 1000 || typeof title !== "string" || title.length > 2000 || (collection !== "internships" && collection !== "fulltime")) continue;
      unique.set(id, { id, company, title, collection });
    }
    return [...unique.values()];
  } catch { return EMPTY_SAVED_DETAILS; }
}

export function retainSavedDetails(previous: readonly SavedJobDetails[], ids: ReadonlySet<string>, jobs: readonly PublicJob[], collection: SavedJobDetails["collection"]): readonly SavedJobDetails[] {
  const details = new Map(previous.filter((job) => ids.has(job.id)).map((job) => [job.id, job]));
  for (const job of jobs) {
    if (ids.has(job.id)) details.set(job.id, { id: job.id, company: job.company, title: job.title, collection });
  }
  return [...details.values()];
}

export function missingSavedDetails(details: readonly SavedJobDetails[], ids: ReadonlySet<string>, jobs: readonly PublicJob[], collection: SavedJobDetails["collection"]) {
  const current = new Set(jobs.map((job) => job.id));
  return details.filter((job) => ids.has(job.id) && job.collection === collection && !current.has(job.id));
}
