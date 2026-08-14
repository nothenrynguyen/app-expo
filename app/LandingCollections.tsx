"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { JobsSummary } from "@/lib/job-summary";
import { ROLE_AREAS } from "@/lib/role-areas";

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
        <h2>Current internships</h2>
        <p className="collection-subtitle"><strong className="collection-count">{summary ? summary.internships : "Loading"}</strong> current jobs available</p>
        <span className="collection-link">Browse internships <b>→</b></span>
      </Link>
      <Link className="collection-card" href="/jobs">
        <h2>Current full-time jobs</h2>
        <p className="collection-subtitle"><strong className="collection-count">{summary ? summary.fulltime : "Loading"}</strong> current jobs available</p>
        <span className="collection-link">Browse full-time jobs <b>→</b></span>
      </Link>
    </div>
    <section className="role-shortcuts">
      <p className="eyebrow">Browse internships by role</p>
      <div>{ROLE_AREAS.filter((area) => area.value !== "all").map((area) => <Link href={`/internships?role=${area.value}`} key={area.value}>{area.label}</Link>)}</div>
    </section>
  </>;
}
