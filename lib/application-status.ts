import { canonicalJobId } from "./job-id-aliases";
export const APPLICATION_STATUS_KEY = "app-expo:application-status:v1";
export const APPLICATION_STATUSES = ["Saved", "Applied", "Interviewing", "Offered", "Rejected"] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];
export const EMPTY_STATUSES: Readonly<Record<string, ApplicationStatus>> = {};

export function matchesApplicationStatus(id: string, statuses: Readonly<Record<string, ApplicationStatus>>, filter: ApplicationStatus | "All") {
  return filter === "All" || (Object.prototype.hasOwnProperty.call(statuses, id) ? statuses[id] : "Saved") === filter;
}

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return APPLICATION_STATUSES.some((status) => status === value);
}

export function parseApplicationStatuses(raw: string | null): Readonly<Record<string, ApplicationStatus>> {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_STATUSES;
    const entries = Object.entries(value).filter(([id, status]) => id.length > 0 && isApplicationStatus(status));
    // An explicit current-ID choice wins over an older alias.
    entries.sort(([a], [b]) => Number(canonicalJobId(a) === a) - Number(canonicalJobId(b) === b));
    return Object.fromEntries(entries.map(([id, status]) => [canonicalJobId(id), status]));
  } catch { return EMPTY_STATUSES; }
}
