# Employer verification review

October 27, 2026. Review and release record.

The production snapshot at 09:20 UTC reported 4,885 pending normalized application destinations. The corresponding quarantine file contains raw source observations, not final unique pending outcomes. Grouping its size/US-presence observations and excluding currently published URL identities identified review priorities; counts may include other final exclusions, aliases and duplicates.

Reviewed employer evidence for TikTok, Tesla, Booz Allen Hamilton (including Booz Allen), Rocket Lab and the existing RTX entry (including exact source name RTX (Raytheon)). Source evidence and proposed records are in [the unpublished candidates](employer-verification-candidates.json); the active trust registry was left unchanged. These decisions establish employer coverage only, not individual listing availability or eligibility. Listings remain subject to the existing role, location, freshness, duplicate, and listing checks. No broad subsidiary aliases were added.

The isolated full refresh was stopped after several minutes without a result. It did not produce a validation receipt. Preliminary review exposed intermediary destinations among the held candidates: TikTok includes go.vansh.nyc, Tesla includes go.vansh.nyc, and RTX (Raytheon) and others include dreamworkhq.com. Some titles also warrant early-career review. These observations are not evidence of automatic admission or a final outcome, but must be reviewed against the direct-application policy before activating company-wide approvals.

Next: obtain a completed isolated refresh against current production, compare exact newly admitted jobs with the baseline, review employer link destinations and role eligibility, and only then publish if the results satisfy the policy. At that checkpoint, no company decisions had been published.

## October 27 follow-up trial

Instrumented isolated full refresh fetched 540 ATS boards and entered the four sequential Workday board checks, but did not finish within the available session and was stopped. A direct Workday list probe succeeded; this does not prove an outage or identify a specific hung request. Production's 09:20 UTC refresh took 142 seconds, including its Workday boards.

A separate scoped refresh with the four Workday board expansions disabled completed successfully. Compared by URL identity with the 09:20 UTC production snapshot, it returned 491 apparently new jobs across the proposed employer names. This is not a controlled same-input comparison: sources may have changed, and skipped boards and missing production credentials can affect results. It is not a verified net-new total attributable solely to these records.

The scoped output included go.vansh.nyc and dreamworkhq.com application URLs and titles such as Accounts Receivable Accountant II and Software Security Engineer. These require direct-destination and role/experience review before company-wide trust records can be enabled. No proposed records were applied to the active registry or published.

Next: instrument Workday search and detail progress to isolate the slow or stalled request, capture/replay one candidate set with and without the exact proposed records, and resolve the direct-destination and early-career policy checks before publishing.

## Title and destination pilot

The owner chose a title-based early-career approach. The local pilot uses explicit signals from the existing title classifier and scoped employer-specific destination paths; ambiguous titles and intermediary URLs remain held. This conservative pilot is not a blanket exclusion rule for the existing board. The code and scoped employer proposals are local only.

A scoped trial without the four separately configured Workday board expansions returned 110 apparently new URLs for Rocket Lab (51), Booz Allen and Booz Allen Hamilton (52), and RTX (Raytheon) (7), compared to the 09:20 UTC snapshot. It is not a controlled net-new measurement and excludes two proposed employers while their direct destinations remain unresolved.

Direct employer detail checks on October 27 returned 79 records with positive evidence (51 Greenhouse details, 28 Workday records reporting posted and canApply) and 31 Workday HTTP 403 responses. A 403 is inconclusive, not a closed job. The current scoped title/destination safeguard does not establish individual availability; the existing generic HTTP checks may leave a 403 or an unknown result eligible. Do not activate or publish these proposals until unknown destination statuses can be held reliably, and a complete production-equivalent comparison is validated.

Validation: 64 core tests, TypeScript check, and scoped ESLint passed locally. At that checkpoint, no active trust registry or production deployment had been changed.

## Availability safeguard implementation

