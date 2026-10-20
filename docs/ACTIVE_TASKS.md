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

Known limits: refresh is degraded by six existing employer-board 404s and two timeouts (both timeout endpoints responded on targeted follow-up). 208 possible semantic duplicate groups remain unconfirmed. Source/category counts can overlap and must not be added to net board growth.

## Refresh quality follow-up

Completed locally after owner approval to investigate all three next actions:

- Traced the initial 615 net drop: 671 removed and 56 added, with 611 missing destinations on timed-out employer boards.
- Added one bounded retry and scoped outage recovery, preserving confirmed closures, freshness and federal verification rules.
- Repaired Luma and Commure board addresses from official career links.
- Reviewed duplicate groups and added conservative same-requisition Workday merging. A fresh local refresh has 6,104 jobs, 11 federal listings, all 24 feeds healthy, four unresolved legacy board 404s and 182 remaining semantic review groups.
- 73 tests, lint, TypeScript and snapshot location/freshness/identity audits pass. Code committed locally; publication was approved and release d4577c9 was pushed. Its production refresh is being verified.

Evidence and limitations: [refresh quality review](REFRESH_QUALITY_REVIEW.md).

## Next actions

1. Finish verifying production refresh 39358051059 for the published follow-up.
2. Verify employer identity/coverage for the Cognition and Hyphenate migration leads. Atomic Semi already links to pinned fab2; Whatnot remains inaccessible to the checker. Keep legacy failures visible.
3. Resolve three iCIMS same-token groups (two privacy-gated iPipeline pairs and one closed H&R Block pair), then obtain official evidence for 85 unresolved groups. Retain the 94 groups with distinct recognized requisition tokens. Improve removal explanations.
4. Reassess other broad non-software sources using measured eligible unique yield.

## Later queue

- Define clearer early-career experience boundaries before broad exclusions.
- Consider browser-local hide-reviewed jobs and restore behavior.
- Review optional backend, authentication and cross-device storage against the zero-cost policy.

## Completed checkpoints

- Previously approved site changes published at 470155a.
- Keryx integration, reviewed employer coverage and documented employer evidence batches completed locally.
- Automatic USAJOBS discovery and final release preparation completed locally. Detailed decisions and historical validation remain in [task history](TASK_HISTORY.md).
