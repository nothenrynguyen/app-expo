import Link from "next/link";
import type { CompanyTier } from "@/lib/company-tiers";
import { JOB_REGIONS, type JobMetro, type JobRegion } from "@/lib/job-locations";
import { ROLE_AREAS, type RoleArea } from "@/lib/role-areas";
import type { ViewMode } from "./job-board-utils";

type FilterOption = readonly [string, string];

type JobFiltersProps = {
  query: string;
  regions: readonly JobRegion[];
  metros: readonly JobMetro[];
  metroOptions: ReadonlyArray<readonly [JobMetro, string]>;
  modes: readonly string[];
  selectedTerms: readonly string[];
  terms: readonly string[];
  companyTiers: readonly CompanyTier[];
  viewMode: ViewMode;
  onQueryChange: (query: string) => void;
  onRegionsChange: (regions: JobRegion[]) => void;
  onMetrosChange: (metros: JobMetro[]) => void;
  onModesChange: (modes: string[]) => void;
  onTermsChange: (terms: string[]) => void;
  onCompanyTiersChange: (tiers: CompanyTier[]) => void;
  onViewChange: (viewMode: ViewMode) => void;
};

export function RoleTabs({ roleArea, type }: { roleArea: RoleArea; type: "internships" | "fulltime" }) {
  const route = type === "internships" ? "/internships" : "/jobs";

  return (
    <nav className="role-tabs" aria-label="Role area">
      {ROLE_AREAS.map((area) => (
        <Link
          className={roleArea === area.value ? "active" : ""}
          href={area.value === "all" ? route : `${route}?role=${area.value}`}
          key={area.value}
          aria-current={roleArea === area.value ? "page" : undefined}
        >
          {area.label}
        </Link>
      ))}
    </nav>
  );
}

export function JobFilters({
  query,
  regions,
  metros,
  metroOptions,
  modes,
  selectedTerms,
  terms,
  companyTiers,
  viewMode,
  onQueryChange,
  onRegionsChange,
  onMetrosChange,
  onModesChange,
  onTermsChange,
  onCompanyTiersChange,
  onViewChange,
}: JobFiltersProps) {
  return (
    <section className="filters" aria-label="Job filters">
      <label className="search-field">
        <span>Search</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Company or role" />
      </label>
      <MultiFilter label="Location" values={regions} onChange={(values) => onRegionsChange(values as JobRegion[])} options={JOB_REGIONS} allLabel="All locations" />
      <MultiFilter label="Metro area" values={metros} onChange={(values) => onMetrosChange(values as JobMetro[])} options={metroOptions} allLabel="All metros" />
      <MultiFilter label="Workplace" values={modes} onChange={onModesChange} options={[["remote", "Remote"], ["hybrid", "Hybrid"], ["in_person", "In person"]]} />
      <MultiFilter label="Term" values={selectedTerms} onChange={onTermsChange} options={terms.map((value) => [value, value] as const)} />
      <MultiFilter label="Company tier" values={companyTiers} onChange={(values) => onCompanyTiersChange(values as CompanyTier[])} options={[["faang_plus", "FAANG+"], ["fortune_500", "Fortune 500"]]} />
      <div className="filter-control">
        <span>Layout</span>
        <div className={`view-toggle ${viewMode === "cards" ? "cards-active" : ""}`} role="group" aria-label="Job layout">
          <button className={viewMode === "compact" ? "active" : ""} type="button" onClick={() => onViewChange("compact")} aria-pressed={viewMode === "compact"}>Compact</button>
          <button className={viewMode === "cards" ? "active" : ""} type="button" onClick={() => onViewChange("cards")} aria-pressed={viewMode === "cards"}>Cards</button>
        </div>
      </div>
    </section>
  );
}

function MultiFilter({ label, values, onChange, options, allLabel = "All" }: { label: string; values: readonly string[]; onChange: (values: string[]) => void; options: readonly FilterOption[]; allLabel?: string }) {
  const summary = values.length === 0
    ? "All"
    : values.length === 1
      ? options.find(([value]) => value === values[0])?.[1]
      : `${values.length} selected`;
  const toggle = (value: string) => onChange(
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
  );

  return (
    <div className="filter-control">
      <span>{label}</span>
      <details className="multi-filter">
        <summary>{summary}</summary>
        <div className="multi-filter-menu">
          <label><input type="checkbox" checked={values.length === 0} onChange={() => onChange([])} />{allLabel}</label>
          {options.map(([value, optionLabel]) => (
            <label key={value}>
              <input type="checkbox" checked={values.includes(value)} onChange={() => toggle(value)} />
              {optionLabel}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
