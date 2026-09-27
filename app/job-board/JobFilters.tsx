"use client";

import Link from "next/link";
import { useState } from "react";
import type { CompanyTier } from "@/lib/company-tiers";
import { JOB_REGIONS, type JobMetro, type JobRegion } from "@/lib/job-locations";
import { ROLE_FAMILIES, type RoleSelection, type RoleTag } from "@/lib/role-areas";
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
  engineeringSpecialties: ReadonlyArray<{ value: RoleTag; label: string }>;
  roleSelection: RoleSelection;
  type: "internships" | "fulltime";
  viewMode: ViewMode;
  onQueryChange: (query: string) => void;
  onRegionsChange: (regions: JobRegion[]) => void;
  onMetrosChange: (metros: JobMetro[]) => void;
  onModesChange: (modes: string[]) => void;
  onTermsChange: (terms: string[]) => void;
  onCompanyTiersChange: (tiers: CompanyTier[]) => void;
  onViewChange: (viewMode: ViewMode) => void;
};

export function RoleTabs({ selection, type }: { selection: RoleSelection; type: "internships" | "fulltime" }) {
  const route = type === "internships" ? "/internships" : "/jobs";

  return (
    <div className="role-navigation">
      <nav className="role-tabs role-family-tabs" aria-label="Role family">
        {ROLE_FAMILIES.map((option) => (
          <Link
            className={selection.family === option.value ? "active" : ""}
            href={option.value === "all" ? route : `${route}?role=${option.value}`}
            key={option.value}
            aria-current={selection.family === option.value && !selection.specialty ? "page" : undefined}
          >
            {option.label}
          </Link>
        ))}
      </nav>
    </div>
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
  engineeringSpecialties,
  roleSelection,
  type,
  viewMode,
  onQueryChange,
  onRegionsChange,
  onMetrosChange,
  onModesChange,
  onTermsChange,
  onCompanyTiersChange,
  onViewChange,
}: JobFiltersProps) {
  const route = type === "internships" ? "/internships" : "/jobs";

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
      {roleSelection.family === "engineering" ? (
        <SingleFilter
          key={roleSelection.specialty ?? "all-engineering"}
          label="Specialty"
          value={roleSelection.specialty}
          hrefForValue={(value) => value ? `${route}?role=engineering&specialty=${value}` : `${route}?role=engineering`}
          options={engineeringSpecialties.map((specialty) => [specialty.value, specialty.label] as const)}
          allLabel="All"
        />
      ) : (
        <MultiFilter label="Company tier" values={companyTiers} onChange={(values) => onCompanyTiersChange(values as CompanyTier[])} options={[["faang_plus", "FAANG+"], ["fortune_500", "Fortune 500"]]} />
      )}
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

function SingleFilter({ label, value, hrefForValue, options, allLabel }: { label: string; value: string | null; hrefForValue: (value: string | null) => string; options: readonly FilterOption[]; allLabel: string }) {
  const [open, setOpen] = useState(false);
  const summary = value === null ? allLabel : options.find(([optionValue]) => optionValue === value)?.[1] ?? allLabel;

  return (
    <div className="filter-control">
      <span>{label}</span>
      <details className="multi-filter single-filter" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary>{summary}</summary>
        <div className="multi-filter-menu single-filter-menu" role="radiogroup" aria-label={label}>
          <Link role="radio" className={value === null ? "selected" : ""} aria-checked={value === null} href={hrefForValue(null)}>
            <span aria-hidden="true" />{allLabel}
          </Link>
          {options.map(([optionValue, optionLabel]) => (
            <Link role="radio" className={value === optionValue ? "selected" : ""} aria-checked={value === optionValue} href={hrefForValue(optionValue)} key={optionValue}>
              <span aria-hidden="true" />{optionLabel}
            </Link>
          ))}
        </div>
      </details>
    </div>
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
