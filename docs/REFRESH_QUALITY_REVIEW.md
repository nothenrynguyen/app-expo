# Refresh reliability and duplicate review

October 19, 2026. Follow-up to the approved source expansion.

## Count investigation

Comparing release 7ab69a1 (6,106 jobs, generated 08:34 UTC) with automatic snapshot 17bda91 (5,491 jobs, generated 20:02 UTC): 671 application destinations disappeared and 56 appeared, a net decrease of 615.

- 611 missing destinations belong to employer boards that timed out: SpaceX, Olsson, Anduril and others. All eight timed-out endpoints returned HTTP 200 on targeted follow-up.
- 11 were quarantined for missing employer evidence, one failed role classification, one had a confirmed closed listing, and one had an ended internship term.
- 46 were absent from accepted inputs without a definitive reason in the stored diagnostics. These can include upstream removals, changed employer descriptions and destination aliases. They have not been reinstated blindly.

All 24 source feeds succeeded. The actual recovery gap was that only feed failures, not employer-board failures, enabled last-known-good preservation.

## Implemented safeguards

Transient employer-board failures now receive one retry after the main pass at reduced concurrency. HTTP 404/410 and rate limits are not retried. Diagnostics include retry counts.

If a board still fails transiently, only its eligible prior listings can be recovered when feeds are healthy. Existing location, employer, role and freshness rules still apply. Confirmed closed listings and jobs absent from a healthy authoritative board stay excluded. USAJOBS always requires fresh verification. HTTP 404/410 boards do not trigger board-only recovery.

## Board addresses

- Luma: official https://lumalabs.ai/careers links to Ashby lumaai, not luma-ai. Replacement API returned HTTP 200.
- Commure: official https://www.commure.com/careers includes the current Commure embed alongside legacy Commure-Athelas markup. Current Commure API returned HTTP 200; legacy API returned 404.
- Atomic Semi's official https://atomicsemi.com links to fab2, which is already a pinned board. No speculative alias or employer rename was applied.
- Whatnot's official jobs URL redirects to its careers site, which returned 403 to this checker. Maximor's site redirects to Hyphenate. Interaction's careers page redirects to /jobs without a supported ATS link. Those legacy endpoints remain visible as unresolved diagnostics.

## Duplicate review

The automatic snapshot contains 209 groups with identical normalized company/title/location/collection. A matching title is insufficient evidence for deletion: for example, Accenture Federal Services and Leidos have distinct requisition IDs within matching groups.

Two pairs were checked against official Workday JSON endpoints:

- Autodesk uni and Ext URLs both report jobReqId 26WD101472.
- Marvell MarvellCareers2 and MarvellCareers URLs both report jobReqId 2603846.

Deduplication now merges recognizable identical Workday requisition tokens across career-site URL variants only when the existing semantic fields also match and the tenant is identical. It preserves the retained ID and merges source attribution. It does not change global job identity or local storage keys. Applied to snapshot 17bda91, this rule removes 36 redundant entries. Remaining groups require evidence before further merging.

## Reproduce

Run `node --import tsx scripts/audit-refresh-changes.ts 7ab69a1 17bda91`. Detailed public-listing evidence is written under ignored .cache/refresh-audit. Without the second revision, the script compares against the local working snapshot.

## Validation

73 tests, lint and TypeScript pass. The complete local refresh finished at 2026-10-20T00:42:32.213Z (October 19 local time) with 6,104 jobs, including 11 federal listings. All 24 source feeds succeeded. Employer-board failures fell from 14 in the first production run to four legacy 404s. One transient failure was retried successfully. Luma returned 35 rows and Commure 80. No last-known-good recovery was needed in this run because all transient boards succeeded; recovery behavior is covered by regression tests.

The refreshed snapshot has zero duplicate job IDs/application identities, zero location-policy violations and zero freshness failures. There are 182 remaining semantic review groups. Inventory changes and duplicate normalization mean this is not a controlled claim of a specific net source yield. This validation preceded the approved publication recorded below.


## Publication and further review

Owner approved publication of the tested follow-up. Release d4577c9 was pushed and Vercel reports a successful deployment. Production refresh run 39358051059 passed and its snapshot 34a8357 deployed successfully. Live generatedAt advanced to 2026-10-20T02:20:05.093Z, with 6,106 jobs and 11 federal listings. Two transient boards recovered on retry. Four legacy 404s remain.

A reproducible read-only review (`node --import tsx scripts/review-requisition-groups.ts`) classifies the 182 groups from the tested snapshot:

- 94 groups have distinct recognized requisition tokens within one employer/platform namespace. Keep these listings; matching titles do not establish duplication.
- Three groups share a recognized token across iCIMS portals: iPipeline requisitions 1730 and 1718, and H&R Block 76907. iPipeline returned privacy notices, so its job content could not be verified. Both H&R Block destinations returned HTTP 410 on direct checks.
- 85 groups lack enough recognized requisition evidence for a safe automated decision. They remain visible and are not labeled confirmed duplicates.

Further official-page checks establish migration leads, not automatic employer approvals:

- Interaction's /jobs page links to https://cognition.com/careers, which links to the cognition Ashby board.
- Maximor's official domain redirects to https://hyphenate.ai/. Its /jobs page embeds https://jobs.ashbyhq.com/hyphenate.
- Atomic Semi's official site links to fab2, already pinned.
- Whatnot's public careers destination returned HTTP 403 to the checker.

No broad alias between different employer names or unsupported replacement integration was activated. The old 404 diagnostics remain visible. New employer identity/coverage evidence must precede activating migration leads.

Both H&R Block 410 responses were recorded in listing-health at commit 01675b4. Final refresh 39358416742 passed and published snapshot 82034d1. Vercel deployed it successfully. Live generatedAt advanced to 2026-10-20T02:23:32.235Z, with 6,103 jobs and 11 federal listings. Both confirmed-closed destinations are absent from live jobs.json. Four legacy 404s remain. Cognition and Hyphenate public board APIs were separately checked and returned HTTP 200 (104 and 13 rows respectively); this establishes endpoint availability, not employer approval or eligible yield.
