"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { daysAgo, type JobsSnapshot, type PublicJob } from "@/lib/jobs";
import { formatSnapshotAge, getSupportedJobRegions, JOB_REGIONS, normalizeJobLocation, type JobRegion } from "@/lib/job-locations";
import { isInCollection } from "@/lib/job-collections";
import { companyTierLabel, hasCompanyTier, type CompanyTier } from "@/lib/company-tiers";
import { isRoleArea, matchesRoleArea, ROLE_AREAS } from "@/lib/role-areas";

const PAGE_SIZE = 100;
const LAYOUT_TRANSITION_MS = 1050;
const modeLabels: Record<PublicJob["workMode"], string> = { remote: "Remote", hybrid: "Hybrid", in_person: "In person", unknown: "" };
const displayText = (value: string) => value.replace(/[\u2013\u2014]/g, "-");
const splitLocations = (location: string) => {
  const semicolonLocations = location.split(";").map((item) => item.trim()).filter(Boolean);
  if (semicolonLocations.length > 1) return semicolonLocations;
  const usCityStateLocations = location.match(/(?:[^,;]+,\s*)?[A-Za-z .'-]+,\s*[A-Z]{2}(?:,\s*Canada)?/g)?.map((item) => item.trim()) ?? [];
  return usCityStateLocations.length > 1 ? usCityStateLocations : semicolonLocations;
};
const getLocationDisplay = (location: string) => {
  const full = displayText(normalizeJobLocation(location));
  const locations = splitLocations(full);
  return {
    full,
    hasMore: locations.length > 1,
    compact: locations.length > 1 ? `${locations[0]} + ${locations.length - 1} more` : full,
  };
};
type ViewMode = "compact" | "cards";

export function JobBoard({ type }: { type: "internships" | "fulltime" }) {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const roleArea = isRoleArea(roleParam) ? roleParam : "all";
  const [snapshot, setSnapshot] = useState<JobsSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [regions, setRegions] = useState<JobRegion[]>(["us"]);
  const [modes, setModes] = useState<string[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [companyTiers, setCompanyTiers] = useState<CompanyTier[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [activeView, setActiveView] = useState<ViewMode>("compact");
  const [exitingView, setExitingView] = useState<ViewMode | null>(null);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    fetch(`/${type}.json`, { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error("Could not load jobs");
      return response.json() as Promise<JobsSnapshot>;
    }).then(setSnapshot).catch(() => setError(true));
  }, [type]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!exitingView) return;
    const timer = window.setTimeout(() => setExitingView(null), LAYOUT_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [exitingView]);

  const terms = useMemo(() => [...new Set((snapshot?.jobs ?? []).map((job) => job.term).filter((value) => value !== "Not stated"))].sort(), [snapshot]);
  const jobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (snapshot?.jobs ?? []).filter((job) => {
      const search = `${job.company} ${job.title} ${job.location}`.toLowerCase();
      const inCollection = isInCollection(job, type);
      return inCollection && (!normalizedQuery || search.includes(normalizedQuery))
        && matchesRoleArea(job, roleArea)
        && (regions.length === 0 || regions.some((region) => (job.regions ?? getSupportedJobRegions(job.location)).includes(region)))
        && (modes.length === 0 || modes.includes(job.workMode))
        && (selectedTerms.length === 0 || selectedTerms.includes(job.term))
        && (companyTiers.length === 0 || companyTiers.some((tier) => hasCompanyTier(job.company, tier)));
    }).sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [snapshot, type, roleArea, query, regions, modes, selectedTerms, companyTiers]);

  if (error) return <p className="state-card">The latest job snapshot could not be loaded. Please try again shortly.</p>;
  if (!snapshot) return <p className="state-card">Loading verified jobs…</p>;

  const pageCount = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const visibleJobs = jobs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const emptyMessage = query.trim().toLowerCase() === "henwoo" ? "lmaoo imagine if this actually returned smth" : "No verified jobs match these filters.";
  const changeView = (nextView: ViewMode) => {
    if (nextView === activeView) return;
    setViewMode(nextView);
    setExitingView(activeView);
    setActiveView(nextView);
  };
  const renderCompactView = (className = "") => <div className={`layout-panel compact-panel ${className}`}>
    <div className="job-table" role="table" aria-label="Verified jobs">
      <div className="job-table-head" role="row"><span role="columnheader">Company</span><span role="columnheader">Position</span><span role="columnheader">Location</span><span role="columnheader">Apply</span><span role="columnheader">LinkedIn</span></div>
      {visibleJobs.map((job) => {
        const location = getLocationDisplay(job.location);
        return <article className="job-table-row" role="row" key={job.id}>
          <div className="job-table-company" role="cell" data-label="Company">{displayText(job.company)}</div>
          <div className="job-table-title" role="cell" data-label="Position">{displayText(job.title)}</div>
          <div className="job-table-location" role="cell" data-label="Location">{location.hasMore ? <span className="location-with-more" tabIndex={0}><span className="location-label">{location.compact}</span><span className="location-popover" role="tooltip">{location.full}</span></span> : location.compact}</div>
          <div className="job-table-action" role="cell" data-label="Apply"><a className="button table-button primary" href={job.applyUrl} target="_blank" rel="noreferrer">Apply</a></div>
          <div className="job-table-action" role="cell" data-label="LinkedIn"><a className="button table-button secondary" href={job.linkedInUrl ?? `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(job.company)}`} target="_blank" rel="noreferrer">LinkedIn</a></div>
        </article>;
      })}
      {jobs.length === 0 && <p className="job-table-empty">{emptyMessage}</p>}
    </div>
  </div>;
  const renderCardsView = (className = "") => <div className={`layout-panel cards-panel ${className}`}>
    <div className="column-labels card-column-labels"><span>Role</span><span>Posted</span><span>Links</span></div>
    <div className="job-list">
      {visibleJobs.map((job) => <article className="job-card" key={job.id}>
        <div className="job-main"><p className="company">{displayText(job.company)}</p><h2>{displayText(job.title)}</h2><div className="job-meta"><span>{displayText(normalizeJobLocation(job.location))}</span>{modeLabels[job.workMode] && <span>{modeLabels[job.workMode]}</span>}{job.term !== "Not stated" && <span>{displayText(job.term)}</span>}</div></div>
        <div className="posted-age">{daysAgo(job.postedAt)} days</div>
        <div className="actions"><a className="button secondary" href={job.linkedInUrl ?? `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(job.company)}`} target="_blank" rel="noreferrer">LinkedIn</a><button className="button secondary" type="button" onClick={() => setExpanded(expanded === job.id ? null : job.id)} aria-expanded={expanded === job.id}>Info</button><a className="button primary" href={job.applyUrl} target="_blank" rel="noreferrer">Apply</a></div>
        {expanded === job.id && <div className="job-info"><p><strong>Posted:</strong> {new Date(job.postedAt).toLocaleDateString()}</p><p><strong>Employees:</strong> {job.employeeCount ? `${job.employeeCount.toLocaleString()}+` : "Not listed"}</p><p><strong>Status:</strong> {companyTierLabel(job.company)}</p></div>}
      </article>)}
      {jobs.length === 0 && <p className="state-card">{emptyMessage}</p>}
    </div>
  </div>;
  const isSwitching = exitingView !== null;
  return <>
    <nav className="role-tabs" aria-label="Role area">{ROLE_AREAS.map((area) => <Link className={roleArea === area.value ? "active" : ""} href={area.value === "all" ? `/${type === "internships" ? "internships" : "jobs"}` : `/${type === "internships" ? "internships" : "jobs"}?role=${area.value}`} key={area.value}>{area.label}</Link>)}</nav>
    <div className="board-stats"><span><i />Live</span><strong>{jobs.length}</strong> matching roles <span className="updated" title={new Date(snapshot.generatedAt).toLocaleString()}>Last updated: {formatSnapshotAge(snapshot.generatedAt, now)}</span></div>
    <section className="filters" aria-label="Job filters">
      <label className="search-field"><span>Search</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Company or role" /></label>
      <MultiFilter label="Location" values={regions} onChange={(values) => { setRegions(values as JobRegion[]); setPage(0); }} options={JOB_REGIONS} allLabel="All locations" />
      <MultiFilter label="Workplace" values={modes} onChange={(values) => { setModes(values); setPage(0); }} options={[["remote", "Remote"], ["hybrid", "Hybrid"], ["in_person", "In person"]]} />
      <MultiFilter label="Term" values={selectedTerms} onChange={(values) => { setSelectedTerms(values); setPage(0); }} options={terms.map((value) => [value, value] as [string, string])} />
      <MultiFilter label="Company tier" values={companyTiers} onChange={(values) => { setCompanyTiers(values as CompanyTier[]); setPage(0); }} options={[["faang_plus", "FAANG+"], ["fortune_500", "Fortune 500"]]} />
      <div className="filter-control"><span>Layout</span><div className={`view-toggle ${viewMode === "cards" ? "cards-active" : ""}`} role="group" aria-label="Job layout"><button className={viewMode === "compact" ? "active" : ""} type="button" onClick={() => changeView("compact")} aria-pressed={viewMode === "compact"}>Compact</button><button className={viewMode === "cards" ? "active" : ""} type="button" onClick={() => changeView("cards")} aria-pressed={viewMode === "cards"}>Cards</button></div></div>
    </section>
    <div className={`layout-stage ${isSwitching ? "is-switching" : ""}`}>
      {exitingView === "compact" && renderCompactView("panel-exit compact-exit")}
      {exitingView === "cards" && renderCardsView("panel-exit cards-exit")}
      {activeView === "compact" ? renderCompactView(isSwitching ? "panel-enter compact-enter" : "") : renderCardsView(isSwitching ? "panel-enter cards-enter" : "")}
    </div>
    {jobs.length > PAGE_SIZE && <nav className="pagination" aria-label="Job pages"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} of {pageCount}</span><button disabled={page + 1 === pageCount} onClick={() => setPage(page + 1)}>Next</button></nav>}
  </>;
}

function MultiFilter({ label, values, onChange, options, allLabel = "All" }: { label: string; values: readonly string[]; onChange: (values: string[]) => void; options: ReadonlyArray<readonly [string, string]>; allLabel?: string }) {
  const summary = values.length === 0 ? "All" : values.length === 1 ? options.find(([value]) => value === values[0])?.[1] : `${values.length} selected`;
  const toggle = (value: string) => onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  return <div className="filter-control"><span>{label}</span><details className="multi-filter"><summary>{summary}</summary><div className="multi-filter-menu"><label><input type="checkbox" checked={values.length === 0} onChange={() => onChange([])} />{allLabel}</label>{options.map(([value, optionLabel]) => <label key={value}><input type="checkbox" checked={values.includes(value)} onChange={() => toggle(value)} />{optionLabel}</label>)}</div></details></div>;
}
