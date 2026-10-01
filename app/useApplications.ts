"use client";
import { useSyncExternalStore } from "react";
import { APPLICATIONS_KEY, EMPTY_APPLICATIONS, parseApplications, type Application } from "@/lib/applications";
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
      const next = transform(read());
      window.localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(EVENT));
      return true;
    } catch { return false; }
  }
  return { applications, change };
}
