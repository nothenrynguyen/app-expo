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
        <p className="collection-subtitle"><AnimatedCount className="collection-count" value={summary?.internships} /> current jobs available</p>
        <span className="collection-link">Browse Internships <b>→</b></span>
      </Link>
      <Link className="collection-card" href="/jobs">
        <h2>Current Full-Time Jobs</h2>
        <p className="collection-subtitle"><AnimatedCount className="collection-count" value={summary?.fulltime} /> current jobs available</p>
        <span className="collection-link">Browse Full-Time Jobs <b>→</b></span>
      </Link>
    </div>
    <div className="landing-screening">
      <p>Focused on early-career roles. Filtered for relevance, location, and employer checks.</p>
      <p><span aria-hidden="true">* </span>{summary?.screening?.version === 1 && <>{summary.screening.excluded.toLocaleString()} unique application links screened out in the latest refresh. </>}<Link href="/methodology#screening">How we screen <span aria-hidden="true">→</span></Link></p>
      {summary?.screening?.version === 1 && <p className="screening-refresh">As of <time dateTime={summary.generatedAt}>{new Date(summary.generatedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></p>}
    </div>
  </>;
}
