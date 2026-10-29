# Employer coverage retention and count investigation

October 28, 2026 (Pacific). The owner authorized investigation, implementation, publication, and production verification of the full-time count decline. Unrelated staged source exclusions, Next.js environment changes, and the Jobbie review are outside this release.

## Findings

- Saved UTC snapshots contained 2,878 full-time listings on October 18, 2,631 on October 21, and 2,345 on October 22. The newer baseline, generated October 29 at 05:20 UTC (October 28 Pacific), contained 2,362 full-time jobs. Earlier chat counts were older snapshots.
- One October 22 refresh removed 294 full-time destinations: 281 were not returned by source inputs, seven were deduplicated, three were absent from employer boards, two were closed, and one needed verification. Source omission is not closure evidence.
- Of the 233 direct-only Greenhouse listings missing between the October 21 and 22 snapshots, 212 belonged to Alo Yoga. Examples included seasonal store operations and sales associates. The previous count was not a target to restore wholesale.
- A [bounded audit](coverage-retention-audit-result.json) of the most recent daily full-time snapshots from October 18 through 29 found 1,248 historical destinations missing from the current snapshot. This is cumulative churn across snapshots, not the net decline of 516. Public employer APIs supported checking 695 destinations across 104 boards: 514 remained listed, 180 were absent, and one was inconclusive. Another 553 used unsupported destinations and were not assigned a closure status. Of the 514 still listed, 382 belonged to Alo Yoga and 59 to CSC Generation, with many store-floor roles. Being listed does not establish eligibility.
- The collector rebuilt its board list from current source links and pinned boards. Successful upstream omissions could silently remove an employer board. Recovery also ran too broadly: an unrelated failed board could preserve jobs omitted by healthy sources.

## Changes

- Persist previously discovered Greenhouse, Lever, and Ashby boards in `data/board-history.json`. Seed history from previously published destinations and positively checked historical public boards. Every retained board is fetched again through the existing public API and the ordinary role, location, employer, review-hold, availability, and deduplication filters. History grants no employer trust and restores no old job records directly.
- Retain discovery for 90 days after its latest appearance in an active expanding source or pinned list, or its latest successful nonempty official board response. Healthy active boards therefore remain tracked even without upstream links; empty or failing undiscovered boards age out. Retirement on HTTP 404/410 does not imply individual jobs were filled. Preserve Lever region and reviewed Ashby aliases. Corrupt history fails visibly.
- Bound retained boards to 250 and total Greenhouse/Lever/Ashby boards to 1,000 per refresh. Exceeding either limit stops the refresh for review rather than silently truncating coverage. The fixed-input comparison fetched 41 additional boards, from 555 discovered boards plus 41 retained boards. Workday is separate and unchanged.
- Reject malformed employer API responses as failures, rather than treating a missing jobs array or malformed row as an authoritative empty board. Valid empty boards still establish absence. Previously published jobs that remain listed but no longer pass the employer adapter's early-career rule receive a role explanation.
- Limit fallback recovery to a job's own failed board or failed source. Healthy authoritative boards and permanently missing boards prevent fallback restoration.
- Reject seasonal store operations associates and context-confirmed retail sales/operations associates while preserving professional sales, operations analytics, and retail software roles. Fix `New South Wales` matching the UK through the word `Wales`.
- Record per-collection counts and unexplained removals in the refresh report. Warn on a net decrease of at least 50 jobs and 5%. Block publication when unexplained removals reach the larger of 25 jobs or 2% of the prior collection, even if unrelated additions mask the loss. Confirmed closures, recorded screening decisions, and actual deduplication remain explained outcomes.
- Evaluate the guard before writing refresh state or public snapshots. Failed coverage diagnostics are retained locally and uploaded by GitHub Actions for seven days. Failed workflows surface through the existing Actions interface; no new notification service or paid infrastructure was added.

## Controlled validation

The [comparison receipt](coverage-retention-controlled-result.json) runs the original and fixed collectors in isolated copies with identical initial state, a fixed clock, and one shared immutable HTTP response capture. Both replays had zero missing responses. Frozen responses include actual provider failures, so the result does not imply every employer API was healthy.

| Collection | Original collector | Fixed collector | Difference |
| --- | ---: | ---: | ---: |
| Full-time | 2,362 | 2,372 | +10 |
| Internships | 3,514 | 3,513 | -1 |
| Total | 5,876 | 5,885 | +9 |

All ten added destinations had fresh official board membership. They belong to Axon and DLR Group and pass existing eligibility rules. The one internship removal was an unexplained Micron omission that the old global fallback preserved during an unrelated failure. It is not classified as a confirmed closure. The Australian Axon listing caught during review is excluded from the final comparison.

The final comparison found zero invalid supported locations, expired listings, shared-hold leaks, duplicate application destinations, unverified added destinations, or restored Alo Yoga/CSC retail associates. These checks do not establish that every current role meets a newly defined experience threshold; that broader roadmap item remains separate.

Validation: 127 tests, lint, TypeScript, and production static export passed. Tests cover source omission through the actual loader, valid closures, malformed responses, corrupt history, expiry, request limits, European Lever retention, unrelated-failure recovery, retail exclusions, location collisions, and drop detection despite replacement additions. Local captures and full response bodies stay in ignored `.cache` storage.

A [fault simulation](coverage-retention-fault-result.json) removed 100 accepted full-time destinations from the isolated collector's inputs and acceptance map. The real publication guard exited with failure, wrote its diagnostic, and changed zero files in the isolated public snapshot or persistent data state. The replay used no missing responses.

## Publication

Published implementation `cc77288`. Production workflow [40825645377](https://github.com/nothenrynguyen/app-expo/actions/runs/40825645377) passed its tests, refresh, and snapshot publication. Generated snapshot `f7801da` completed at October 28, 10:53 PM Pacific (October 29, 05:53 UTC). GitHub's Vercel deployment status reported success for both code and snapshot commits. The connected Vercel API denied status access and the local CLI was unavailable, so deployment confirmation used GitHub's Vercel status plus direct public JSON verification.

The [production receipt](coverage-retention-production-result.json) confirms byte-for-byte matches for deployed `jobs.json`, `fulltime.json`, `internships.json`, and `summary.json`. Production contains 5,886 jobs: 2,372 full-time and 3,514 internships. This refresh added ten full-time destinations and removed none. All ten restored destinations were independently rechecked against current official boards; all passed. No shared-hold leaks, invalid supported locations, expired listings, duplicate destinations, collection mismatches, or unexplained removals were found.

All 27 feeds succeeded. The refresh checked 600 boards including Workday, with 598 successful and two previously known HTTP 404 boards (WhatNot and Old Mission). Those failures remain explicitly reported as degraded health. The refresh took about 166 seconds and persisted the board history, including retirement of permanently missing retained records. No additional services, paid resources, or visitor data storage were introduced.

This resolves the confirmed coverage continuity issue. It does not promise a fixed listing count or establish a stricter experience threshold for every published role. The separately documented experience-rule review remains a future candidate, and uncertain historical destinations were not bulk restored.
