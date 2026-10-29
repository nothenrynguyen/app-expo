# Active project tasks

Reviewed October 28, 2026. This file tracks concrete active work, follow-up, and evidence. The [roadmap](../ROADMAP.md) holds longer-term priorities and ideas. The [previous task record](ACTIVE_TASKS_ARCHIVE_2026-10-22.md) preserves the October 22 status and historical receipts; older detail is in [task history](TASK_HISTORY.md).

## Active milestone

Coverage expansion and permission review is in progress with full owner approval through publication and live verification. Compare licensed source candidates, fix demonstrated collection gaps, and retain no-card/no-spending and source-permission constraints. Implementation and controlled validation are local until the [coverage expansion review](COVERAGE_EXPANSION_REVIEW.md) records a production receipt.

Employer coverage retention and unexplained-drop safeguards are published and production-verified October 28. Workflow 40825645377 succeeded; generated snapshot `f7801da` exactly matched all four deployed public JSON files. Ten full-time jobs were restored with official evidence, and no jobs were removed in the production refresh. See [coverage review](COVERAGE_RETENTION_REVIEW.md) and [production receipt](coverage-retention-production-result.json).

Keryx New Grad 2026 activation and availability safeguards are published and production-verified. The release is complete; Fall remains inactive. See [production receipt](keryx-2026-production-result.json) and [release review](KERYX_PENDING_2026_REVIEW.md#production-release-and-verification-october-28).

## Operational follow-up

- Coverage: board history is persisted by the refresh workflow. Healthy active boards remain tracked; undiscovered empty or failing boards age out after 90 days. The local expansion trial raises the retained-board allowance from 250 to 400 because permission holds reclassify existing boards; the 1,000-total cap remains. See the [expansion review](COVERAGE_EXPANSION_REVIEW.md) for publication state. Investigate failed coverage guards using the seven-day Actions artifact rather than bypassing them or restoring old listings wholesale.

- Analytics: the owner confirmed dashboard access and report credential rotation. Cleanup cron was configured, but the first successful scheduled execution was not observed in the latest [action log](ANALYTICS_ACTION_LOG.md). Check current evidence before marking it complete.
- Employer verification: monitor the bounded verification queue and review the remaining employer backlog. Booz Allen and RTX pilot proposals remain on hold pending review of existing jobs and URL variants.
- Keryx 2026: New Grad published and verified October 28. Workflow 40650482708 succeeded; snapshot `7711f2c` matched deployed JSON, with positive evidence for every published guarded destination and no shared-hold leaks. Fall remains inactive. Counts and detailed evidence belong in the [production receipt](keryx-2026-production-result.json); revisit Fall only in a separately approved batch.
- Source maintenance: review newly discovered seasonal files and official evidence for held destinations as needed. Keep unreviewed feeds inactive and uncertain destinations on hold. The last documented Winter hold recheck returned 403 for all 16 endpoints; this is a historical result, not a current count.
- Listing quality: revisit inconclusive duplicate groups when reliable official requisition evidence is available. Historical counts require a fresh measurement.
- Local checkout: the original divergence and nine later generated-data commits were reconciled without discarding edits. The approved Keryx release was pushed and its generated snapshot fast-forwarded locally. Unrelated staged source-exclusion/environment changes and the untracked Jobbie review remain; recovery copies and stashes are retained. See [initial reconciliation receipt](ENVIRONMENT_RECONCILIATION_2026-10-27.md) and [release review](KERYX_PENDING_2026_REVIEW.md#production-release-and-verification-october-28).

## Candidate next batch

1. Define an early-career experience rule, measure effects on current listings, and review examples before enabling broader exclusions.
2. Review the largest remaining duplicate groups where official identifiers support a decision.
3. Review future seasonal discoveries when maintenance finds them.

These are recorded recommendations, not an authorization to start or deploy a batch.

## Completed checkpoints

- Keryx Spring and Winter releases were published; the Winter production refresh was verified October 21. See [Winter receipt](keryx-winter-production-result.json).
- USAJOBS discovery and source quality follow-ups were published. See [source expansion review](SOURCE_EXPANSION_RELEASE.md) and [listing cleanup review](LISTING_CLEANUP_REVIEW.md).
- Owned analytics collection and the private dashboard were activated. See [analytics action log](ANALYTICS_ACTION_LOG.md).
- Hourly refresh scheduling and open-tab updates were activated and verified. See [hourly refresh operations](HOURLY_REFRESH.md).
- The Updates page was pushed to main. Routine job refreshes do not require timeline entries.

## Working agreement

Record changes to active status, decisions, evidence, blockers, and next actions when relevant. Keep detailed receipts in focused documents and archive superseded task history. Obtain explicit approval before pushing or deploying. Follow the zero-cost policy and keep public browsing account-free.
