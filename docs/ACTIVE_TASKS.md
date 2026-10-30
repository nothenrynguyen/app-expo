# Active project tasks

October 30 refresh-report upgrade is owner-authorized and implemented locally. It adds unique-opportunity reconciliation, source/posting/screening evidence and actionable diagnoses on every refresh, with existing guards preserved. Full validation and one production refresh remain in progress. See [focused record](LISTING_DISAPPEARANCE_PLAN.md).

October 30 location display is published and production-verified (`767d815`): redundant United States labels are removed from specific non-remote board locations; remote restrictions and country-only locations remain. All 161 tests, lint, types and export pass. Vercel deployment succeeded; live compact/card and remote-exception checks pass. See [release evidence](LOCATION_DISPLAY_2026-10-30.md). The permanent [disappearance-reporting upgrade](LISTING_DISAPPEARANCE_PLAN.md) is saved as the next proposed follow-up, not included in this implementation.

October 30 release complete: owner-approved audit actions 1 through 5 are committed, published and production-verified. Implementation `4c5c1fb`, workflow `41022853725`, snapshot `f269540`: 6,781 listings at 1:00 a.m. Pacific, all four deployed JSON files byte-matched. Workday identity/compatibility and scope invariants pass; the live saved opening survived deployment/reload and the temporary test save was removed. All 161 tests, types, lint/export and full npm audit pass. Preserve recurring provider failures, partial recovery and unexplained omissions as limitations, not closures. See [release evidence](APPROVED_FIXES_2026-10-29.md#production-completion-october-30). Earlier local-only/in-progress notes below are historical and superseded.

October 30 release in progress: owner authorization now includes commit, push, deployment and production verification for actions 1 through 5. Reconcile automated data commits, validate the integrated tree, publish the batch, run the existing refresh workflow and verify live data/UI. Earlier local-only release boundaries below are historical. See [release record](APPROVED_FIXES_2026-10-29.md).

October 30 completion: approved actions 1 through 5 are locally implemented/verified, with production observation of the existing cooldown repair complete. Normal run 40990832038 retried Elkay after expiry and persisted increased backoff on HTTP 500. Run 40996555133 retried all ten rate-limited hosts successfully and cleared their cooldowns. Later hourly runs succeeded; the latest four deployed JSON files match `f8bb115`. The new fixes are still uncommitted/unpublished, with 161 tests, types, lint and static export passing and zero npm advisories. Intel/Micron disappearance diagnostics and recurring provider failures remain documented limits. No external services were changed. See [full receipt and release boundary](APPROVED_FIXES_2026-10-29.md). This completion supersedes the pending observation notes below.

October 29 approved local batch: actions 1 through 5 from the audit are authorized. Actions 1 through 4 are implemented and verified locally: excluded-family overlap, exact Workday opportunity identity plus old-save compatibility, patched dependencies and accurate direct-link claims. Tests: 161 passing; types/lint/static export pass; full npm audit is clear. Action 5 has mocked expiry/reset/backoff coverage and pre-expiry normal production evidence; later normal refresh observation remains pending. No commit, push, deployment or external configuration changes. See [implementation and evidence](APPROVED_FIXES_2026-10-29.md). Earlier audit-only authorization statements below are historical and superseded by this local approval.

October 29 audit follow-up: see [project-wide review](PROJECT_REVIEW_2026-10-29.md). Recommended next implementation is the People/Legal Operations classification overlap repair, followed by Workday identity/saved-state consistency and dependency patching. No implementation is authorized by this audit. Normal hourly run 40984963322 succeeded, producing the deployed 6:24 p.m. Pacific summary, with 11 Workday cooldowns and no unexplained removals. Observe normal runs after 7:03:54 p.m. (Elkay) and 8:11:37 p.m. (ten rate-limited hosts) before claiming post-expiry behavior verified. Analytics scheduled cleanup observation remains open. Historical local/unpublished copy notes below are superseded for the copy visibly checked live in this audit; see the review for precise verification limits.

October 29 current status: source-health reporting and Workday backoff are published and production-verified. Two refreshes succeeded; the final collection took 376 seconds. All 20 discovery feeds are healthy; the final 665 employer-board records distinguish 654 healthy, 10 rate-limited and one cooldown. The four deployed data files match snapshot `3d75a23` (6,854 listings, generated `2026-10-30T01:12:12.152Z`, October 29 Pacific). Six new regression tests bring the suite to 156 passing tests; types, lint and export pass. Employer coverage is preserved, including Old Mission through its official Ashby board. See [source-health audit](SOURCE_HEALTH_AUDIT_2026-10-29.md).

Reviewed October 28, 2026. This file tracks concrete active work, follow-up, and evidence. The [roadmap](../ROADMAP.md) holds longer-term priorities and ideas. The [previous task record](ACTIVE_TASKS_ARCHIVE_2026-10-22.md) preserves the October 22 status and historical receipts; older detail is in [task history](TASK_HISTORY.md).

## Active milestone

October 29 source-health audit complete: [findings and recommended batch](SOURCE_HEALTH_AUDIT_2026-10-29.md). Repository snapshot at 14:24 UTC confirms 62/79; live retrieval was unavailable. The increase mainly comes from 54 additional Workday boards. All 17 failed source records are Workday (eight partial, eight rate-limited, one server error). Keep employer coverage; improve health categories and collection pacing, and review Old Mission/Zurn Elkay addresses. Owner-approved implementation and release are complete. Reporting, persisted cooldowns and retirement of Old Mission's obsolete Greenhouse address (keeping its official Ashby board) are published and production-verified; see the linked audit and receipt.

Coverage expansion and permission safeguards are published and production-verified October 28. Workflow 40831094943 succeeded; generated snapshot `ed828c0` exactly matched all four live JSON files. The latest run added 88 internships and removed no jobs after the initial permission-hold migration. At that release the inventory remained below the earlier snapshot. The October 29 restoration above supersedes that inventory status. See the [coverage expansion review](COVERAGE_EXPANSION_REVIEW.md) and [production receipt](coverage-expansion-production-result.json).

The broader coverage investigation remains open. The owner granted end-to-end implementation, push, deployment and verification approval, subject to no spending/payment method and permission-conscious lawful sourcing. The owner identified Jobright; automated competitive extraction is not cleared by its terms. This release does not establish one-stop coverage.

October 29: the owner identified Jobright. Its published terms do not clear an automated competitive listing corpus, so that benchmark is on hold; see [Jobright review](JOBRIGHT_BENCHMARK_REVIEW.md). The [count-loss diagnosis](COVERAGE_LOSS_DIAGNOSIS.md) traces approximately 95% of absent old rows to employer-evidence holds or missing permitted inputs, including 1,093 still collected directly. The final Palantir-only recovery adds 62 destinations and removes none in the frozen comparison; a summer-table classification guard also passes regression coverage. That earlier Palantir batch was published before the broader October 29 restoration work; its frozen comparison remains historical evidence. Current restoration status is recorded above and in the linked restoration review. The RTX alias experiment is deferred after causing extra availability holds. Existing full coverage-work authorization remains in effect.

Employer coverage retention and unexplained-drop safeguards are published and production-verified October 28. Workflow 40825645377 succeeded; generated snapshot `f7801da` exactly matched all four deployed public JSON files. Ten full-time jobs were restored with official evidence, and no jobs were removed in the production refresh. See [coverage review](COVERAGE_RETENTION_REVIEW.md) and [production receipt](coverage-retention-production-result.json).

Keryx New Grad 2026 activation and availability safeguards are published and production-verified. The release is complete; Fall remains inactive. See [production receipt](keryx-2026-production-result.json) and [release review](KERYX_PENDING_2026_REVIEW.md#production-release-and-verification-october-28).

## Site polish, October 29 (release approved)

- Owner-requested personal copy: Privacy opens with an informal analytics TL;DR explaining job-search and evidence-backed resume motivation. About and the footer state the always-free commitment. Copy-only additions, local and unpublished.

- Updates now use consistent monthly summaries for August through October 2026.
- Analytics preferences can close through Allow analytics again, an outside click, or Escape after a choice is saved. Browser privacy signals still block consent, and dismissal preserves the saved choice.
- TypeScript, focused lint, six analytics/client tests, and the static production build pass. Browser interaction verification remains outstanding. These changes have not been pushed or deployed.
- Footer credit now links to the owner's supplied LinkedIn profile, retaining its new-tab behavior. Focused footer lint passes; this change is local and unpublished.

- Full page-copy audit is complete locally: [findings and evidence](SITE_COPY_AUDIT_2026-10-29.md). All 150 tests, full lint, TypeScript, and static export pass. All 11 exported routes have headings and the targeted stale claims are absent. Live-site access failed, so current deployment state and browser layout are not claimed as verified.

Owner approved pushing all pending changes on October 29, including the earlier source-exclusion and Jobbie review notes. Final 150 tests, lint and production export pass. Publication is authorized; deployment verification is pending.

## Operational follow-up

- Restoration: the numerical recovery milestone is complete, but market-wide coverage is not established. The verified run was degraded: 73/79 source records and 646/653 boards were healthy. Five Workday boards returned 429, Zurn Elkay returned 500, and the retained Old Mission Greenhouse board returned 404. Review backoff and employer-site mappings without bypassing access controls. Positive recovery checks renew at 12 hours and expire at 24 hours; monitor future runs for queue or availability regressions.

- Coverage: board history is persisted by the refresh workflow. Healthy active boards remain tracked; undiscovered empty or failing boards age out after 90 days. The published retained-board allowance is 400 because permission holds reclassify existing boards; the 1,000-total cap remains. Investigate failed coverage guards using the seven-day Actions artifact rather than bypassing them or restoring old listings wholesale. Six permission-held community feeds must stay inactive without reviewed reuse permission.

- Analytics: the owner confirmed dashboard access and report credential rotation. Cleanup cron was configured, but the first successful scheduled execution was not observed in the latest [action log](ANALYTICS_ACTION_LOG.md). Check current evidence before marking it complete.
- Employer verification: monitor the balanced 150-check queue and review the remaining employer backlog. The reviewed Booz Allen Workday scope is now approved; other URL variants and the separate RTX pilot remain unresolved. Current official employer membership can satisfy scoped availability without redundant detail requests. Company workforce-size evidence is no longer a prerequisite where current employer-board evidence satisfies admission; explicit holds remain enforced.
- Keryx 2026: New Grad published and verified October 28. Workflow 40650482708 succeeded; snapshot `7711f2c` matched deployed JSON, with positive evidence for every published guarded destination and no shared-hold leaks. Fall remains inactive. Counts and detailed evidence belong in the [production receipt](keryx-2026-production-result.json); revisit Fall only in a separately approved batch.
- Source maintenance: review newly discovered seasonal files and official evidence for held destinations as needed. Keep unreviewed feeds inactive and uncertain destinations on hold. The last documented Winter hold recheck returned 403 for all 16 endpoints; this is a historical result, not a current count.
- Listing quality: revisit inconclusive duplicate groups when reliable official requisition evidence is available. Historical counts require a fresh measurement.
- Local checkout: the original divergence and nine later generated-data commits were reconciled without discarding edits. The approved Keryx release was pushed and its generated snapshot fast-forwarded locally. Unrelated staged source-exclusion/environment changes and the untracked Jobbie review remain; recovery copies and stashes are retained. See [initial reconciliation receipt](ENVIRONMENT_RECONCILIATION_2026-10-27.md) and [release review](KERYX_PENDING_2026_REVIEW.md#production-release-and-verification-october-28).

## Candidate next batch

1. Rebuild permitted coverage by reviewing employer identities, aliases and official board ownership. Prioritize demonstrated missing destinations from the coverage review rather than raw source totals.
2. Define an early-career experience rule, measure effects on current listings, and review examples before enabling broader exclusions.
3. Review the largest remaining duplicate groups where official identifiers support a decision.
4. Review future seasonal discoveries when maintenance finds them.

Coverage work remains owner-authorized within the constraints above. The other candidate areas are recommendations, not a separate selected milestone.

## Completed checkpoints

- Keryx Spring and Winter releases were published; the Winter production refresh was verified October 21. See [Winter receipt](keryx-winter-production-result.json).
- USAJOBS discovery and source quality follow-ups were published. See [source expansion review](SOURCE_EXPANSION_RELEASE.md) and [listing cleanup review](LISTING_CLEANUP_REVIEW.md).
- Owned analytics collection and the private dashboard were activated. See [analytics action log](ANALYTICS_ACTION_LOG.md).
- Hourly refresh scheduling and open-tab updates were activated and verified. See [hourly refresh operations](HOURLY_REFRESH.md).
- The Updates page was pushed to main. Routine job refreshes do not require timeline entries.

## Working agreement

Record changes to active status, decisions, evidence, blockers, and next actions when relevant. Keep detailed receipts in focused documents and archive superseded task history. Obtain explicit approval before pushing or deploying. Follow the zero-cost policy and keep public browsing account-free.

October 29 owner scope correction: remove People / Legal, Science / Health and Education from supported career families, including listings classified only in those families. Supported software, data, engineering, product, business, finance and IT roles at any employer sector remain eligible. Classification, legacy-tag filtering, public snapshots and Methodology are updated and production-verified. All 145 tests, TypeScript, lint and static export pass. See [scope receipt](career-scope-correction-result.json). Historical restoration receipts retain their original counts.

October 29 doubling audit: completed backlog, provider, redirect, directory and subsequent-refresh measurements. The tested pool supports incremental growth, not a substantiated 2x promise. Five verified employer boards are the small release batch; Headlands is held pending a clearer reuse basis; broad provider adapters and independent employer discovery remain follow-up engineering. No money, new account, dependency or career expansion. See the [feasibility review](DOUBLING_FEASIBILITY_REVIEW.md). Small batch and reliability-fix publication are verified; see docs/doubling-expansion-production-result.json (relative to repository root).
