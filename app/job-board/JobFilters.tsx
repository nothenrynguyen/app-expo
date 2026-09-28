"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const activeTab = activeTabRef.current;
    const navigation = activeTab?.closest<HTMLElement>(".role-navigation");
    if (!activeTab || !navigation || navigation.scrollWidth <= navigation.clientWidth) return;
    activeTab.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
  }, [selection.family]);

  return (
    <div className="role-navigation">
      <nav className="role-tabs role-family-tabs" aria-label="Role family">
        {ROLE_FAMILIES.map((option) => (
          <Link
            className={selection.family === option.value ? "active" : ""}
            href={option.value === "all" ? route : `${route}?role=${option.value}`}
            key={option.value}
            aria-current={selection.family === option.value && !selection.specialty ? "page" : undefined}
            ref={selection.family === option.value ? activeTabRef : undefined}
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const regionIsDefault = regions.length === 1 && regions[0] === "us";
  const activeFilterCount = Number(!regionIsDefault)
    + Number(metros.length > 0)
    + Number(modes.length > 0)
    + Number(selectedTerms.length > 0)
    + Number(roleSelection.family === "engineering" ? roleSelection.specialty !== null : companyTiers.length > 0);

  useEffect(() => {
    if (!mobileFiltersOpen) return;

    const mobileQuery = window.matchMedia("(max-width: 620px)");
    const closeForDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) setMobileFiltersOpen(false);
    };
    const handlePanelKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileFiltersOpen(false);
        window.requestAnimationFrame(() => filterButtonRef.current?.focus());
        return;
      }

      if (event.key !== "Tab") return;

      const panel = document.getElementById("mobile-filter-options");
      if (!panel) return;

      const focusableElements = Array.from(panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getClientRects().length > 0);
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements.at(-1);

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    };

    document.body.classList.add("mobile-filters-open");
    closeButtonRef.current?.focus();
    mobileQuery.addEventListener("change", closeForDesktop);
    document.addEventListener("keydown", handlePanelKeyDown);

    return () => {
      document.body.classList.remove("mobile-filters-open");
      mobileQuery.removeEventListener("change", closeForDesktop);
      document.removeEventListener("keydown", handlePanelKeyDown);
    };
  }, [mobileFiltersOpen]);

  const closeMobileFilters = () => {
    setMobileFiltersOpen(false);
    window.requestAnimationFrame(() => filterButtonRef.current?.focus());
  };

  return (
    <section className="filters" aria-label="Job filters">
      <label className="search-field">
        <span>Search</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Company or role" />
      </label>
      <button
        className="mobile-filter-trigger"
        type="button"
        onClick={() => setMobileFiltersOpen(true)}
        aria-expanded={mobileFiltersOpen}
        aria-controls="mobile-filter-options"
        ref={filterButtonRef}
      >
        Filters{activeFilterCount > 0 ? <span>{activeFilterCount}</span> : null}
      </button>
      <button className={`mobile-filter-backdrop ${mobileFiltersOpen ? "open" : ""}`} type="button" onClick={closeMobileFilters} aria-label="Close filters" tabIndex={mobileFiltersOpen ? 0 : -1} />
      <div
        className={`filter-options ${mobileFiltersOpen ? "open" : ""}`}
        id="mobile-filter-options"
        role={mobileFiltersOpen ? "dialog" : undefined}
        aria-modal={mobileFiltersOpen ? true : undefined}
        aria-label={mobileFiltersOpen ? "Job filters" : undefined}
        onClick={(event) => {
          if ((event.target as Element).closest("a")) closeMobileFilters();
        }}
      >
        <div className="mobile-filter-panel-header">
          <strong>Filters</strong>
          <button type="button" onClick={closeMobileFilters} ref={closeButtonRef} aria-label="Close filters">Close</button>
        </div>
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
        <div className="filter-control layout-filter-control">
          <span>Layout</span>
          <div className={`view-toggle ${viewMode === "cards" ? "cards-active" : ""}`} role="group" aria-label="Job layout">
            <button className={viewMode === "compact" ? "active" : ""} type="button" onClick={() => onViewChange("compact")} aria-pressed={viewMode === "compact"}>Compact</button>
            <button className={viewMode === "cards" ? "active" : ""} type="button" onClick={() => onViewChange("cards")} aria-pressed={viewMode === "cards"}>Cards</button>
          </div>
        </div>
        <button className="mobile-filter-done" type="button" onClick={closeMobileFilters}>Done</button>
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
