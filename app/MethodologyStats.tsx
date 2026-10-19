"use client";

import Link from "next/link";
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

  return <>
    <div className="methodology-stats">
      <div><AnimatedCount value={summary.totalJobs} /><span>current listings, all locations</span></div>
      <Link href="/internships"><AnimatedCount value={summary.internships} /><span>internships, all locations</span></Link>
      <Link href="/jobs"><AnimatedCount value={summary.fulltime} /><span>full-time jobs, all locations</span></Link>
      {summary.screening?.version === 1 && <>
        <div><AnimatedCount value={summary.screening.excluded} /><span>unique application links excluded</span></div>
        <div><AnimatedCount value={summary.screening.pendingVerification} /><span>awaiting employer verification</span></div>
      </>}
      <div><strong>{summary.healthySources}/{summary.activeSources}</strong><span>sources healthy</span></div>
    </div>
    {summary.screening?.version === 1 ? <details className="screening-details">
      <summary>What the screening counts mean</summary>
      <p>Unique application links assessed from available sources. A link accepted onto the board is never counted as excluded. Employers awaiting verification are counted separately.</p>
      <ul>
        <li>Outside supported locations: {summary.screening.reasons.location.toLocaleString()}</li>
        <li>Outside supported roles: {summary.screening.reasons.role.toLocaleString()}</li>
        <li>Past seasonal or posting-age limits: {summary.screening.reasons.expired.toLocaleString()}</li>
        <li>Failed employer or listing checks: {summary.screening.reasons.employer.toLocaleString()}</li>
        <li>Closed or removed from the employer board: {summary.screening.reasons.closed.toLocaleString()}</li>
      </ul>
      <p>Each excluded link appears in one category. Closed counts are exclusions in this refresh, not a running total of past closures. Separate application links can refer to the same opening.</p>
      <p>Refresh: <time dateTime={summary.generatedAt}>{new Date(summary.generatedAt).toLocaleString()}</time></p>
    </details> : <p className="methodology-status">Unique screening counts will appear after the next refresh. Older snapshots do not contain that breakdown.</p>}
  </>;
}
