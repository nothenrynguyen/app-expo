"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CompanyTier } from "@/lib/company-tiers";
import { countSavedJobs, filterJobs, getAvailableMetroOptions, getJobTerms } from "@/lib/job-board";
import { formatSnapshotAge, type JobMetro, type JobRegion } from "@/lib/job-locations";
import type { JobsSnapshot } from "@/lib/jobs";
import { getJobRoleTags, getRoleSelection, getRoleTagsForFamily } from "@/lib/role-areas";
import { JobFilters, RoleTabs } from "./job-board/JobFilters";
import { JobResults } from "./job-board/JobResults";
import { getPaginationState, LAYOUT_TRANSITION_MS, PAGE_SIZE, type ViewMode } from "./job-board/job-board-utils";
import { useSavedJobs } from "./useSavedJobs";

type JobBoardProps = {
  type: "internships" | "fulltime";
};

const EMPTY_JOBS: JobsSnapshot["jobs"] = [];

export function JobBoard({ type }: JobBoardProps) {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const specialtyParam = searchParams.get("specialty");
  const roleSelection = useMemo(() => getRoleSelection(roleParam, specialtyParam), [roleParam, specialtyParam]);
  const [snapshot, setSnapshot] = useState<JobsSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [regions, setRegions] = useState<JobRegion[]>(["us"]);
  const [metros, setMetros] = useState<JobMetro[]>([]);
  const [modes, setModes] = useState<string[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [companyTiers, setCompanyTiers] = useState<CompanyTier[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [activeView, setActiveView] = useState<ViewMode>("compact");
  const [exitingView, setExitingView] = useState<ViewMode | null>(null);
  const [page, setPage] = useState(0);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const { ids: savedJobIds, toggle: toggleSavedJob } = useSavedJobs();

  useEffect(() => {
    fetch(`/${type}.json`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load jobs");
        return response.json() as Promise<JobsSnapshot>;
      })
      .then(setSnapshot)
      .catch(() => setError(true));
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

  const sourceJobs = snapshot?.jobs ?? EMPTY_JOBS;
  const engineeringSpecialties = useMemo(() => {
    const availableTags = new Set(sourceJobs.flatMap((job) => getJobRoleTags(job)));
    return getRoleTagsForFamily("engineering").filter((specialty) => availableTags.has(specialty.value));
  }, [sourceJobs]);
  const terms = useMemo(() => getJobTerms(sourceJobs), [sourceJobs]);
  const metroOptions = useMemo(
    () => getAvailableMetroOptions(sourceJobs, type, regions),
    [sourceJobs, type, regions],
  );
  const jobs = useMemo(
    () => filterJobs(sourceJobs, {
      type,
      roleSelection,
      query,
      regions,
      metros,
      modes,
      terms: selectedTerms,
      companyTiers: roleSelection.family === "engineering" ? [] : companyTiers,
      savedOnly,
      savedJobIds,
    }),
    [sourceJobs, type, roleSelection, query, regions, metros, modes, selectedTerms, companyTiers, savedOnly, savedJobIds],
  );

  if (error) return <p className="state-card">The latest job snapshot could not be loaded. Please try again shortly.</p>;
  if (!snapshot) return <p className="state-card">Loading verified jobs…</p>;

  const { pageCount, safePage, startIndex, endIndex } = getPaginationState(jobs.length, page);
  const visibleJobs = jobs.slice(startIndex, endIndex);
  const savedInCollectionCount = countSavedJobs(snapshot.jobs, type, savedJobIds);
  const emptyMessage = savedOnly
    ? "No saved jobs match these filters."
    : query.trim().toLowerCase() === "henwoo"
      ? "lmaoo imagine if this actually returned smth"
      : "No verified jobs match these filters.";

  const resetPage = () => setPage(0);
  const changeView = (nextView: ViewMode) => {
    if (nextView === activeView) return;
    setViewMode(nextView);
    setExitingView(activeView);
    setActiveView(nextView);
  };

  return (
    <>
      <div className="role-toolbar">
        <RoleTabs selection={roleSelection} type={type} />
        <button
          className={`saved-filter category-saved ${savedOnly ? "active" : ""}`}
          type="button"
          onClick={() => { setSavedOnly((current) => !current); resetPage(); }}
          aria-pressed={savedOnly}
          title="Saved in this browser"
        >
          <span aria-hidden="true">★</span> Saved {savedInCollectionCount}
        </button>
      </div>
      <div className="board-stats" title={new Date(snapshot.generatedAt).toLocaleString()}>
        <span className="live-status"><i />Live</span>
        <span className="refresh-age">· refreshed {formatSnapshotAge(snapshot.generatedAt, now)}</span>
        <span className="matching-count"><strong>{jobs.length}</strong> matching roles</span>
      </div>
      <JobFilters
        query={query}
        regions={regions}
        metros={metros}
        metroOptions={metroOptions}
        modes={modes}
        selectedTerms={selectedTerms}
        terms={terms}
        companyTiers={companyTiers}
        engineeringSpecialties={engineeringSpecialties}
        roleSelection={roleSelection}
        type={type}
        viewMode={viewMode}
        onQueryChange={(value) => { setQuery(value); resetPage(); }}
        onRegionsChange={(values) => { setRegions(values); setMetros([]); resetPage(); }}
        onMetrosChange={(values) => { setMetros(values); resetPage(); }}
        onModesChange={(values) => { setModes(values); resetPage(); }}
        onTermsChange={(values) => { setSelectedTerms(values); resetPage(); }}
        onCompanyTiersChange={(values) => { setCompanyTiers(values); resetPage(); }}
        onViewChange={changeView}
      />
      <JobResults
        activeView={activeView}
        exitingView={exitingView}
        jobs={visibleJobs}
        totalJobCount={jobs.length}
        emptyMessage={emptyMessage}
        savedJobIds={savedJobIds}
        expandedJobId={expandedJobId}
        onToggleSaved={toggleSavedJob}
        onToggleExpanded={(jobId) => setExpandedJobId((current) => current === jobId ? null : jobId)}
      />
      {jobs.length > PAGE_SIZE ? (
        <nav className="pagination" aria-label="Job pages">
          <button disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
          <span>Page {safePage + 1} of {pageCount}</span>
          <button disabled={safePage + 1 === pageCount} onClick={() => setPage(safePage + 1)}>Next</button>
        </nav>
      ) : null}
    </>
  );
}
