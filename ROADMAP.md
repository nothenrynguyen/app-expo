# empluzzed Roadmap

October 30 location display: redundant US country labels are removed from specific non-remote board locations, including compact/card views. Remote and country-only labels remain. Local tests, lint, types and static export pass; publication is owner-authorized. See [change and release evidence](docs/LOCATION_DISPLAY_2026-10-30.md).

October 30 release complete: audit actions 1 through 5 are published and production-verified. Implementation `4c5c1fb`; successful refresh `41022853725`; snapshot `f269540`, generated 1:00 a.m. Pacific, 6,781 listings. All four deployed JSON files match, retained Workday IDs have compatibility coverage, and desktop/mobile plus save-persistence checks pass. All 161 tests, types, lint/export and the zero-advisory dependency check pass. Provider failures and partial recovery remain documented limits. See [production release record](docs/APPROVED_FIXES_2026-10-29.md#production-completion-october-30).

October 30 release in progress: the owner authorized taking the approved audit fixes through commit, push, deployment and production verification. Preserve current automated refresh commits and verify the new snapshot and saved-state behavior before calling this published. See [release record](docs/APPROVED_FIXES_2026-10-29.md).

October 30 verification: the October 29 approved local actions 1 through 5 are complete within their local/read-only boundary. Ordinary production runs verified Elkay's retry/backoff and all ten rate-limited hosts' post-expiry success/reset, followed by further successful hourly refreshes. All four latest deployed data files match snapshot `f8bb115`; provider degradation still recurs. Local code remains uncommitted and unpublished. See [approved fixes and remaining limitations](docs/APPROVED_FIXES_2026-10-29.md).

October 29 approved audit follow-up: actions 1 through 5 are authorized locally. Scope filtering, Workday opportunity identity/saved-state compatibility, dependency patches and direct-link claim corrections are implemented locally; no release is authorized. Frozen comparison: 19 scope exclusions and 70 redundant Workday rows merged, with retained IDs covered by compatibility metadata. All 161 tests, types, lint and static export pass; full dependency audit reports zero vulnerabilities. Normal post-cooldown production observation remains separate from local checks. See [approved fixes](docs/APPROVED_FIXES_2026-10-29.md).

October 29 project-wide audit: [current review](docs/PROJECT_REVIEW_2026-10-29.md) recommends repairing excluded People/Legal Operations leakage first, then Workday identity/saved-state consistency and dependency advisories. These are recommendations, not implementation authorization. A later normal hourly refresh succeeded at 6:24 p.m. Pacific with 6,854 jobs and 11 employer cooldowns; post-expiry retry behavior is still unverified because deadlines had not arrived during this audit. All 156 tests, types, lint and static export pass. The review distinguishes confirmed bugs, operational limits and optional improvements. No product changes or publication occurred in this audit.

October 29 current status: source-health reporting and Workday backoff are published and production-verified. Two refreshes succeeded; the final collection took 376 seconds. All 20 discovery feeds are healthy; the final 665 employer-board records distinguish 654 healthy, 10 rate-limited and one cooldown. The four deployed data files match snapshot `3d75a23` (6,854 listings, generated `2026-10-30T01:12:12.152Z`, October 29 Pacific). Six new regression tests bring the suite to 156 passing tests; types, lint and export pass. Employer coverage is preserved, including Old Mission through its official Ashby board. See [source-health audit](docs/SOURCE_HEALTH_AUDIT_2026-10-29.md).

This is the living overview of shipped capabilities, candidate priorities, and deferred ideas. Specific current work and evidence belong in [active tasks](docs/ACTIVE_TASKS.md). Historical releases and measurements remain in their linked reviews.

## Current status

- October 29 coverage investigation: approximately 95% of absent pre-migration rows are attributable to employer-evidence holds or missing permitted replacement inputs. The broader restoration is now published and verified as recorded above. Jobright is the named comparison board, but its published terms do not clear the automated competitor dataset. See [count-loss diagnosis](docs/COVERAGE_LOSS_DIAGNOSIS.md) and [Jobright review](docs/JOBRIGHT_BENCHMARK_REVIEW.md).

- Coverage expansion and source-permission safeguards are published and production-verified October 28. A licensed discovery source, posting-date correction, independently reviewed employers and fairer availability checks shipped. Six feeds without detected reuse licenses remain held out. Their initial inventory reduction was superseded by the October 29 employer-based restoration. See the [coverage expansion review](docs/COVERAGE_EXPANSION_REVIEW.md) and [production receipt](docs/coverage-expansion-production-result.json).

- Employer coverage retention and unexplained-drop safeguards were published and production-verified October 28. Known official boards survive upstream omissions, and large unexplained losses block publication. See [coverage review](docs/COVERAGE_RETENTION_REVIEW.md) and [production receipt](docs/coverage-retention-production-result.json).

- The public job board is free to browse without an account. It covers internships and early-career roles across software, data, engineering, product, business, finance, IT, security, and other fields.
- Source expansion, including Keryx and bounded USAJOBS discovery, has shipped. The Keryx Winter release was published and production-verified on October 21; blocked or unreviewed destinations remain on hold. See the [Winter production receipt](docs/keryx-winter-production-result.json) and [source expansion review](docs/SOURCE_EXPANSION_RELEASE.md).
- Keryx New Grad 2026 was published and production-verified October 28 with destination availability safeguards across feeds, aliases and recovery. Fall 2026 stays inactive. See [production receipt](docs/keryx-2026-production-result.json) and [release review](docs/KERYX_PENDING_2026_REVIEW.md#production-release-and-verification-october-28).
- Hourly refresh scheduling and open-tab snapshot updates were activated and verified. See [hourly refresh operations](docs/HOURLY_REFRESH.md).
- Saved jobs, hidden companies, and the application tracker use browser-local storage. The tracker supports manual entries, statuses, dates, notes, and backup/recovery. Cross-device syncing and visitor accounts remain deferred.
- Optional, consent-based owned activity analytics and the private owner dashboard are live. The analytics collector uses a Cloudflare Worker and D1; this is separate from any proposed backend for personal records. The owner dashboard walkthrough and credential rotation are complete. Scheduled cleanup was configured, but a successful scheduled run has not yet been recorded in the [analytics action log](docs/ANALYTICS_ACTION_LOG.md).
- The Updates page shares selected user-facing milestones. Local October 29 edits group these into monthly summaries. Add meaningful shipped changes to the relevant month in `app/updates/page.tsx`; routine job refreshes and deployments do not need entries.

October 29 local copy audit: reviewed all 11 page routes and shared copy against implementation and project history. Corrected application-link, refresh, source-count, tracker-status, and retention claims; shortened informational text. Tests, lint, types, and static export pass. Live-site revalidation was unavailable; changes remain unpublished. See [copy audit](docs/SITE_COPY_AUDIT_2026-10-29.md).

## Candidate next work

- Saved October 30: permanent, evidence-backed disappearance explanations on every refresh. Build on existing removal reasons/URL changes and reconcile opportunities separately from URL rows. Deferred behind the owner's requested location display change. See [follow-up plan](docs/LISTING_DISAPPEARANCE_PLAN.md).

October 29 source-health audit: the checked-in 14:24 UTC snapshot reports 62/79 because the denominator mixes 19 community feeds, USAJOBS, 58 Workday boards and recovery. All 17 failed source records are Workday, including eight partial detail failures. Owner-approved reporting, persistent cooldowns and Old Mission migration cleanup are published and production-verified. See [source audit](docs/SOURCE_HEALTH_AUDIT_2026-10-29.md).

These are recommendations, not a committed active milestone. Choose a batch before implementation.

1. Grow beyond the restored coverage floor through permitted discovery and current employer evidence. Review remaining rate limits, unsupported hiring systems and employer destination holds. Keep unresolved availability separate from proven closure. See the [restoration review](docs/COVERAGE_RESTORATION.md).
2. Define an early-career experience rule, measure its effect on existing listings, and review examples before enabling broader exclusions.
3. Improve duplicate and expired-listing detection using official evidence; keep uncertain listings separate or on hold.
4. Review new seasonal source discoveries and unresolved source holds as evidence becomes available. Keryx New Grad 2026 is published and verified; Fall remains pending for separate review. See [release review](docs/KERYX_PENDING_2026_REVIEW.md#production-release-and-verification-october-28). Do not automatically activate unreviewed feeds.
5. Observe and record a successful scheduled analytics cleanup, if available.

See [active tasks](docs/ACTIVE_TASKS.md) for current status, constraints, and evidence.

## Future ideas

- Consider browser-local hiding of individually reviewed jobs, with a restore control.
- Improve verified company information, including employee-count ranges and direct LinkedIn profiles, and review quarantined companies.
- Consider more specific role-area filters within software.
- Evaluate curated Workable boards and broader SmartRecruiters coverage.
- NLx outreach is deferred. CareerOneStop directs new job API requests to NLx; access and publication rights must be established before enabling a feed. See [source shortlist](docs/NON_SOFTWARE_SOURCE_SHORTLIST.md).
- Evaluate optional accounts and cross-device synchronization for saved jobs, applications, and hidden companies only after usage, architecture, authentication, privacy, and cost review. Go and GraphQL were previously proposed, not selected as a final implementation. Preserve account-free browsing and static export unless a reviewed feature requires otherwise. See [backend handoff](docs/BACKEND_HANDOFF.md).
- Paid job-source/application services remain excluded; do not reconsider Jobr unless the owner requests it. See [source exclusions](docs/SOURCE_EXCLUSIONS.md).

## Operating commitments

- Follow the [zero-cost policy](COST_POLICY.md) and review service limits before adding resources.
- Keep application records out of analytics and maintain the current consent and privacy controls. See [owned analytics](docs/OWNED_ANALYTICS.md).
- Preserve direct employer application links and conservative evidence-based listing decisions.
- Keep release receipts, detailed measurements, and completed work in their linked reviews rather than treating historical counts as live status.

October 29 owner scope correction: remove People / Legal, Science / Health and Education from supported career families, including listings classified only in those families. Supported software, data, engineering, product, business, finance and IT roles at any employer sector remain eligible. Classification, legacy-tag filtering, public snapshots and Methodology are updated and production-verified. All 145 tests, TypeScript, lint and static export pass. See [scope receipt](docs/career-scope-correction-result.json). Historical restoration receipts retain their original counts.

October 29 doubling audit: completed backlog, provider, redirect, directory and subsequent-refresh measurements. The tested pool supports incremental growth, not a substantiated 2x promise. Five verified employer boards are the small release batch; Headlands is held pending a clearer reuse basis; broad provider adapters and independent employer discovery remain follow-up engineering. No money, new account, dependency or career expansion. See the [feasibility review](docs/DOUBLING_FEASIBILITY_REVIEW.md). Small batch and reliability-fix publication are verified; see docs/doubling-expansion-production-result.json (relative to repository root).
