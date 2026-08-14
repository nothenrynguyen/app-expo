"use client";

import { useEffect, useState } from "react";
import type { JobsSummary } from "@/lib/job-summary";

export function MethodologyStats() {
  const [summary, setSummary] = useState<JobsSummary | null>(null);

  useEffect(() => {
    fetch("/summary.json", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<JobsSummary> : Promise.reject())
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  if (!summary) return <p className="methodology-status">Loading the latest board summary...</p>;

  return (
    <div className="methodology-stats">
      <div><strong>{summary.totalJobs.toLocaleString()}</strong><span>current listings</span></div>
      <div><strong>{summary.internships.toLocaleString()}</strong><span>internships</span></div>
      <div><strong>{summary.fulltime.toLocaleString()}</strong><span>full-time jobs</span></div>
      <div><strong>{summary.healthySources}/{summary.activeSources}</strong><span>sources healthy</span></div>
    </div>
  );
}
