# Active project tasks

Reviewed October 28, 2026. This file tracks concrete active work, follow-up, and evidence. The [roadmap](../ROADMAP.md) holds longer-term priorities and ideas. The [previous task record](ACTIVE_TASKS_ARCHIVE_2026-10-22.md) preserves the October 22 status and historical receipts; older detail is in [task history](TASK_HISTORY.md).

## Active milestone

Keryx New Grad 2026 activation and availability safeguards have completed approved steps 1-7, including local validation and the scoped milestone commit. Push and deployment remain unapproved; Fall remains inactive. See [local release checkpoint](KERYX_PENDING_2026_REVIEW.md#step-7-local-release-checkpoint-october-28).

## Operational follow-up

- Analytics: the owner confirmed dashboard access and report credential rotation. Cleanup cron was configured, but the first successful scheduled execution was not observed in the latest [action log](ANALYTICS_ACTION_LOG.md). Check current evidence before marking it complete.
- Employer verification: monitor the bounded verification queue and review the remaining employer backlog. Booz Allen and RTX pilot proposals remain on hold pending review of existing jobs and URL variants.
- Keryx 2026: steps 1-7 complete locally. New Grad is enabled in the local catalog with shared, bounded positive-availability checks and persisted destination protection across aliases and recovery. Full trial adds two jobs with no removals; failure simulation prevents unverified reintroduction. All 118 tests, lint, TypeScript and build passed, and implementation hashes were reconfirmed October 28. Fall remains inactive. Publication awaits separate approval and production verification. See [local release checkpoint](KERYX_PENDING_2026_REVIEW.md#step-7-local-release-checkpoint-october-28).
- Source maintenance: review newly discovered seasonal files and official evidence for held destinations as needed. Keep unreviewed feeds inactive and uncertain destinations on hold. The last documented Winter hold recheck returned 403 for all 16 endpoints; this is a historical result, not a current count.
- Listing quality: revisit inconclusive duplicate groups when reliable official requisition evidence is available. Historical counts require a fresh measurement.
- Local checkout: reconciled with fetched remote main through a local merge, retaining original work in a recovery folder and stash. All 112 tests, ESLint, and the production build passed. No push or deployment occurred; review the two local commits before publication. See [reconciliation receipt](ENVIRONMENT_RECONCILIATION_2026-10-27.md).

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
