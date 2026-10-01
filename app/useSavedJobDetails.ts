"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { PublicJob } from "@/lib/jobs";
import { parseSavedJobIds, SAVED_JOBS_STORAGE_KEY } from "@/lib/saved-jobs";
import { EMPTY_SAVED_DETAILS, parseSavedJobDetails, retainSavedDetails, SAVED_DETAILS_KEY, type SavedJobDetails } from "@/lib/saved-job-details";

const EVENT = "app-expo:saved-details-change";
let cachedRaw: string | null | undefined;
let cachedDetails = EMPTY_SAVED_DETAILS;
function read() {
  try {
    const raw = window.localStorage.getItem(SAVED_DETAILS_KEY);
    if (raw !== cachedRaw) { cachedRaw = raw; cachedDetails = parseSavedJobDetails(raw); }
    return cachedDetails;
  } catch { return EMPTY_SAVED_DETAILS; }
}
function subscribe(listener: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === SAVED_DETAILS_KEY || event.key === null) listener(); };
  window.addEventListener("storage", storage);
  window.addEventListener(EVENT, listener);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(EVENT, listener); };
}
export function useSavedJobDetails(ids: ReadonlySet<string>, jobs: readonly PublicJob[], collection: SavedJobDetails["collection"], ready: boolean) {
  const details = useSyncExternalStore(subscribe, read, () => EMPTY_SAVED_DETAILS);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    if (!ready) return;
    try {
      // Read the persisted IDs at write time so hydration or another tab cannot
      // prune details using an earlier React snapshot.
      const latestIds = new Set(parseSavedJobIds(window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY)));
      const next = JSON.stringify(retainSavedDetails(read(), latestIds, jobs, collection));
      if (next === window.localStorage.getItem(SAVED_DETAILS_KEY)) return;
      window.localStorage.setItem(SAVED_DETAILS_KEY, next);
      window.dispatchEvent(new Event(EVENT));
      // Notify outside the effect body, after the storage operation completes.
      queueMicrotask(() => setStorageError(false));
    } catch { queueMicrotask(() => setStorageError(true)); }
  }, [ids, jobs, collection, ready]);
  return { details, storageError };
}
