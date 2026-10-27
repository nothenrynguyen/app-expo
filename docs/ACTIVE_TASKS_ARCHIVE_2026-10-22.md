# Active project tasks

Updated October 22, 2026. Earlier task-by-task notes are preserved in [task history](TASK_HISTORY.md).

## Homepage methodology link and engine-feed correction

The homepage screened-link count now points to `/methodology`, with a matching accessible label. Live investigation of the 25/26 source-health count identified Internship Engine: the cleanup validator rejected an undated row at index 1181 and failed the whole feed. The endpoint is online. The parser now preserves the earlier skip behavior for null, absent or empty posting dates; other malformed dated rows still fail validation. Regression coverage includes mixed dated/undated input. Live parser verification accepted 1,181 dated rows from 1,190 upstream rows and skipped nine undated rows. This is parsing verification, not a count of publishable jobs. All 83 tests pass. The owner approved publication. No local snapshot refresh was run; verify source recovery on the next scheduled refresh after publication.

## Local codebase cleanup

The owner approved the seven-step codebase cleanup plan. Local changes remove an unused role helper, narrow module-local exports, align lint exclusions with disposable research output, and validate engine-feed input within source failure handling. Script lifecycles and data contracts are recorded in [the cleanup inventory](CODEBASE_CLEANUP.md). All 83 tests, whole-repository lint, strict TypeScript with unused checks, static export and the offline location audit pass. The Windows build required execution outside the sandbox after generated-folder EPERM errors. All 6,091 snapshot jobs pass the supported-country policy. Final diff review found no public snapshot or storage-contract changes. The owner approved commit and push after validation. Publication is in progress.

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

## Homepage screened-count link

Published with owner approval at 18fc484: the purple screened-links number links to /about and underlines on hover or keyboard focus. Browser navigation verified. Lint and TypeScript pass. Detailed statistics remain on /methodology, linked from About.

## Self-service source discovery, batch 1

Complete: reviewed access and measured 2,142 rows from Jobr, YubHub, OnJob and Remote OK against a captured 5,990-job production baseline. No accounts, payments, outreach or source activation. Jobr has 59 employer-held leads and one possible overlap, but all 60 application checks hit an access challenge before reaching employers. Zero additions are confirmed publishable. YubHub has four employer holds, OnJob one, and Remote OK none after initial screening. Counts are samples, not inventory sizes or promised additions.

Follow-up validation complete with owner approval: normal-browser links reveal a paid-service/free-manual-application choice. Verified three official employer postings, but the automated direct-application gate failed. Do not enable Jobr under its current feed contract. The conditional adapter was not built; publication review concludes no release and zero approved additions. See [validation decision](JOBR_PILOT_VALIDATION.md), [initial pilot review](SELF_SERVICE_SOURCE_PILOT_REVIEW.md) and [measurement](self-service-source-measurement.json). Jobr is a separate aggregator from Jobright.

## Next actions

1. Complete: discover self-service non-software sources, verify feed-specific publication permission and measure bounded samples. NLx remains deferred without outreach.
2. Complete: validate Jobr and review publication. Three official job pages verified; direct automated application links remain unavailable. Candidate closed under the current feed contract, conditional adapter skipped and no release prepared.
3. Complete locally with owner approval: Keryx Spring 2027 added using the existing direct-ATS reader. 169 parsed candidates, 107 admitted listings carrying Spring credit, 48 new after destination/semantic/Workday overlap checks, 57 employer holds retained. Full board: 6,008 jobs versus 5,990 baseline, net +18 after ordinary churn. Future-season discovery and rename/attribution maintenance repaired; new discoveries stay inactive. Paid-service exclusion recorded, with Jobr permanently excluded unless the owner requests review. All 80 tests, lint, TypeScript and static export pass; data audits pass. Interactive preview unavailable due browser policy/local connection limits. [Release review](KERYX_SPRING_RELEASE.md).
4. Continue the 44 inconclusive duplicate groups when stronger official identifiers become available; retain separate requisitions without proof of duplication.

The NLx draft is historical research only. Do not contact providers or submit applications without explicit authorization. Individual-employer migrations remain lower-priority maintenance.

Publication queue:

1. Complete: release 0c3af79 pushed and deployed. Production refresh 39501464029 passed and published snapshot 57629bd, also deployed successfully. Live generatedAt 2026-10-20T21:37:14.617Z, 6,017 jobs, 107 Spring-credited listings and Sources-page attribution verified. Spring feed healthy; Medtronic returned 429, alongside three existing board 404s. [Production receipt](keryx-spring-production-result.json).
2. Initial Winter measurement complete, superseded by task 3: 53 parsed candidates, 20 existing destinations, two within-sample aliases, one suspected requisition overlap and 30 employer-held leads. The overlap was later resolved as distinct IDs. The collection remains unpublished. [Initial Winter review](KERYX_WINTER_REVIEW.md).
3. Complete locally with owner approval: four employer reviews, official posting checks and Winter-inclusive refresh. Fifteen new Winter listings (11 US, four Canada), 34 Winter-credited listings total, 16 unresolved destinations held across feeds/aliases/recovery, and 6,105 board jobs versus 6,014 captured live baseline. Corrected a false Workday requisition collision, a stale Insulet closure and Canadian country-code classification. All 82 tests, lint, TypeScript, data audits and static export pass. [Winter release review](KERYX_WINTER_RELEASE.md).
4. Review future seasonal files when weekly maintenance finds them. Do not activate pending files automatically or reconsider sources in [the exclusion register](SOURCE_EXCLUSIONS.md).

Latest approved iteration:

1. Publication approved and pushed: release c248726 includes the reconciled Winter snapshot, 6,092 jobs and 35 Winter-credited records. All 82 tests and data audits pass.
2. Production verification complete: refresh run 39549427823 passed and snapshot 4b30025 deployed successfully. Live generatedAt 2026-10-21T05:28:15.052Z, 6,091 jobs, 35 Winter-credited records, all 26 feeds healthy, correct Canadian labels and zero held identities present. [Production receipt](keryx-winter-production-result.json).
3. Hold recheck complete: all 16 unresolved official detail endpoints still return 403. Holds remain. [Recheck receipt](keryx-winter-hold-recheck.json).

Recommended next batch after production verification:

1. Define an explicit early-career experience rule, measure current listings against it, and present examples before enabling broader exclusions.
2. Review the largest remaining duplicate groups only where official requisition evidence is available.
3. Review future seasonal discoveries when maintenance finds a new file. Leave pending files inactive and blocked destinations held.

## Later queue

- Define clearer early-career experience boundaries before broad exclusions.
- Consider browser-local hide-reviewed jobs and restore behavior.
- Review optional backend, authentication and cross-device storage against the zero-cost policy.

## Completed checkpoints

- Previously approved site changes published at 470155a.
- Keryx integration, reviewed employer coverage and documented employer evidence batches completed locally.
- Automatic USAJOBS discovery and final release preparation completed locally. Detailed decisions and historical validation remain in [task history](TASK_HISTORY.md).
