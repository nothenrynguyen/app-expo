# Active project tasks

Reviewed October 26, 2026. This file tracks concrete active work, follow-up, and evidence. The [roadmap](../ROADMAP.md) holds longer-term priorities and ideas. The [previous task record](ACTIVE_TASKS_ARCHIVE_2026-10-22.md) preserves the October 22 status and historical receipts; older detail is in [task history](TASK_HISTORY.md).

## Active milestone

Rocket Lab employer-verification pilot: validate the first production refresh and monitor the bounded verification queue. Booz Allen and RTX remain held for separate review. See [employer verification review](EMPLOYER_VERIFICATION_REVIEW.md).

## Operational follow-up

- Analytics: the owner confirmed dashboard access and report credential rotation. Cleanup cron was configured, but the first successful scheduled execution was not observed in the latest [action log](ANALYTICS_ACTION_LOG.md). Check current evidence before marking it complete.
- Source maintenance: review newly discovered seasonal files and official evidence for held destinations as needed. Keep unreviewed feeds inactive and uncertain destinations on hold. The last documented Winter hold recheck returned 403 for all 16 endpoints; this is a historical result, not a current count.
- Listing quality: revisit inconclusive duplicate groups when reliable official requisition evidence is available. Historical counts require a fresh measurement.
- Local checkout: the Updates page was pushed on top of a newer remote main while the local checkout retained unrelated uncommitted changes. Reconcile carefully before future Git operations, preserving those changes and current remote work.

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
