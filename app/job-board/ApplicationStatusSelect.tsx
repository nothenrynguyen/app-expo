"use client";

import { useState } from "react";
import { APPLICATION_STATUSES, isApplicationStatus } from "@/lib/application-status";
import { useApplicationStatuses } from "../useApplicationStatuses";

export function ApplicationStatusSelect({ jobId, title }: { jobId: string; title: string }) {
  const { statuses, update } = useApplicationStatuses();
  const [error, setError] = useState(false);
  return <div className="application-status">
    <label>
      <span className="sr-only">Application status for {title}</span>
      <select aria-label={`Application status for ${title}`} value={statuses[jobId] ?? "Saved"} onChange={(event) => {
        const status = event.target.value;
        if (!isApplicationStatus(status)) return;
        setError(!update(jobId, status));
      }}>
        {APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}
      </select>
    </label>
    {error ? <small role="alert">Could not save. Check browser storage.</small> : null}
  </div>;
}
