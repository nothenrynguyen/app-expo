"use client";

import { useMemo, useSyncExternalStore } from "react";
import { EMPTY_SAVED_JOB_IDS, parseSavedJobIds, SAVED_JOBS_STORAGE_KEY, toggleSavedJobId } from "@/lib/saved-jobs";

const CHANGE_EVENT = "app-expo:saved-jobs-change";

let cachedRaw: string | null | undefined;
let cachedIds: readonly string[] = EMPTY_SAVED_JOB_IDS;

function readSavedJobIds(): readonly string[] {
  if (typeof window === "undefined") return EMPTY_SAVED_JOB_IDS;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY);
  } catch {
    return EMPTY_SAVED_JOB_IDS;
  }

  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  cachedIds = parseSavedJobIds(raw);
  return cachedIds;
}

function subscribe(onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SAVED_JOBS_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function writeSavedJobIds(ids: readonly string[]) {
  const raw = JSON.stringify(ids);
  try {
    window.localStorage.setItem(SAVED_JOBS_STORAGE_KEY, raw);
  } catch {
    return;
  }
  cachedRaw = undefined;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useSavedJobs() {
  const ids = useSyncExternalStore(subscribe, readSavedJobIds, () => EMPTY_SAVED_JOB_IDS);
  const idSet = useMemo(() => new Set(ids), [ids]);

  const toggle = (jobId: string) => {
    writeSavedJobIds(toggleSavedJobId(readSavedJobIds(), jobId));
  };

  return { ids: idSet, toggle };
}
