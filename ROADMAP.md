# App Expo Roadmap

This is the living list of ideas and future work for App Expo. Update it whenever priorities change, an idea comes up, or a feature ships.

## Current focus

App Expo covers early-career software, data, engineering, product, solutions and support, business, finance, quant, IT, and security roles across internship and full-time collections.

The reviewed-source expansion, ingestion foundation, and opt-in Vercel analytics implementation are complete. Keep the current analytics integration. The current development priority is polishing browser-local saved jobs and explicit application statuses. Custom aggregate analytics will be assessed alongside the optional Go backend with a GraphQL API. Preserve the no-sign-up public board throughout.

## Next milestone

- [x] Assess free aggregate action analytics and a potential default-on audience-measurement exemption. GoatCounter is the leading candidate; provider limit behavior and privacy evidence remain unresolved. See [reassessment](docs/ANALYTICS_ASSESSMENT.md). Keep the approved opt-in setup until those checks are resolved.
- [x] Audit and implement opt-in Vercel Hobby page views, safe available referrals, and collection visits within the zero-cost policy. Custom interaction events are unavailable on this plan. See [analytics limits and setup](docs/ANALYTICS.md).
- [ ] Owner: enable included Web Analytics, set the production analytics switch, deploy, and confirm private dashboard receipt
- [ ] Audit and polish browser-local saved jobs, including discoverability and handling unavailable listings
- [ ] Design optional cross-device saved jobs using Go and GraphQL after measuring usage
- [ ] Review authentication, persistent storage, and hosting against the cost policy before deploying the backend
- [ ] Retain static export when calling a separate backend; introduce the Next.js Node runtime only if a frontend feature requires it
- [ ] Preserve the no-sign-up public board even if optional accounts are introduced for personal features

## Application tracker and owned analytics sequence

1. [x] Record the revised sequence: retain existing page views, polish local saved jobs, then assess a backend for personal tracking and aggregate analytics.
2. [ ] Polish browser-local application tracking. Completed: explicit Saved, Applied, Interviewing, Offered and Rejected statuses, visible storage failures, status filtering within saved jobs, and retained title/company details for listings absent from the current feed. Missing listings appear separately with unverified availability. Older missing IDs cannot reconstruct historical details. Remaining work: dates and export/recovery.
3. [ ] Define fixed analytics event names and daily counters for collection selection, filter usage, Apply, Save and Unsave; exclude personal identifiers, job IDs, search text, notes and URL parameters. Apply means outbound click only.
4. [ ] Select backend hosting and storage with no payment method, automatic paid conversion or billable overages. Document behavior at every included limit before adding services.
5. [ ] Build a Go backend with GraphQL for optional personal records and a separate small HTTP endpoint for aggregate events. Separate tables and access rules.
6. [ ] Validate and rate-limit analytics intake, increment aggregate counters without retaining visitor event histories, and define retention and abuse handling.
7. [ ] Build an owner dashboard locally first. Keep its access credential only on the owner's computer; display daily totals, safe referral origins and action counts.
8. [ ] Review free authentication, then add optional accounts, local-record migration, record ownership checks and deletion for cross-device tracking. Keep public browsing account-free.
9. [ ] Review actual collection and audience applicability, update privacy information and necessary consent/opt-out controls, and keep personal application records out of analytics.
10. [ ] Verify privacy controls, account isolation, deletion, private report access, sensitive-data exclusion and free-limit behavior before deployment. Preserve static export; remove Vercel analytics only after the replacement is verified.

GoatCounter remains an assessed alternative, not an active replacement. No provider message has been sent. Backend hosting, storage and authentication remain subject to COST_POLICY.md.

## Completed ingestion work

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
