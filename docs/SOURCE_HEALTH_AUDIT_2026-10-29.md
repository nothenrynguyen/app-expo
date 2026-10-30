# Source health audit, October 29

October 30 follow-up: normal hourly runs now verify post-expiry behavior. Elkay retried and increased bounded backoff after another HTTP 500; all ten original rate-limited hosts retried successfully and cleared their schedules in the 8:17 p.m. Pacific run on October 29. Later failures recur, so this does not establish permanent provider health. See [approved audit follow-up](APPROVED_FIXES_2026-10-29.md#production-cooldown-observation) and its [machine-readable receipt](approved-fixes-cooldown-result-2026-10-29.json). This observation did not deploy the separate local identity/scope/dependency fixes.

Initial read-only ingestion audit. Evidence: checked-in snapshot `cc1a95c`, generated `2026-10-29T14:24:31.386Z`, and matching `data/refresh-report.json`. The initial live retrieval attempts used the wrong domain. The implementation follow-up below uses the verified production domain, `https://empluzzed.fyi`.

## Where 79 came from

The headline counts 19 active community feeds (10 repositories), USAJOBS selective review, 58 individual Workday boards and one original-employer-link recovery process. All 19 community feeds, USAJOBS and recovery are marked successful. Workday contributes 41 successful and 17 failed records: 62/79 overall.

Git history confirms the main increase: `11afc44` (September 28) had 17 active community feeds and four Workday employers: Applied Materials, Micron, Medtronic and Abbott. `8f2078a` (October 28) had 19 active community feeds and those same four employers. `6b8d7cd` (October 29 coverage restoration) expanded Workday to 58 current employer/site pairs. That expansion added 54 individually counted records; original employer recovery added another record. See [restoration review](COVERAGE_RESTORATION.md). Community changes included Keryx seasonal expansion, licensed Aprameya discovery, and permission holds; feeds are not independent repositories or unique jobs.

The present catalog contains 26 community feed entries, seven inactive: six permission-held feeds (two AI College Jobs, two Simplify and two SpeedyApply), plus separately unapproved Keryx Fall 2026. Keep those inactive. The 19 active feeds include Internship Engine, ApplyGuy Product, zshah's tech table, three Dreamwork feeds, five Keryx feeds, three Vansh feeds, sndsh404 Summer, and three Aprameya feeds. Attribution overlaps and downstream deduplication are expected.

The headline excludes 600 Greenhouse/Lever/Ashby boards from its denominator. The board report separately covers 658 boards: 299 Greenhouse, 211 Ashby, 90 Lever and 58 Workday. There are 24 pinned non-Workday boards; the rest of that provider coverage is discovered or retained. Thus “79 sources” is a mixed operational metric, not a complete employer count.

## Why 17 records failed

| Category | Employers | Interpretation |
| --- | --- | --- |
| Whole-board HTTP 429 | Marvell, HP Inc., Johnson & Johnson, Rockwell Automation, Bank of America, Sierra Space, Milwaukee Tool, LPL Financial Holdings | Provider rate limits. Keep coverage; reduce and stagger requests, honor cooldowns. |
| Whole-board HTTP 500 | Zurn Elkay Water Solutions | Repeated server failure. Check exact site mapping and official careers migration; pause if persistently unusable. No evidence here that the employer should be removed. |
| Partial detail failures | Micron (48/116), GlobalFoundries (14/96), HNTB (74/111), Motorola (42/79), CVS Health (90/193), Intel (33/64), Northrop Grumman (10/73), Amentum (18/63) | Detail failures / attempted detail entries. These boards still supplied data. Exact per-detail HTTP causes are not persisted in this report, so do not attribute all 329 failures to rate limits. |

`lib/ingestion/load-candidates.ts` marks a Workday source failed for any failed detail or unknown check. The board diagnostic only marks it failed when all attempted details fail. Consequently 62/79 source health coexists with 647/658 board health. Neither is the fraction of published jobs that are open. Workday source `rows` measures searched postings, not qualifying published jobs. Recovery also reports success unconditionally when its queue exists, even with unknown/unchecked targets, so that record does not establish complete verification.

Outside those 17 source records, the board report includes Old Mission's retained Greenhouse address returning 404 and CrossCountry Consulting's Lever timeout after retry. Old Mission also failed in previous release receipts. Verify its current official board, replace a migrated address, or retire the obsolete address if confirmed. Keep CrossCountry and monitor the transient timeout.

## Recommended next batch

1. Separate community feeds, employer boards and recovery in public health reporting. Represent partial, rate-limited, unavailable and successful outcomes explicitly, with detail failure counts and reasons. Preserve warnings instead of improving the percentage by dropping failing employers.
2. Add persistent Workday collection cooldowns and stagger expensive boards. Current collection uses three concurrent boards, four detail tasks per board and a 90-second board budget. It stops further requests within a board after 401/403/429 and does not immediately retry 429, but that board-local pause is recreated next run. The separate employer-recovery path already has a longer host pause. Measure requests, current accepted yield and unique contribution before pruning search terms or low-yield boards.
3. Inspect Old Mission migration and Zurn Elkay mapping with official evidence. Do not infer closure from these failures. Keep CrossCountry unless repeat evidence warrants a configuration change.
4. Preserve exact-site Workday continuity: recent positive evidence lasts at most 24 hours; unknown checks cannot renew it, and explicit closed/ineligible outcomes override retention. A successful refresh can still lose coverage after evidence expires during a long outage.

No broad deletion is supported by this snapshot. The owner subsequently authorized implementation and release. No Updates entry is needed for this operational repair.

## Approved implementation

- Public health groups now separate discovery feeds (community plus USAJOBS), all employer boards, and employer-link recovery. Every employer provider is counted once in the employer group. Outcomes distinguish healthy, partial, rate limited, unavailable and cooling down. The legacy mixed counts remain in JSON for compatibility, but Methodology and the owner dashboard no longer present them as the headline.
- Workday details use three concurrent tasks instead of four, with request starts spaced at least 150 ms per board. Three boards still run concurrently and the 90-second per-board budget remains. Failures record actual network requests, detail error buckets and unknown checks.
- A persisted, host-keyed Workday schedule backs off rate limits from two to twelve hours and server failures from one to six hours. Retry-After can extend the delay, bounded to 24 hours. Access denials pause for 24 hours. A skipped cooldown does not advance its deadline. Successful or usable partial responses reset the failure streak; access-denied partial responses still trigger cooldowns. The existing coverage guard gates schedule writes alongside other refresh state; the workflow commits the schedule with successful snapshots. This is not a promise to persist cooldowns after a blocked publication.
- Exact-site/requisition continuity remains capped at 24 hours, with explicit closures/ineligible outcomes winning and no renewal from unknown checks. Neither cooldowns nor new reporting grant listing trust.
- Old Mission's official careers HTML was checked October 29. It embeds `https://jobs.ashbyhq.com/old-mission-capital/embed?version=2`; the current repository board report confirms 38 Ashby rows. Both old Greenhouse keys tested return 404. Pin the existing Ashby board and explicitly retire `greenhouse:oldmissioncapital` across discovery, history and bootstrap. Do not rewrite old job links or resurrect old jobs. Evidence: [official careers](https://www.oldmissioncapital.com/careers/).
- Zurn Elkay's [official careers page](https://zurnelkay.com/careers) links to the exact configured `elkay.wd1.myworkdayjobs.com/Elkay_External` site. Keep that mapping and apply outage backoff. CrossCountry was healthy again in the newer snapshot and stays enabled.
- Production before implementation: `2026-10-30T00:24:18.528Z` (October 29 Pacific), 6,856 jobs and legacy 78/79. This recovery preceded the repair and is not attributed to it.

Local tests cover cooldown persistence across two collector runs with zero requests on the second, Retry-After and exact uncertainty on detail failures, retired-board rediscovery suppression, and provider-complete health grouping. The first two-detail-worker production trial approached the ten-minute workflow limit, so the final setting uses three detail tasks while retaining pacing and cooldowns. Release verification is complete below.


## Production verification

Implementation commits `45373c5`, `782da99` and final runtime setting `83361ce` are published. [First refresh](https://github.com/nothenrynguyen/app-expo/actions/runs/40982650296) succeeded: snapshot `ed62823`, 6,857 listings, collection 542,833 ms. The sequential [final refresh](https://github.com/nothenrynguyen/app-expo/actions/runs/40983726064) succeeded: snapshot `3d75a23`, generated `2026-10-30T01:12:12.152Z` (October 29 Pacific), 6,854 listings (4,256 internships and 2,598 full-time), collection 376,120 ms. Runtime includes changing provider conditions and is not a controlled performance benchmark.

All 20 discovery feeds succeeded. Of 665 employer boards, 654 were healthy, 10 rate limited and one cooling down. Some rate-limited boards still supplied partial data. Employer-link recovery remains partial. The source percentage is not artificially made perfect by deleting legitimate employers.

Zurn Elkay's saved deadline and failure streak survived unchanged. Its second refresh made zero requests. Ten additional Workday hosts now have recorded two-hour cooldowns after 429s. Old Mission's obsolete Greenhouse address is absent from collection and published jobs; its official Ashby board succeeds. The queued backup workflow `40983767739` succeeded with collection/publication skipped because the new snapshot was fresh.

The second raw change report shows one addition and four URL removals classified `not-returned-by-sources`. Manual exact employer-host/site/requisition comparison establishes that all four openings remain published under alternate locale-prefixed URLs: Northrop Grumman `R10258160`, `R10257986`, `R10258192` and GlobalFoundries `JR-2604163`. They are not four lost opportunities. The raw report still lacks automatic classification of this alias case; broader cross-source deduplication and URL-change diagnostics remain follow-up work, outside this source-health repair.

All four live collection/summary JSON files match the final snapshot byte for byte. The snapshot deployment reports Vercel success. Methodology's health groups and desktop layout were checked in a browser. All 156 tests, TypeScript, lint and static export pass. Local verification checks summary/collection agreement, destination-identity uniqueness, supported locations/roles, retired-address exclusion, current Ashby coverage, continuity evidence expiry, and coverage guard results. See the [production receipt](source-health-production-result.json).

Remaining operational limits: cooldowns manage provider failures rather than curing them; recent listing evidence still expires after 24 hours and unknown responses never renew it. Observe the normal scheduled runs after cooldown expiry. No broader source pruning, permission activation, career-scope change, spending, or infrastructure change was performed.