Local code adds optional scoped trust conditions for explicit early-career titles, employer-specific application destinations, and current employer detail verification. Workday requires a job-specific detail with posted and canApply both true; Greenhouse requires a matching job ID and title. Errors, 403 responses, missing evidence, and requests beyond the limit stay pending. The pilot checks at most 150 destinations per refresh, with previously published matching jobs checked first and remaining capacity rotated across new candidates. Once a scoped destination is pending, another source cannot reintroduce that destination in the same refresh. A scoped employer posting that was previously published can disappear temporarily if its employer endpoint becomes inconclusive.

At that checkpoint, the code had not been deployed and the company proposals remained inactive. A capped run can defer candidates indefinitely if existing matching jobs consume all capacity, so measure this behavior before broader rollout. Local full-source testing remains unresolved because sequential Workday checks did not finish; the successful partial runs skip four Workday boards and are not production-equivalent.

## Availability-gated scoped trial

An isolated October 27 refresh using three scoped proposals and the local safeguard completed with four unrelated Workday board expansions disabled. Against the 09:20 UTC production snapshot, it included 78 apparently new URLs for those company names. This is not a controlled net-new estimate because source contents changed and the run was not production-equivalent. The scoped checker attempted 150 employer details and received 125 positive results; 58 source observations, representing 42 normalized destinations, were held for inconclusive availability. No held destination appeared in the trial's accepted jobs. Positive checks include both existing and new candidates, so the 125 is not a count of new listings.

All 94 automated tests, TypeScript and focused ESLint passed. This does not verify a complete production refresh. The cap and recheck behavior can suppress already published scoped-employer jobs when employer evidence becomes unavailable and can prevent new candidates from being checked if existing matches fill the cap. Those tradeoffs and the complete refresh were evaluated in the subsequent production-style trial.

## Production-style trial, October 27

The check queue now persists first-seen and last-attempt times. Up to 150 oldest-due destinations are checked per refresh. Positive employer-detail evidence expires after 24 hours; a failed check invalidates a previous positive and stays pending. This lets new candidates reach the queue without continuously consuming all capacity on already verified records. The Actions workflow stages the separate cache.

An isolated GitHub Actions run used the production inputs and credentials. The first full trial passed tests and held 62 distinct uncertain destinations without accepting them, but the three-employer configuration removed 16 existing Booz Allen URLs because of scoped title/path conditions. Those removals were reviewed and the Booz Allen and RTX proposals were not activated.

A second full trial restricted trust to Rocket Lab. Against its 22:20 UTC production baseline, 51 apparently new Rocket Lab URLs had direct Greenhouse destinations, early-career title signals and positive employer evidence; none matched an exact semantic identity already on the baseline. Three uncertain destinations were held, and no pilot-employer jobs present on that baseline disappeared. These are trial counts, not production counts, and source changes between refreshes can affect the comparison. The report was degraded only by WhatNot and Old Mission board 404s, also observed in the production baseline. Full trial: https://github.com/nothenrynguyen/app-expo/actions/runs/40597560911.

Booz Allen requires explicit handling of existing jobs and URL variants before any approval; RTX and the other proposals remain pending separate review. The wider employer backlog remains ongoing work.


## Release status

The scoped verification implementation and Rocket Lab record are included with this release. The first production refresh and deployed site data were verified as recorded below. Booz Allen, RTX and other employer proposals remain inactive.

## Production verification

On October 27 at 23:03 UTC, the first production refresh after commit `d501ab2627dce58eee5962b27552a6ae817b8152` completed successfully and produced snapshot commit `e8eeffe`. The live site served the same snapshot timestamp and 5,796 jobs as the repository. It contained 52 Rocket Lab listings, 51 with destinations absent from the 22:20 UTC baseline. All 52 had current cached positive employer evidence; three distinct inconclusive destinations were held and none appeared in accepted results. Scoped checks attempted 57 and verified 54. These counts are point-in-time observations, not permanent yield figures. [Production workflow run](https://github.com/nothenrynguyen/app-expo/actions/runs/40598938112).

The refresh report was degraded because the WhatNot and Old Mission boards returned 404, matching the pre-release production report. The pilot is complete for Rocket Lab. Broader backlog review and the Booz Allen and RTX issues remain separate work.
