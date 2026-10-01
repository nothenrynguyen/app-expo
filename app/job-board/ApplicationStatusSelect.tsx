"use client";

import { useState, useSyncExternalStore } from "react";
import { APPLICATION_STATUSES, APPLICATION_STATUS_KEY, EMPTY_STATUSES, isApplicationStatus, parseApplicationStatuses } from "@/lib/application-status";

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

export function ApplicationStatusSelect({ jobId, title }: { jobId: string; title: string }) {
  const statuses = useSyncExternalStore(subscribe, read, () => EMPTY_STATUSES);
  const [error, setError] = useState(false);
  return <div className="application-status">
    <label>
      <span className="sr-only">Application status for {title}</span>
      <select aria-label={`Application status for ${title}`} value={statuses[jobId] ?? "Saved"} onChange={(event) => {
        const status = event.target.value;
        if (!isApplicationStatus(status)) return;
        try {
          window.localStorage.setItem(APPLICATION_STATUS_KEY, JSON.stringify({ ...read(), [jobId]: status }));
          setError(false);
          window.dispatchEvent(new Event(CHANGE_EVENT));
        } catch { setError(true); }
      }}>
        {APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}
      </select>
    </label>
    {error ? <small role="alert">Could not save. Check browser storage.</small> : null}
  </div>;
}
