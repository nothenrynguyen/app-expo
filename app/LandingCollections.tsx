"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { JobsSnapshot } from "@/lib/jobs";
import { ROLE_AREAS } from "@/lib/role-areas";

type Counts = { internships: number; fulltime: number };

export function LandingCollections() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    Promise.all(["internships", "fulltime"].map((collection) => fetch(`/${collection}.json`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<JobsSnapshot> : Promise.reject())))
      .then(([internships, fulltime]) => setCounts({ internships: internships.jobs.length, fulltime: fulltime.jobs.length }))
      .catch(() => setCounts(null));
  }, []);

  return <>
    <div className="collection-grid">
      <Link className="collection-card" href="/internships">
        <h2>Current internships</h2>
        <p className="collection-subtitle"><strong className="collection-count">{counts ? counts.internships : "Loading"}</strong> current jobs available</p>
        <span className="collection-link">Browse internships <b>→</b></span>
      </Link>
      <Link className="collection-card" href="/jobs">
        <h2>Current full-time jobs</h2>
        <p className="collection-subtitle"><strong className="collection-count">{counts ? counts.fulltime : "Loading"}</strong> current jobs available</p>
        <span className="collection-link">Browse full-time jobs <b>→</b></span>
      </Link>
    </div>
    <section className="role-shortcuts">
      <p className="eyebrow">Browse internships by role</p>
      <div>{ROLE_AREAS.filter((area) => area.value !== "all").map((area) => <Link href={`/internships?role=${area.value}`} key={area.value}>{area.label}</Link>)}</div>
    </section>
  </>;
}
