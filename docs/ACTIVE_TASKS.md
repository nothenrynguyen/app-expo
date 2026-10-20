# Active project tasks

Updated October 19, 2026. Earlier task-by-task notes are preserved in [task history](TASK_HISTORY.md).

## Working agreement

Keep this list current and report next actions after every iteration. Make reasonable local changes within approved scope. Commit coherent tasks after relevant checks pass. Obtain explicit approval before pushing/deploying. New services must satisfy COST_POLICY.md. Keep browsing free and account-free.

## Current milestone: source-expansion release

The owner approved all four development steps as one batch. All four are complete. The owner approved publication, and release 7ab69a1 was pushed October 19, 2026.

| Step | Status | Evidence |
| --- | --- | --- |
| Automatic USAJOBS discovery | Complete | Eleven searches, bounded pagination and official-page verification. [Operation guide](USAJOBS_AUTOMATIC_DISCOVERY.md) |
| Automatic quality filters | Complete | Unpaid, closed, senior and standing-pool exclusions/holds; fresh employer provenance and eligibility presentation. 70 tests pass. |
| Measure useful coverage | Complete | Local 6,106 jobs versus 5,532 live (+574 net). Keryx credited on 570 listings absent from production; USAJOBS adds ten, eight internships/two graduate roles. [Measurement](source-expansion-release-result.json) |
| Prepare one local release review | Complete | Tests, lint, TypeScript, static export, data audit and compact/card browser checks pass. [Release review](SOURCE_EXPANSION_RELEASE.md) |
| Publish and verify production | Complete | Release 7ab69a1 and automatic snapshot 17bda91 deployed successfully. Run 39315578545 passed. Live generatedAt advanced to 2026-10-19T20:02:57.268Z: 5,491 jobs, 11 federal listings. |

Historical release-review limits included six employer-board 404s, two timeouts and 208 possible semantic duplicate groups. The published follow-up below supersedes those counts. Source/category counts can overlap and must not be added to net board growth.

## Refresh quality follow-up

Completed and published after owner approval to investigate all three next actions:

- Traced the initial 615 net drop: 671 removed and 56 added, with 611 missing destinations on timed-out employer boards.
- Added one bounded retry and scoped outage recovery, preserving confirmed closures, freshness and federal verification rules.
- Repaired Luma and Commure board addresses from official career links.
- Reviewed duplicate groups and added conservative same-requisition Workday merging. A fresh local refresh has 6,104 jobs, 11 federal listings, all 24 feeds healthy, four unresolved legacy board 404s and 182 remaining semantic review groups.
- 73 tests, lint, TypeScript and snapshot location/freshness/identity audits pass. Code committed locally; publication was approved and release d4577c9 was pushed. Production refresh 39358051059 passed and deployed successfully: 6,106 jobs, 11 federal listings, four legacy board 404s, and two successful retries.

Final closure refresh 39358416742 passed and snapshot 82034d1 deployed successfully. Live generatedAt: 2026-10-20T02:23:32.235Z. The board has 6,103 jobs and 11 federal listings; both confirmed-closed H&R Block URLs are absent. Four legacy board 404s remain.

Evidence and limitations: [refresh quality review](REFRESH_QUALITY_REVIEW.md).

## Approved cleanup and source research iteration

Owner approved tasks 1 (listing cleanup) and 2 (research broad non-software sources). Both are complete for this iteration, with uncertainty retained explicitly.

- Checked 192 official URLs for all 85 previously unresolved groups plus the two iPipeline groups. Found 18 groups with distinct official requisitions, 15 containing confirmed same-requisition aliases, five containing unavailable destinations, and 49 inconclusive groups on that baseline.
- Local refreshed snapshot: 6,077 jobs, including 11 federal listings. Removed 18 redundant entries, five confirmed-closed links and four non-job privacy-page links; added one new destination.
- Added a bounded per-refresh removal report and timestamp-matched audit evidence. All 27 removals are explained. The new artifact is included in workflow publication.
- 76 tests, lint, TypeScript and snapshot data audits pass. Remaining semantic groups after cleanup: 118 recognized distinct-token groups and 44 needing more official evidence. No speculative removals.
- Researched nine broad-source options. Recommend CareerOneStop access/license verification first, Adzuna publisher-access verification second. Jobicy's complete USA-filtered seven-day sample returned 446 rows with only eight broad early-career signals; accepted unique yield is not established. No new source was enabled or account created.

Evidence: [cleanup review](LISTING_CLEANUP_REVIEW.md), [source shortlist](NON_SOFTWARE_SOURCE_SHORTLIST.md), and data/listing-changes.json. Publication was approved and release 12f1318 was pushed. All 76 tests passed again. Production refresh 39367465734 passed and snapshot 2e1c661 deployed successfully. Live generatedAt: 2026-10-20T04:05:47.590Z, 6,077 jobs and 11 federal listings. All 24 feeds succeeded; four legacy board 404s remain. The new removal report records one confirmed closure and one addition in this refresh.

## Next actions

1. Review the corrected NLx public-feed request draft and authorize clarification outreach if desired. The standard research license is not a public-job-board permission.
2. If no suitable free public-feed route is available, assess Adzuna publisher permission and hard request caps before proposing a pilot.
3. Continue the 44 inconclusive groups when stronger official identifiers are available. Keep distinct requisitions visible.
4. Lower-priority maintenance: verify Cognition/Hyphenate employer coverage and resolve Whatnot's inaccessible API. These are not the main coverage-growth strategy.

Prepared access review: [corrected NLx request draft](NLX_ACCESS_REQUEST_DRAFT.md). No form submitted, message sent, agreement accepted or source enabled.

## Later queue

- Define clearer early-career experience boundaries before broad exclusions.
- Consider browser-local hide-reviewed jobs and restore behavior.
- Review optional backend, authentication and cross-device storage against the zero-cost policy.

## Completed checkpoints

- Previously approved site changes published at 470155a.
- Keryx integration, reviewed employer coverage and documented employer evidence batches completed locally.
- Automatic USAJOBS discovery and final release preparation completed locally. Detailed decisions and historical validation remain in [task history](TASK_HISTORY.md).
