export const SAVED_JOBS_STORAGE_KEY = "app-expo:saved-job-ids:v1";
export const EMPTY_SAVED_JOB_IDS: readonly string[] = [];

export function parseSavedJobIds(raw: string | null): readonly string[] {
  if (!raw) return EMPTY_SAVED_JOB_IDS;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_SAVED_JOB_IDS;

    return [...new Set(parsed.filter((value): value is string => typeof value === "string"))];
  } catch {
    return EMPTY_SAVED_JOB_IDS;
  }
}

export function toggleSavedJobId(ids: readonly string[], jobId: string): string[] {
  const next = new Set(ids);
  if (next.has(jobId)) next.delete(jobId);
  else next.add(jobId);
  return [...next];
}
