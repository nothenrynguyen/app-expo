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
import { useHiddenCompanies } from "./useHiddenCompanies";
import { companyPreferenceKey } from "@/lib/hidden-companies";
import { HiddenCompanies } from "./job-board/HiddenCompanies";
import { useSavedJobDetails } from "./useSavedJobDetails";
import { missingSavedDetails } from "@/lib/saved-job-details";
import { UnavailableSavedJobs } from "./job-board/UnavailableSavedJobs";
import { useApplicationStatuses } from "./useApplicationStatuses";
import { APPLICATION_STATUSES, isApplicationStatus, matchesApplicationStatus, type ApplicationStatus } from "@/lib/application-status";

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
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">("All");
  const { statuses } = useApplicationStatuses();
  const { companies: hiddenCompanies, update: updateHiddenCompany, storageError: hiddenError } = useHiddenCompanies();
  const hiddenKeys = useMemo(() => new Set(hiddenCompanies.map((company) => company.key)), [hiddenCompanies]);
  const [hiddenCompaniesOpen, setHiddenCompaniesOpen] = useState(false);
  const [lastHidden, setLastHidden] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [activeView, setActiveView] = useState<ViewMode>("compact");
  const [exitingView, setExitingView] = useState<ViewMode | null>(null);
  const [page, setPage] = useState(0);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const { ids: savedJobIds, toggle: toggleSavedJob, storageError } = useSavedJobs();

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
  const { details: savedDetails, storageError: detailsError } = useSavedJobDetails(savedJobIds, sourceJobs, type, snapshot !== null);
  const unavailableSaved = missingSavedDetails(savedDetails, savedJobIds, sourceJobs, type);
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
    }).filter((job) => savedOnly ? matchesApplicationStatus(job.id, statuses, statusFilter) : !hiddenKeys.has(companyPreferenceKey(job.company))),
    [sourceJobs, type, roleSelection, query, regions, metros, modes, selectedTerms, companyTiers, savedOnly, savedJobIds, statuses, statusFilter, hiddenKeys],
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
          <span aria-hidden="true">★</span> Saved {savedInCollectionCount + unavailableSaved.length}
        </button>
      </div>
      <div className="hidden-companies-toolbar"><button className="hidden-companies-toggle" type="button" aria-expanded={hiddenCompaniesOpen} aria-controls="hidden-companies-panel" title="Companies hidden in this browser" onClick={() => setHiddenCompaniesOpen((open) => !open)}>{hiddenCompaniesOpen ? "Hide company list" : "Show hidden companies"} ({hiddenCompanies.length})</button></div>
      {hiddenCompaniesOpen ? <HiddenCompanies companies={hiddenCompanies} onRestore={(name) => { if (updateHiddenCompany(name, false)) { setLastHidden(null); resetPage(); } }} /> : null}
      {lastHidden && hiddenKeys.has(companyPreferenceKey(lastHidden)) ? <div className="hidden-company-notice" role="status">{lastHidden} hidden from your feed. <button type="button" onClick={() => { if (updateHiddenCompany(lastHidden, false)) { setLastHidden(null); resetPage(); } }}>Undo</button></div> : null}
      {hiddenError ? <p role="alert" className="state-card">Could not save your hidden-company preference. Check that browser storage is available and try again.</p> : null}
      {storageError ? <p role="alert" className="state-card">Could not save your change. Check that browser storage is available.</p> : null}
      {detailsError ? <p role="alert" className="state-card">Your saved IDs are retained, but listing details could not be stored. Missing listings may not remain readable after a refresh.</p> : null}
      {savedOnly ? <p className="saved-jobs-notice">Saved jobs and application statuses stay in this browser. Set statuses yourself after applying. Opening Apply does not mark a job as applied. Removing a saved job keeps its status if you save it again. Clearing site storage removes both.</p> : null}
      {savedOnly ? <label className="saved-status-filter">Application status <select value={statusFilter} onChange={(event) => {
        const value = event.target.value;
        if (value === "All" || isApplicationStatus(value)) { setStatusFilter(value); resetPage(); }
      }}><option value="All">All statuses</option>{APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label> : null}
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
        emptyMessage={!savedOnly && hiddenCompanies.length ? `${emptyMessage} Some companies are hidden. Open Show hidden companies above to restore them.` : emptyMessage}
        savedJobIds={savedJobIds}
        expandedJobId={expandedJobId}
        onToggleSaved={toggleSavedJob}
        onHideCompany={savedOnly ? undefined : (name) => { if (updateHiddenCompany(name, true)) { setLastHidden(name); resetPage(); } }}
        onToggleExpanded={(jobId) => setExpandedJobId((current) => current === jobId ? null : jobId)}
      />
      {jobs.length > PAGE_SIZE ? (
        <nav className="pagination" aria-label="Job pages">
          <button disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
          <span>Page {safePage + 1} of {pageCount}</span>
          <button disabled={safePage + 1 === pageCount} onClick={() => setPage(safePage + 1)}>Next</button>
        </nav>
      ) : null}
      {savedOnly ? <UnavailableSavedJobs jobs={unavailableSaved} onRemove={toggleSavedJob} /> : null}
    </>
  );
}
