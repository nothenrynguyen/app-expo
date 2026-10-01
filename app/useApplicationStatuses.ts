"use client";

import { useSyncExternalStore } from "react";
import { APPLICATION_STATUS_KEY, EMPTY_STATUSES, parseApplicationStatuses, type ApplicationStatus } from "@/lib/application-status";

const CHANGE_EVENT = "app-expo:application-status-change";
let cachedRaw: string | null | undefined;
let cachedStatuses = EMPTY_STATUSES;
function read() {
  try {
    const raw = window.localStorage.getItem(APPLICATION_STATUS_KEY);
    if (raw !== cachedRaw) { cachedRaw = raw; cachedStatuses = parseApplicationStatuses(raw); }
    return cachedStatuses;
  } catch { return EMPTY_STATUSES; }
}
function subscribe(listener: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === APPLICATION_STATUS_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", storage);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(CHANGE_EVENT, listener); };
}
export function useApplicationStatuses() {
  const statuses = useSyncExternalStore(subscribe, read, () => EMPTY_STATUSES);
  const update = (jobId: string, status: ApplicationStatus) => {
    try {
      window.localStorage.setItem(APPLICATION_STATUS_KEY, JSON.stringify({ ...read(), [jobId]: status }));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return true;
    } catch { return false; }
  };
  return { statuses, update };
}
