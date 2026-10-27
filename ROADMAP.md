# empluzzed Roadmap

This is the living list of ideas and future work for empluzzed. Update it whenever priorities change, an idea comes up, or a feature ships.

## Source expansion release

The October 19 release adds Keryx coverage and bounded automatic USAJOBS discovery. Implementation and measurement are complete; publication was approved and release 7ab69a1 was pushed. Live refresh run 39315578545 passed and its snapshot deployed successfully. See [release review](docs/SOURCE_EXPANSION_RELEASE.md) and [active tasks](docs/ACTIVE_TASKS.md). After publication, prioritize listing quality and duplicate/requisition review before further backend work.

Published follow-up: outage retries/recovery, corrected Luma/Commure boards and conservative Workday duplicate handling are deployed. Production refreshes 39358051059 and 39358416742 passed. The final live snapshot has 6,103 jobs and 11 federal listings, with two directly verified closed destinations removed. See [quality review](docs/REFRESH_QUALITY_REVIEW.md). Requisition review separates 94 distinct-token groups from three alias groups and 85 groups needing official evidence.

Approved cleanup/research follow-up was pushed at 12f1318 and deployed: 6,077 jobs, 76 passing tests, evidence-backed duplicate/availability cleanup and per-refresh removal reasons. Production refresh 39367465734 passed and deployed snapshot 2e1c661, with 6,077 jobs and 11 federal listings. Access review corrected the source route: CareerOneStop now directs new job API requests to NLx, whose standard research terms do not permit public identifiable listings by default. A [public-feed request draft](docs/NLX_ACCESS_REQUEST_DRAFT.md) is prepared for owner review; nothing submitted and no new source enabled. See [cleanup](docs/LISTING_CLEANUP_REVIEW.md) and [shortlist](docs/NON_SOFTWARE_SOURCE_SHORTLIST.md).

## Current focus

Owner-approved analytics milestone (October 22): implement consent-based anonymous-browser activity measurement and an owner-only `/analytics` reporting UI without visitor accounts or charges. The collector and Production integration are live. Private report API authentication, consent gating, sanitized filter events, withdrawal and duplicate protection passed October 23. The live frontend selects the owned collector and suppresses Vercel collection. See docs/ANALYTICS_ACTION_LOG.md for receipts, verification traffic and remaining owner walkthrough/cron observation. See [implementation and activation review](docs/OWNED_ANALYTICS.md).

Owner-approved Winter review and local refresh are complete: fifteen new Winter listings (11 US/four Canada), 34 Winter-credited listings and 6,105 jobs overall. Four evidence-based employer approvals also affect existing sources. Sixteen unresolved destinations remain held across feeds and Workday aliases, including recovery. Complete requisition parsing, a stale Insulet closure and Canadian province-code labels were corrected. All 82 tests, lint, TypeScript, data audits and static export pass. Publication awaits approval. See [Winter release review](docs/KERYX_WINTER_RELEASE.md).

Spring publication completed at release 0c3af79 and generated snapshot 57629bd. Refresh 39501464029 passed; the verified live snapshot then contained 6,017 jobs and 107 Spring-credited listings. The subsequent Winter review is complete locally as described above. See [Spring production receipt](docs/keryx-spring-production-result.json) and [original Winter measurement](docs/KERYX_WINTER_REVIEW.md). Medtronic's earlier 429 is historical; all 26 feeds succeeded in the final local Winter refresh.

The original Spring review measured 48 new listings after overlap checks. Future season-file discovery and repository rename/attribution maintenance are included in the published release; new discoveries remain inactive. Paid job-source/application services are excluded and Jobr is recorded for no reconsideration. See [release review](docs/KERYX_SPRING_RELEASE.md) and [exclusion register](docs/SOURCE_EXCLUSIONS.md).

October 20 self-service discovery examined 2,142 rows across four providers without enabling any. The owner excluded Jobr's paid-service application path, and that candidate is closed unless explicitly reopened by the owner. The subsequent Keryx Spring expansion is published as described above. See [validation decision](docs/JOBR_PILOT_VALIDATION.md), [initial pilot review](docs/SELF_SERVICE_SOURCE_PILOT_REVIEW.md) and [active tasks](docs/ACTIVE_TASKS.md). NLx outreach remains deferred.

