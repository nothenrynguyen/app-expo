"use client";

import { useEffect, useMemo, useState } from "react";
import { daysAgo, type JobsSnapshot, type PublicJob } from "@/lib/jobs";
import { isInCollection } from "@/lib/job-collections";

const PAGE_SIZE = 100;
const modeLabels: Record<PublicJob["workMode"], string> = { remote: "Remote", hybrid: "Hybrid", in_person: "In person", unknown: "" };
const displayText = (value: string) => value.replace(/[\u2013\u2014]/g, "-");

export function JobBoard({ type }: { type: "internships" | "fulltime" }) {
  const [snapshot, setSnapshot] = useState<JobsSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [mode, setMode] = useState("all");
  const [term, setTerm] = useState("all");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/${type}.json`, { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error("Could not load jobs");
      return response.json() as Promise<JobsSnapshot>;
    }).then(setSnapshot).catch(() => setError(true));
  }, [type]);

  const terms = useMemo(() => [...new Set((snapshot?.jobs ?? []).map((job) => job.term).filter((value) => value !== "Not stated"))].sort(), [snapshot]);
  const jobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedLocation = location.trim().toLowerCase();
    return (snapshot?.jobs ?? []).filter((job) => {
      const search = `${job.company} ${job.title} ${job.location}`.toLowerCase();
      const inCollection = isInCollection(job, type);
      return inCollection && (!normalizedQuery || search.includes(normalizedQuery))
        && (!normalizedLocation || job.location.toLowerCase().includes(normalizedLocation))
        && (mode === "all" || job.workMode === mode)
        && (term === "all" || job.term === term);
    }).sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [snapshot, type, query, location, mode, term]);

  if (error) return <p className="state-card">The latest job snapshot could not be loaded. Please try again shortly.</p>;
  if (!snapshot) return <p className="state-card">Loading verified jobs…</p>;

  const pageCount = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const visibleJobs = jobs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return <>
    <div className="board-stats"><span><i />Live</span><strong>{jobs.length}</strong> matching roles <span className="updated">Updated {daysAgo(snapshot.generatedAt) === 0 ? "today" : `${daysAgo(snapshot.generatedAt)} days ago`}</span></div>
    <section className="filters" aria-label="Job filters">
      <label className="search-field"><span>Search</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Company or role" /></label>
      <label><span>Location</span><input value={location} onChange={(event) => { setLocation(event.target.value); setPage(0); }} placeholder="City, state, or US" /></label>
      <Filter label="Workplace" value={mode} onChange={(value) => { setMode(value); setPage(0); }} options={[["all", "All"], ["remote", "Remote"], ["hybrid", "Hybrid"], ["in_person", "In person"]]} />
      <Filter label="Term" value={term} onChange={(value) => { setTerm(value); setPage(0); }} options={[["all", "All"], ...terms.map((value) => [value, value] as [string, string])]} />
    </section>
    <div className="column-labels"><span>Role</span><span>Posted</span><span>Links</span></div>
    <div className="job-list">
      {visibleJobs.map((job) => <article className="job-card" key={job.id}>
        <div className="job-main"><p className="company">{displayText(job.company)}</p><h2>{displayText(job.title)}</h2><div className="job-meta"><span>{displayText(job.location)}</span>{modeLabels[job.workMode] && <span>{modeLabels[job.workMode]}</span>}{job.term !== "Not stated" && <span>{displayText(job.term)}</span>}</div></div>
        <div className="posted-age">{daysAgo(job.postedAt)} days</div>
        <div className="actions"><a className="button secondary" href={job.linkedInUrl ?? `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(job.company)}`} target="_blank" rel="noreferrer">LinkedIn</a><button className="button secondary" type="button" onClick={() => setExpanded(expanded === job.id ? null : job.id)} aria-expanded={expanded === job.id}>Info</button><a className="button primary" href={job.applyUrl} target="_blank" rel="noreferrer">Apply</a></div>
        {expanded === job.id && <div className="job-info"><p><strong>Posted:</strong> {new Date(job.postedAt).toLocaleDateString()} · {job.postedAtSource.replaceAll("_", " ")}</p><p><strong>Source:</strong> {job.sources.join(", ")}</p>{job.salary && <p><strong>Compensation:</strong> {displayText(job.salary)}</p>}<p>Company eligibility was verified before this listing was published.</p></div>}
      </article>)}
      {jobs.length === 0 && <p className="state-card">No verified jobs match these filters.</p>}
    </div>
    {jobs.length > PAGE_SIZE && <nav className="pagination" aria-label="Job pages"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} of {pageCount}</span><button disabled={page + 1 === pageCount} onClick={() => setPage(page + 1)}>Next</button></nav>}
  </>;
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}
