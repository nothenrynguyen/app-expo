"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatedCount } from "./AnimatedCount";
import type { JobsSummary } from "@/lib/job-summary";
import { ROLE_FAMILIES } from "@/lib/role-areas";

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
    <section className="role-shortcuts">
      <p className="eyebrow">Browse internships by field</p>
      <div>{ROLE_FAMILIES.filter((family) => family.value !== "all").map((family) => <Link href={`/internships?role=${family.value}`} key={family.value}>{family.label}</Link>)}</div>
    </section>
  </>;
}
