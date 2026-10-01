import { isApplicationStatus, type ApplicationStatus } from "./application-status";
import type { SavedJobDetails } from "./saved-job-details";

export const APPLICATIONS_KEY = "app-expo:applications:v1";
export type Application = { id: string; company: string; title: string; url: string; status: ApplicationStatus; appliedOn: string; notes: string; origin: "manual" | "app-expo"; jobId?: string };
export const EMPTY_APPLICATIONS: readonly Application[] = [];
export function safeApplicationUrl(value: string): string | null {
  if (!value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function validApplicationDate(value: string) {
  return value === "" || (/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value);
}
export function parseApplications(raw: string | null): readonly Application[] {
  try {
    const items: unknown = JSON.parse(raw ?? "null");
    if (!Array.isArray(items)) return EMPTY_APPLICATIONS;
    const records = new Map<string, Application>();
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const { id, company, title, url, status, appliedOn, notes, origin, jobId } = item;
      if (typeof id !== "string" || !id || id.length > 500 || typeof company !== "string" || !company.trim() || company.length > 300 || typeof title !== "string" || !title.trim() || title.length > 500 || typeof url !== "string" || url.length > 2000 || safeApplicationUrl(url) === null || !isApplicationStatus(status) || typeof appliedOn !== "string" || !validApplicationDate(appliedOn) || typeof notes !== "string" || notes.length > 5000 || (origin !== "manual" && origin !== "app-expo")) continue;
      records.set(id, { id, company, title, url: safeApplicationUrl(url)!, status, appliedOn, notes, origin, ...(origin === "app-expo" && typeof jobId === "string" ? { jobId } : {}) });
    }
    return [...records.values()];
  } catch { return EMPTY_APPLICATIONS; }
}
export function importSavedApplications(existing: readonly Application[], details: readonly SavedJobDetails[], ids: ReadonlySet<string>, statuses: Readonly<Record<string, ApplicationStatus>>) {
  const known = new Set(existing.map((record) => record.jobId).filter(Boolean));
  return [...existing, ...details.filter((job) => ids.has(job.id) && !known.has(job.id)).map((job): Application => ({ id: `board:${job.id}`, jobId: job.id, company: job.company, title: job.title, url: "", status: statuses[job.id] ?? "Saved", appliedOn: "", notes: "", origin: "app-expo" }))];
}
