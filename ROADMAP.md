# App Expo Roadmap

This is the living list of ideas and future work for App Expo. Update it whenever priorities change, an idea comes up, or a feature ships.

## Current focus

App Expo covers early-career software, data, engineering, product, solutions and support, business, finance, quant, IT, and security roles across internship and full-time collections.

The reviewed-source expansion and ingestion-foundation milestones are complete. The immediate goal is to choose and design the first server-backed feature while continuing to operate the no-sign-up public board.

## Next milestone

- [ ] Decide the first server-backed feature, with saved searches and job alerts or a personal application tracker as the leading options
- [ ] If a server-backed feature is selected, replace static export with the Next.js Node runtime before adding authentication or a database
- [ ] Preserve the no-sign-up public board even if optional accounts are introduced for personal features

## Completed ingestion milestone

- [x] Extract provider orchestration from `scripts/sync-jobs.ts` into typed ingestion modules
- [x] Add mocked HTTP integration tests for pagination, retries, partial detail failures, and last-known-good behavior
- [x] Produce one typed refresh report with source timing, request volume, accepted jobs, quarantined jobs, and rejection counts
- [x] Document an incremental server-runtime and database migration that preserves the existing source work

## Completed source milestone

- [x] Pilot Medtronic and Abbott through the Workday connector for Quality / Reliability and manufacturing coverage
- [x] Measure net-new roles, refresh duration, request counts, detail failures, retries, and false positives
- [x] Improve Materials / Chemical classification for thin-film, deposition, etch, CMP, metrology, and electrochemistry roles
- [x] Add physical medical-device context for Quality / Reliability while excluding software QA
- [x] Add bounded Workday retries and preserve last-known-good data during source failures
- [x] Add per-connector timing and request diagnostics before broader Workday expansion

## Future job categories

Use role buttons that open the shared job board with the matching role filter already applied. This keeps one consistent list, filter system, and pagination experience.

- [x] Software
- [x] Product management
- [x] Quant
- [x] Finance
- [x] Business analyst

Continue expanding and refining the source coverage behind each role filter while keeping the same direct-application experience.

## Data quality improvements

- [ ] Expand verified company information, including employee-count ranges and direct LinkedIn company profiles
- [ ] Review quarantined companies and promote valid employers into the verified registry
- [x] Expand finance, business analyst, and IT/networking classification for broader business feeds
- [x] Remove internships from completed seasonal terms while preserving graduation-date mentions on full-time roles
- [x] Prefer direct employer applications when the same role also appears through an aggregator
- [ ] Add stronger detection for expired or removed employer listings beyond the current ATS and rotating link checks
- [ ] Continue improving duplicate detection across sources

## Source coverage plan

- [x] Add Dreamwork's daily Business Internships feed for finance, accounting, and analytics coverage
- [x] Add ApplyGuy's Product internships feed using direct employer `listingUrl` values and no full-board ATS expansion
- [x] Add Dreamwork's U.S. new-grad feed without allowing it to expand into unrelated employer-board roles
- [x] Add a curated Hardware role filter for electrical, silicon, FPGA/ASIC, board, and embedded-systems positions
- [x] Add a reusable Workday connector with Applied Materials and Micron as reviewed pilot employers
- [ ] Add USAJOBS student and recent-graduate searches for federal finance, analysis, data, and IT roles
- [ ] Enumerate full SmartRecruiters company boards instead of verifying only individual postings
- [ ] Pilot curated Workable employer boards
- [ ] Evaluate CareerOneStop after measuring duplicate rate and destination-link quality

## Job board improvements

- [x] Add role buttons that open prefiltered job-board views
- [x] Add region and metro-area location filters
- [ ] Consider role-area filters within software, such as software engineering, data, product design, and security
- [ ] Consider a way to hide jobs a visitor has already reviewed on their current device

## Completed

- [x] Publish source credits, license status, third-party notices, and a zero-cost operating policy
- [x] Separate internship and full-time boards
- [x] Direct employer application links without sign-up gates
- [x] Hourly job refreshes
- [x] Chronological ordering and 100-job pagination
- [x] Multi-select filters for term, workplace, and company tier
- [x] FAANG+ and Fortune 500 company filters
- [x] Responsive job rows and compact filter layouts
- [x] Company screening, unpaid-role rejection, and quarantine workflow
