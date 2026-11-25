# Missing native employer retry targets, November 25 iteration E

## Action list

1. Complete locally: identify 18 previously published native postings absent from inputs and absent from the existing recovery target set.
2. Complete locally: append exact employer URLs to the existing queue, preserving host pauses, source holds, employer and qualification gates, request ceilings and evidence expiry.
3. Pending: scoped publication and hosted checks. These targets are not positive availability evidence and are not new opportunities.
4. Open: internship coverage guard recovery, accepted snapshot publication, and reconciliation of all growth cohorts.

## Evidence and boundaries

The initial November 25 blocked report contained unseeded original employer links for finance, accounting, underwriting, analytics and related internships. Eighteen exact Workday/SmartRecruiters URLs still lack a recovery seed, across Baird, State Street, Cushman & Wakefield, Curtiss-Wright, Bread Financial, Tyson, Elevance Health, Colliers, EisnerAmper, Genuine Parts, Bloomberg Industry Group, Continental, CrowdStrike, Clarios and Cigna. Retain source-provided employer labels here; admission and display policies remain separate.

The local persisted Workday gate currently pauses ten targets; eight are eligible for a request when selected. No direct probing, pause reset, proxy or override was performed. The pipeline will select targets within its existing 500-request ceiling and 120-second budget. Positive results must pass exact native requisition/posting checks and all normal admission rules; unknown or unavailable pages do not establish closure. No prior job or positive timestamp is copied into published results. Exact URLs and current pause states are in `COVERAGE_RECOVERY_TARGETS_2026-11-25_E.json`. This is a data-only queue addition, not an adapter or new scheduled job.

Validation: all targets are unique by the existing full opportunity identity and accepted by the existing recovery endpoint parser. Ten remain gated by current cooldowns. No code or public snapshot changes in this iteration, so no repeated production build is required.

## Hosted iteration D result

Run 45615562613 attempt 3, job 139218306299, passes clean types and all 282 tests, completes collection and reaches the unchanged coverage guard. Hosted persisted state `37028f83` contains fresh positive native checks for all 20 Bosch/Western Digital targets, checked November 25 at 04:55:07 Pacific. They are verified in the recovery lane; they are not published additions because the overall snapshot was rejected.

Early-career coverage now passes its guard (40 unexplained removals). Internship coverage remains blocked (136 unexplained). Proposed current count was 5,905, plus 649 holds, with 325 additions across the whole rejected proposal. Largest unresolved TikTok/ByteDance groups fell to 84/8, from 97/19. These counts describe proposals and investigations, not accepted production growth or confirmed closures. Iteration D's Vercel deployment is successful. The live snapshot remains the November 23 baseline.

## Recommended next list

1. Publish this exact retry-target batch, then let the existing gated queue evaluate it.
2. Continue tracking the remaining internship omissions without reducing the coverage guard or evidence requirements.
3. Reconcile all 118 local growth-pilot identities against the first accepted snapshot, including exact current/held/missing outcomes, then byte-compare all four production files.
4. Prioritize subsequent work using actual verified and published gains, keeping unproductive sources and unresolved data out of the growth count.
