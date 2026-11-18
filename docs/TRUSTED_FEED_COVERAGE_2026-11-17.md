# Trusted-feed availability and ingestion growth

Status: implementation `e163a7f` is published; successful production run and live snapshot `240efa6` are verified. This extends the published outage repair without adding public controls or paid services.

## Quality-preserving Workday fallback

Eleven existing, active, permission-reviewed feeds explicitly opt into Workday availability fallback. This setting is separate from employer trust. Sources with an explicit live-listing requirement and Keryx feeds retain their existing strict policies. Shared identities subject to a strict source gate cannot bypass it through another feed.

A freshly fetched, nonempty, healthy opted-in feed can establish temporary availability only during an outage recorded for the exact Workday employer site. The candidate still passes employer approval, role classification, experience, location, freshness and review-hold checks. Quarantined companies cannot use this fallback. Current terminal Workday evidence, healthy official-board absence and existing listing-closure checks still override it.

Source-backed availability is stored separately in `availabilityEvidence`. It never updates `lastVerifiedAt` or promotes employer trust. Held jobs can return on this bounded feed evidence; they need not wait for an employer check when this policy applies. Default results stay simple; no new user-facing tab is added.

The first observation fixes the deadline across refreshes and feeds: at most seven days for a reliably dated record, additionally capped at fourteen days from its source date; otherwise at most three days. Duplicate feeds, date edits, title changes and repeated downloads never extend the stored deadline. Invalid/future dates fail closed. Observations persist even after a coverage-blocked refresh. A failed/absent feed cannot establish fresh availability; an expired fallback cannot preserve itself through snapshot recovery.

## Intake target and measurement

The owner's priority is to expand quality job coverage and double ingestion, without weakening screening. The verified baseline snapshot `3b8e9a3` processed 23,827 candidate rows and published 5,193 jobs. Screening recorded 5,963 excluded destinations and 8,159 pending verification; pending jobs are not proven bad or closed.

Target: at least 47,654 candidate rows per comparable refresh, with unique opportunity growth as the primary success measure. The first instrumentation measurement found 18,765 unique opportunities among 23,826 candidate rows (5,061 duplicate rows); the corresponding unique target is 37,530. These are measured baselines and targets, not achieved growth claims.

Each refresh now records `intake.candidateRows`, `uniqueOpportunities`, `duplicateRows`, per-source unique and Workday opportunities, and fallback observed/eligible/expired/admitted counts. Cross-source totals use exact opportunity identities, so ingesting another copy does not count as unique growth.

The first local measurement, before the final strict-source protection, admitted 18 source-backed Workday jobs and passed coverage guards. This is preliminary diagnostic evidence, not the final release count. Production results below will use the final strict policies. Local generated snapshots will be preserved separately rather than published over newer observations.

Next expansion order: identify net-new employers and role families from licensed feeds already in use; measure overlap and the pending-verification bottleneck; expand official-board coverage in bounded batches; then review additional sources for permission and quality. Keep source restrictions, admission rules, deduplication and zero-cost limits. More request volume or duplicate source rows alone do not satisfy the target. No unreviewed source is enabled by this release.

## Verification

All 212 tests pass, including exact-site outage scope, inactive/failed/partial feed rejection, fixed deadlines across feed changes, invalid dates and workflow preservation of observation-only state. Lint, TypeScript and static export pass. Final production receipt is recorded after a real refresh and deployed-data comparison.


## Production receipt

[Run 44217830328](https://github.com/nothenrynguyen/app-expo/actions/runs/44217830328) passed all 212 tests, refresh, publication and the consolidated incident update. Snapshot `240efa6`, generated `2026-11-18T01:44:29.993Z` (November 17, 5:44 p.m. Pacific), contains 5,197 current listings and 617 internal holds. All four live JSON files match the commit byte-for-byte and the deployment status is successful. Both collection guards pass with unchanged thresholds.

Final intake: 23,826 candidate rows, 18,765 unique opportunities and 5,061 duplicate rows. The fallback observed 1,895 feed rows, with 262 eligible before downstream quality and strict-source gates, 944 expired and five finally admitted. Counts before admission are row counts, not additional unique jobs. All five source-backed jobs were absent from the prior current-job ID set. Total current count increased by four after other normal refresh churn. Their `lastVerifiedAt` remains null; feed observation times did not become employer verification dates.

The same ongoing issue 3 was updated, with no new incident issue created. Workday remains degraded; this release does not claim provider recovery or unlimited freshness. Local preliminary data is retained in a named stash and was not published.

Growth target remains open: expand toward at least 37,530 unique opportunities and 47,654 candidate rows per comparable refresh without weakening admission. The five-job gain completes the bounded-fallback step, not the doubling objective. Next work is a measured coverage expansion using net-new employers and role-family gaps, with attention to strict-source pending-verification bottlenecks.
