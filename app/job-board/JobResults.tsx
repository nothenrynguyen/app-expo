import Image from "next/image";
import { useState } from "react";
import { ApplicationStatusSelect } from "./ApplicationStatusSelect";
import { companyTierLabel } from "@/lib/company-tiers";
import { normalizeJobLocation } from "@/lib/job-locations";
import { daysAgo, type PublicJob } from "@/lib/jobs";
import { displayText, getLinkedInUrl, getLocationDisplay, modeLabels, type ViewMode } from "./job-board-utils";

const logoToken = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
const showCompanyLogos = Boolean(logoToken);

type JobResultsProps = {
  activeView: ViewMode;
  exitingView: ViewMode | null;
  jobs: readonly PublicJob[];
  totalJobCount: number;
  emptyMessage: string;
  savedJobIds: ReadonlySet<string>;
  expandedJobId: string | null;
  onToggleSaved: (jobId: string) => void;
  onHideCompany?: (name: string) => void;
  onToggleExpanded: (jobId: string) => void;
};

export function JobResults({
  activeView,
  exitingView,
  jobs,
  totalJobCount,
  emptyMessage,
  savedJobIds,
  expandedJobId,
  onToggleSaved,
  onHideCompany,
  onToggleExpanded,
}: JobResultsProps) {
  const isSwitching = exitingView !== null;
  const renderCompact = (className = "") => (
    <CompactJobView
      className={className}
      jobs={jobs}
      totalJobCount={totalJobCount}
      emptyMessage={emptyMessage}
      savedJobIds={savedJobIds}
      onToggleSaved={onToggleSaved}
      onHideCompany={onHideCompany}
    />
  );
  const renderCards = (className = "") => (
    <CardJobView
      className={className}
      jobs={jobs}
      totalJobCount={totalJobCount}
      emptyMessage={emptyMessage}
      savedJobIds={savedJobIds}
      expandedJobId={expandedJobId}
      onToggleSaved={onToggleSaved}
      onHideCompany={onHideCompany}
      onToggleExpanded={onToggleExpanded}
    />
  );

  return (
    <div className={`layout-stage ${isSwitching ? "is-switching" : ""}`}>
      {exitingView === "compact" ? renderCompact("panel-exit compact-exit") : null}
      {exitingView === "cards" ? renderCards("panel-exit cards-exit") : null}
      {activeView === "compact"
        ? renderCompact(isSwitching ? "panel-enter compact-enter" : "")
        : renderCards(isSwitching ? "panel-enter cards-enter" : "")}
    </div>
  );
}

function CompactJobView({ className, jobs, totalJobCount, emptyMessage, savedJobIds, onToggleSaved, onHideCompany }: {
  className: string;
  jobs: readonly PublicJob[];
  totalJobCount: number;
  emptyMessage: string;
  savedJobIds: ReadonlySet<string>;
  onToggleSaved: (jobId: string) => void;
  onHideCompany?: (name: string) => void;
}) {
  return (
    <div className={`layout-panel compact-panel ${className}`}>
      <div className="job-table" role="table" aria-label="Verified jobs">
        <div className={`job-table-head ${onHideCompany ? "with-more-actions" : ""}`} role="row">
          <span role="columnheader">Company</span>
          <span role="columnheader">Position</span>
          <span role="columnheader">Location</span>
          <span role="columnheader">Save</span>
          <span role="columnheader">Apply</span>
          <span role="columnheader">LinkedIn</span>
          {onHideCompany ? <span role="columnheader" aria-label="More actions" /> : null}
        </div>
        {jobs.map((job) => {
          const location = getLocationDisplay(job.location);
          return (
            <article className={`job-table-row ${onHideCompany ? "with-more-actions" : ""}`} role="row" key={job.id}>
              <div className="job-table-company" role="cell" data-label="Company">{displayText(job.company)}</div>
              <div className="job-table-title" role="cell" data-label="Position">{displayText(job.title)}</div>
              <div className="job-table-location" role="cell" data-label="Location">
                {location.hasMore
                  ? <span className="location-with-more" tabIndex={0}><span className="location-label">{location.compact}</span><span className="location-popover" role="tooltip">{location.full}</span></span>
                  : <span className="location-label" title={location.full}>{location.compact}</span>}
              </div>
              <div className="job-table-action" role="cell" data-label="Save"><SaveButton compact isSaved={savedJobIds.has(job.id)} job={job} onToggle={() => onToggleSaved(job.id)} /></div>
              <div className="job-table-action" role="cell" data-label="Apply"><a className="button table-button primary" href={job.applyUrl} target="_blank" rel="noreferrer">Apply</a></div>
              <div className="job-table-action" role="cell" data-label="LinkedIn"><a className="button table-button secondary" href={getLinkedInUrl(job)} target="_blank" rel="noreferrer">LinkedIn</a></div>
              {onHideCompany ? <div className="job-table-action" role="cell" data-label="More"><CompanyActions company={job.company} onHide={onHideCompany} /></div> : null}
            </article>
          );
        })}
        {totalJobCount === 0 ? <p className="job-table-empty">{emptyMessage}</p> : null}
      </div>
    </div>
  );
}

