export const APPLICATION_STATUS_KEY = "app-expo:application-status:v1";
export const APPLICATION_STATUSES = ["Saved", "Applied", "Interviewing", "Offered", "Rejected"] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];
export const EMPTY_STATUSES: Readonly<Record<string, ApplicationStatus>> = {};

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return APPLICATION_STATUSES.some((status) => status === value);
}

export function parseApplicationStatuses(raw: string | null): Readonly<Record<string, ApplicationStatus>> {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_STATUSES;
    return Object.fromEntries(Object.entries(value).filter(([id, status]) => id.length > 0 && isApplicationStatus(status)));
  } catch { return EMPTY_STATUSES; }
}
