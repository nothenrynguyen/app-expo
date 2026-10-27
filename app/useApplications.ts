"use client";
import { useSyncExternalStore } from "react";
import { APPLICATIONS_KEY, EMPTY_APPLICATIONS, parseApplications, type Application } from "@/lib/applications";
import { trackActivity } from "@/lib/activity-client";
const EVENT = "app-expo:applications-change";
let rawCache: string | null | undefined;
let cache = EMPTY_APPLICATIONS;
function read() {
  try {
    const raw = window.localStorage.getItem(APPLICATIONS_KEY);
    if (raw !== rawCache) { rawCache = raw; cache = parseApplications(raw); }
    return cache;
  } catch { return EMPTY_APPLICATIONS; }
}
function subscribe(listener: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === APPLICATIONS_KEY || event.key === null) listener(); };
  window.addEventListener("storage", storage); window.addEventListener(EVENT, listener);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(EVENT, listener); };
}
export function useApplications() {
  const applications = useSyncExternalStore(subscribe, read, () => EMPTY_APPLICATIONS);
  function change(transform: (current: readonly Application[]) => readonly Application[]) {
    try {
      // A failed storage read must abort a write rather than treating existing
      // records as empty and overwriting them.
      const current = parseApplications(window.localStorage.getItem(APPLICATIONS_KEY));
      const next = transform(current);
      window.localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(EVENT));
      const existingIds = new Set(current.map((item) => item.id));
      if (next.some((item) => !existingIds.has(item.id))) trackActivity("application_add");
      return true;
    } catch { return false; }
  }
  return { applications, change };
}