function CardJobView({ className, jobs, totalJobCount, emptyMessage, savedJobIds, expandedJobId, onToggleSaved, onToggleExpanded, onHideCompany }: {
  className: string;
  jobs: readonly PublicJob[];
  totalJobCount: number;
  emptyMessage: string;
  savedJobIds: ReadonlySet<string>;
  expandedJobId: string | null;
  onToggleSaved: (jobId: string) => void;
  onHideCompany?: (name: string) => void;
  onToggleExpanded: (jobId: string) => void;
}) {
  return (
    <div className={`layout-panel cards-panel ${className}`}>
      <div className="job-list">
        {jobs.map((job) => (
          <article className={`job-card ${showCompanyLogos ? "with-logo" : ""}`} key={job.id}>
            {showCompanyLogos ? <CompanyLogo company={job.company} /> : null}
            <div className="job-main">
              <p className="company">{displayText(job.company)}</p>
              <h2>{displayText(job.title)}</h2>
              <div className="job-meta">
                <span>{displayText(normalizeJobLocation(job.location))}</span>
                {modeLabels[job.workMode] ? <span>{modeLabels[job.workMode]}</span> : null}
                {job.term !== "Not stated" ? <span>{displayText(job.term)}</span> : null}
              </div>
            </div>
            <div className="posted-age">{daysAgo(job.postedAt)} days</div>
            <div className="actions">
              <SaveButton isSaved={savedJobIds.has(job.id)} job={job} onToggle={() => onToggleSaved(job.id)} />
              <a className="button secondary" href={getLinkedInUrl(job)} target="_blank" rel="noreferrer">LinkedIn</a>
              <button className="button secondary" type="button" onClick={() => onToggleExpanded(job.id)} aria-expanded={expandedJobId === job.id}>Info</button>
              <a className="button primary" href={job.applyUrl} target="_blank" rel="noreferrer">Apply</a>
              {onHideCompany ? <CompanyActions company={job.company} onHide={onHideCompany} /> : null}
            </div>
            {expandedJobId === job.id ? (
              <div className="job-info">
                <p><strong>Posted:</strong> {new Date(job.postedAt).toLocaleDateString()}</p>
                <p><strong>Employees:</strong> {job.employeeCount ? `${job.employeeCount.toLocaleString()}+` : "Not listed"}</p>
                <p><strong>Status:</strong> {companyTierLabel(job.company)}</p>
              </div>
            ) : null}
          </article>
        ))}
        {totalJobCount === 0 ? <p className="state-card">{emptyMessage}</p> : null}
      </div>
    </div>
  );
}

function CompanyLogo({ company }: { company: string }) {
  const [failed, setFailed] = useState(false);
  if (!logoToken || failed) return null;

  const logoUrl = `https://img.logo.dev/name/${encodeURIComponent(company)}?token=${encodeURIComponent(logoToken)}&size=80&format=png&theme=dark&fallback=404`;
  return (
    <div className="company-logo" aria-hidden="true">
      <Image src={logoUrl} alt="" width={40} height={40} unoptimized onError={() => setFailed(true)} />
    </div>
  );
}

function SaveButton({ compact = false, isSaved, job, onToggle }: { compact?: boolean; isSaved: boolean; job: PublicJob; onToggle: () => void }) {
  const [sparkleBurst, setSparkleBurst] = useState(0);
  const action = isSaved ? "Remove saved job" : "Save job";
  const handleToggle = () => {
    if (!isSaved) setSparkleBurst((burst) => burst + 1);
    onToggle();
  };

  return (
    <div className="saved-job-controls"><button className={`button save-button ${compact ? "compact-save" : "secondary"} ${isSaved ? "saved" : ""}`} type="button" onClick={handleToggle} aria-pressed={isSaved} aria-label={`${action}: ${job.title} at ${job.company}`} title={action}>
      <span className={sparkleBurst > 0 ? "save-star sparkling" : "save-star"} aria-hidden="true" key={`star-${sparkleBurst}`}>★</span>
      {sparkleBurst > 0 ? <span className="save-sparkles" aria-hidden="true" key={`sparkles-${sparkleBurst}`}><span /><span /><span /><span /><span /><span /></span> : null}
      {compact ? <span className="sr-only">{isSaved ? "Saved" : "Save"}</span> : isSaved ? "Saved" : "Save"}
    </button>
    {isSaved ? <ApplicationStatusSelect jobId={job.id} title={`${job.title} at ${job.company}`} /> : null}
    </div>
  );
}

function CompanyActions({ company, onHide }: { company: string; onHide: (name: string) => void }) {
  return <details className="company-actions" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  }} onKeyDown={(event) => {
    if (event.key === "Escape") {
      event.currentTarget.open = false;
      event.currentTarget.querySelector("summary")?.focus();
    }
  }}>
    <summary aria-label={`More actions for ${company}`} title="More actions"><span aria-hidden="true">&#8942;</span></summary>
    <div className="company-actions-panel"><button type="button" onClick={() => onHide(company)}>Hide company<span className="sr-only"> {company}</span></button></div>
  </details>;
}
