"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatedCount } from "./AnimatedCount";
import type { JobsSummary } from "@/lib/job-summary";

export function LandingCollections() {
  const [summary, setSummary] = useState<JobsSummary | null>(null);

  useEffect(() => {
    fetch("/summary.json", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<JobsSummary> : Promise.reject())
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  return <>
    <div className="collection-grid">
      <Link className="collection-card" href="/internships">
        <h2>Current Internships</h2>
        <p className="collection-subtitle"><AnimatedCount className="collection-count" value={summary?.internships} /> listings on the board</p>
        <span className="collection-link">Browse Internships <b>→</b></span>
      </Link>
      <Link className="collection-card" href="/jobs">
        <h2>Current Early Career Jobs</h2>
        <p className="collection-subtitle"><AnimatedCount className="collection-count" value={summary?.fulltime} /> listings on the board</p>
        <span className="collection-link">Browse Early Career Jobs <b>→</b></span>
      </Link>
    </div>
    {summary?.screening?.version === 1 && <p className="landing-screening"><span aria-hidden="true">✦ </span><Link className="screening-total" href="/methodology" aria-label={`${summary.screening.reviewed.toLocaleString()} total job links screened. Learn about the screening methodology.`}>{summary.screening.reviewed.toLocaleString()}</Link> total job links screened</p>}
  </>;
}
