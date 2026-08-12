"use client";

import { useEffect, useMemo, useState } from "react";
import { daysAgo, type JobsSnapshot, type PublicJob } from "@/lib/jobs";

const modeLabels: Record<PublicJob["workMode"], string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  in_person: "In person",
  unknown: "Not stated",
};

export function JobBoard() {
  const [snapshot, setSnapshot] = useState<JobsSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [mode, setMode] = useState("all");
  const [term, setTerm] = useState("all");
  const [category, setCategory] = useState("all");
  const [maxAge, setMaxAge] = useState("30");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/jobs.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load jobs");
        return response.json() as Promise<JobsSnapshot>;
      })
      .then(setSnapshot)
      .catch(() => setError(true));
  }, []);

  const options = useMemo(() => ({
    terms: [...new Set(snapshot?.jobs.map((job) => job.term) ?? [])].sort(),
    categories: [...new Set(snapshot?.jobs.map((job) => job.category) ?? [])].sort(),
  }), [snapshot]);

  const jobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedLocation = location.trim().toLowerCase();
    return (snapshot?.jobs ?? []).filter((job) => {
      const search = `${job.company} ${job.title} ${job.location}`.toLowerCase();
      return (!normalizedQuery || search.includes(normalizedQuery))
        && (!normalizedLocation || job.location.toLowerCase().includes(normalizedLocation))
        && (mode === "all" || job.workMode === mode)
        && (term === "all" || job.term === term)
        && (category === "all" || job.category === category)
        && daysAgo(job.postedAt) <= Number(maxAge);
    });
  }, [snapshot, query, location, mode, term, category, maxAge]);

  if (error) return <p className="state-card">The latest job snapshot could not be loaded. Please try again shortly.</p>;
  if (!snapshot) return <p className="state-card">Loading verified jobs…</p>;

  return (
    <>
      <section className="filters" aria-label="Job filters">
        <label className="search-field">
          <span>Search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Company, role, or location" />
        </label>
        <label>
          <span>Location</span>
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, state, or US" />
        </label>
        <Filter label="Workplace" value={mode} onChange={setMode} options={[
          ["all", "All"], ["remote", "Remote"], ["hybrid", "Hybrid"], ["in_person", "In person"], ["unknown", "Not stated"],
        ]} />
        <Filter label="Term" value={term} onChange={setTerm} options={[["all", "All"], ...options.terms.map((value) => [value, value] as [string, string])]} />
        <Filter label="Category" value={category} onChange={setCategory} options={[["all", "All"], ...options.categories.map((value) => [value, value] as [string, string])]} />
        <Filter label="Posted" value={maxAge} onChange={setMaxAge} options={[["1", "Past day"], ["3", "Past 3 days"], ["7", "Past 7 days"], ["14", "Past 14 days"], ["30", "Past 30 days"], ["3650", "Any time"]]} />
      </section>

      <div className="result-summary">
        <p><strong>{jobs.length}</strong> verified job{jobs.length === 1 ? "" : "s"}</p>
        <p>Updated {daysAgo(snapshot.generatedAt) === 0 ? "today" : `${daysAgo(snapshot.generatedAt)} days ago`}</p>
      </div>

      <div className="job-list">
        {jobs.map((job) => (
          <article className="job-card" key={job.id}>
            <div className="job-main">
              <p className="company">{job.company}</p>
              <h2>{job.title}</h2>
              <div className="job-meta">
                <span>{job.term}</span><span>{job.location}</span><span>{modeLabels[job.workMode]}</span>
              </div>
            </div>
            <div className="posted-age">{daysAgo(job.postedAt)} days ago</div>
            <div className="actions">
              <a className="button secondary" href={job.linkedInUrl ?? `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(job.company)}`} target="_blank" rel="noreferrer">LinkedIn</a>
              <button className="button secondary" type="button" onClick={() => setExpanded(expanded === job.id ? null : job.id)} aria-expanded={expanded === job.id}>Info</button>
              <a className="button primary" href={job.applyUrl} target="_blank" rel="noreferrer">Apply</a>
            </div>
            {expanded === job.id && (
              <div className="job-info">
                <p><strong>Posted:</strong> {new Date(job.postedAt).toLocaleDateString()} · {job.postedAtSource.replaceAll("_", " ")}</p>
                <p><strong>Source:</strong> {job.sources.join(", ")}</p>
                {job.salary && <p><strong>Compensation:</strong> {job.salary}</p>}
                <p>Company eligibility was verified before this listing was published.</p>
              </div>
            )}
          </article>
        ))}
        {jobs.length === 0 && <p className="state-card">No verified jobs match these filters.</p>}
      </div>
    </>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}
