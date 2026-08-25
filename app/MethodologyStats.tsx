"use client";

import { useEffect, useState } from "react";
import { AnimatedCount } from "./AnimatedCount";
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
      <div><AnimatedCount value={summary.totalJobs} /><span>current listings, all locations</span></div>
      <div><AnimatedCount value={summary.internships} /><span>internships, all locations</span></div>
      <div><AnimatedCount value={summary.fulltime} /><span>full-time jobs, all locations</span></div>
      <div><AnimatedCount value={summary.screenedOut} /><span>screened out this refresh</span></div>
      <div><AnimatedCount value={summary.closedPostingsCaught} /><span>closed postings caught</span></div>
      <div><strong>{summary.healthySources}/{summary.activeSources}</strong><span>sources healthy</span></div>
    </div>
  );
}
