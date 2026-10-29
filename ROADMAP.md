# empluzzed Roadmap

This is the living overview of shipped capabilities, candidate priorities, and deferred ideas. Specific current work and evidence belong in [active tasks](docs/ACTIVE_TASKS.md). Historical releases and measurements remain in their linked reviews.

## Current status

- October 29 coverage investigation: approximately 95% of absent pre-migration rows are attributable to employer-evidence holds or missing permitted replacement inputs. A scoped recovery batch is local pending validation. Jobright is the named comparison board, but its published terms do not clear the automated competitor dataset. See [count-loss diagnosis](docs/COVERAGE_LOSS_DIAGNOSIS.md) and [Jobright review](docs/JOBRIGHT_BENCHMARK_REVIEW.md).

- Coverage expansion and source-permission safeguards are published and production-verified October 28. A licensed discovery source, posting-date correction, independently reviewed employers and fairer availability checks shipped. Six feeds without detected reuse licenses are held out, substantially reducing the old inventory; rebuilding permitted coverage is the next priority. See the [coverage expansion review](docs/COVERAGE_EXPANSION_REVIEW.md) and [production receipt](docs/coverage-expansion-production-result.json).

- Employer coverage retention and unexplained-drop safeguards were published and production-verified October 28. Known official boards survive upstream omissions, and large unexplained losses block publication. See [coverage review](docs/COVERAGE_RETENTION_REVIEW.md) and [production receipt](docs/coverage-retention-production-result.json).

- The public job board is free to browse without an account. It covers internships and early-career roles across software, data, engineering, product, business, finance, IT, security, and other fields.
- Source expansion, including Keryx and bounded USAJOBS discovery, has shipped. The Keryx Winter release was published and production-verified on October 21; blocked or unreviewed destinations remain on hold. See the [Winter production receipt](docs/keryx-winter-production-result.json) and [source expansion review](docs/SOURCE_EXPANSION_RELEASE.md).
- Keryx New Grad 2026 was published and production-verified October 28 with destination availability safeguards across feeds, aliases and recovery. Fall 2026 stays inactive. See [production receipt](docs/keryx-2026-production-result.json) and [release review](docs/KERYX_PENDING_2026_REVIEW.md#production-release-and-verification-october-28).
- Hourly refresh scheduling and open-tab snapshot updates were activated and verified. See [hourly refresh operations](docs/HOURLY_REFRESH.md).
- Saved jobs, hidden companies, and the application tracker use browser-local storage. The tracker supports manual entries, statuses, dates, notes, and backup/recovery. Cross-device syncing and visitor accounts remain deferred.
- Optional, consent-based owned activity analytics and the private owner dashboard are live. The analytics collector uses a Cloudflare Worker and D1; this is separate from any proposed backend for personal records. The owner dashboard walkthrough and credential rotation are complete. Scheduled cleanup was configured, but a successful scheduled run has not yet been recorded in the [analytics action log](docs/ANALYTICS_ACTION_LOG.md).
- The Updates page shares selected user-facing milestones. When a meaningful milestone ships, consider a dated entry in `app/updates/page.tsx`; routine job refreshes and deployments do not need entries.

## Candidate next work

These are recommendations, not a committed active milestone. Choose a batch before implementation.

1. Rebuild coverage through permitted sources and independently verified employer boards. Review employer aliases and the largest company-evidence holds first, then unsupported collection systems. Measure actual missing destinations and keep permission holds separate from closure. See the [coverage expansion review](docs/COVERAGE_EXPANSION_REVIEW.md).
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