empluzzed covers early-career software, data, engineering, product, solutions and support, business, finance, quant, IT, and security roles across internship and full-time collections.

The reviewed-source expansion, ingestion foundation, opt-in Vercel analytics and browser-local application tracker are complete. Keep the current analytics integration. The current milestone is the source-expansion release above. After publication, prioritize listing quality; optional backend cost and architecture work remains a later review in a new chat. No backend resources, accounts or database have been added. See [backend handoff](docs/BACKEND_HANDOFF.md). Preserve the no-sign-up public board throughout.

## Personal company preferences

- [x] Add browser-local hidden companies across all discovery boards, with Undo and searchable restore controls. Saved jobs and application records remain visible. Exact normalized company names match legal suffix variants; subsidiaries are not inferred.
- [ ] Offer optional account import and cross-device synchronization for hidden companies alongside saved jobs and application records after the backend cost review.

## Next milestone

- [x] Ship the reviewed frontend redesign: rocket logo, category typewriter and dot gravity hero, simplified About and Feedback pages, consistent footer typography, and a compact Applications table with location, colored editable statuses and Mark applied from saved jobs. Existing browser records and legacy backups remain supported; no backend added.

- [x] Consolidate header information under About, add a simple LinkedIn feedback page, and place analytics preferences in the footer row.

- [x] Simplify My applications with a closed editor and backup controls, visible saved jobs with verified current Apply links, and compact first-visit analytics choices with persistent preferences access.

- [x] Assess free aggregate action analytics and a potential default-on audience-measurement exemption. GoatCounter is the leading candidate; provider limit behavior and privacy evidence remain unresolved. See [reassessment](docs/ANALYTICS_ASSESSMENT.md). Keep the approved opt-in setup until those checks are resolved.
- [x] Audit and implement opt-in Vercel Hobby page views, safe available referrals, and collection visits within the zero-cost policy. Custom interaction events are unavailable on this plan. See [analytics limits and setup](docs/ANALYTICS.md).
- [x] Confirm production Web Analytics dashboard receipt (October 5, 2026): existing Hobby production dashboard showed 234 page views and 71 visitors over the last seven days. Activation was already complete; no configuration change or redeployment was needed.
- [x] Audit and polish browser-local saved jobs, including discoverability and handling unavailable listings
- [ ] Design optional cross-device saved jobs using Go and GraphQL after measuring usage
- [ ] Review authentication, persistent storage, and hosting against the cost policy before deploying the backend
- [ ] Retain static export when calling a separate backend; introduce the Next.js Node runtime only if a frontend feature requires it
- [ ] Preserve the no-sign-up public board even if optional accounts are introduced for personal features

## Application tracker and owned analytics sequence

The October 22 analytics milestone supersedes the older aggregate-only/no-visitor-ID proposal for analytics. It uses explicit renewed consent, a persistent random browser ID and a Cloudflare Worker with D1, separate from any future Go/GraphQL backend for personal records. Visitor accounts and cross-device records remain deferred. See [owned analytics](docs/OWNED_ANALYTICS.md).

1. [x] Record the revised sequence: retain existing page views, polish local saved jobs, then assess a backend for personal tracking and aggregate analytics.
2. [x] Deliver the browser-local tracker: explicit statuses, storage-error feedback, filtering, retained missing-listing details, manual records from any source, dates, notes, editing, saved-job import and JSON backup/recovery with preview and duplicate handling. Missing listings have unverified availability; older missing IDs cannot reconstruct historical details. Profile migration remains part of the future backend milestone.
3. [x] Define proposed fixed analytics event names, bounded dimensions and daily counters in [backend handoff](docs/BACKEND_HANDOFF.md). These are requirements only; intake and custom tracking are not implemented. Apply means outbound click only.
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
- [ ] Activate and verify the Cloudflare Free hourly trigger, bounded retry, production freshness checks, and automatic open-tab snapshot updates. See [hourly refresh operations](docs/HOURLY_REFRESH.md).
- [x] Chronological ordering and 100-job pagination
- [x] Multi-select filters for term, workplace, and company tier
- [x] FAANG+ and Fortune 500 company filters
- [x] Responsive job rows and compact filter layouts
- [x] Company screening, unpaid-role rejection, and quarantine workflow
