"use client";

import { useState, useSyncExternalStore } from "react";
import { companyPreferenceKey, EMPTY_HIDDEN_COMPANIES, HIDDEN_COMPANIES_KEY, parseHiddenCompanies, type HiddenCompany } from "@/lib/hidden-companies";

const CHANGE_EVENT = "app-expo:hidden-companies-change";
let cachedRaw: string | null | undefined;
let cached: readonly HiddenCompany[] = EMPTY_HIDDEN_COMPANIES;
function read() {
  try {
    const raw = window.localStorage.getItem(HIDDEN_COMPANIES_KEY);
    if (raw !== cachedRaw) { cachedRaw = raw; cached = parseHiddenCompanies(raw); }
    return cached;
  } catch { return EMPTY_HIDDEN_COMPANIES; }
}
function subscribe(change: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === HIDDEN_COMPANIES_KEY || event.key === null) change(); };
  window.addEventListener("storage", storage);
  window.addEventListener(CHANGE_EVENT, change);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(CHANGE_EVENT, change); };
}
export function useHiddenCompanies() {
  const companies = useSyncExternalStore(subscribe, read, () => EMPTY_HIDDEN_COMPANIES);
  const [storageError, setStorageError] = useState(false);
  function update(name: string, hidden: boolean) {
    const key = companyPreferenceKey(name);
    if (!key) return false;
    try {
      const next = read().filter((company) => company.key !== key);
      if (hidden) next.push({ key, name });
      window.localStorage.setItem(HIDDEN_COMPANIES_KEY, JSON.stringify(next));
      cachedRaw = undefined;
      window.dispatchEvent(new Event(CHANGE_EVENT));
      setStorageError(false);
      return true;
    } catch { setStorageError(true); return false; }
  }
  return { companies, update, storageError };
}
