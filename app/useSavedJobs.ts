"use client";

import { useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "app-expo:saved-job-ids:v1";
const CHANGE_EVENT = "app-expo:saved-jobs-change";
const EMPTY_IDS: readonly string[] = [];

let cachedRaw: string | null | undefined;
let cachedIds: readonly string[] = EMPTY_IDS;

function readSavedJobIds(): readonly string[] {
  if (typeof window === "undefined") return EMPTY_IDS;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_IDS;
  }

  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;

  if (!raw) {
    cachedIds = EMPTY_IDS;
    return cachedIds;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    cachedIds = Array.isArray(parsed)
      ? [...new Set(parsed.filter((value): value is string => typeof value === "string"))]
      : EMPTY_IDS;
  } catch {
    cachedIds = EMPTY_IDS;
  }

  return cachedIds;
}

function subscribe(onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
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
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    return;
  }
  cachedRaw = undefined;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useSavedJobs() {
  const ids = useSyncExternalStore(subscribe, readSavedJobIds, () => EMPTY_IDS);
  const idSet = useMemo(() => new Set(ids), [ids]);

  const toggle = (jobId: string) => {
    const next = new Set(readSavedJobIds());
    if (next.has(jobId)) next.delete(jobId);
    else next.add(jobId);
    writeSavedJobIds([...next]);
  };

  return { ids: idSet, toggle };
}
