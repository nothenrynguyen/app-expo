# Coverage and reliability, November 25, 2026

## Action list

- Complete: inspect dirty worktrees and isolate work on `codex/coverage-reliability-2026-11-25` at `.cache/coverage-reliability-2026-11-25`. Root UI/analytics work is untouched.
- Complete: November 23/24 Pacific ingestion audit, four-file production comparison and November 22 cohort reconciliation.
- Published and locally validated: exact query-based posting identity recovery, five productive employer pins, 25-board private-sector survey and grouped blocked-ingestion reporting.
- Complete: scoped code publication, repair deployment of the existing hourly scheduler, successful normal hourly dispatch and protected live-file reconciliation.
- In progress: hosted collection/publication recovery. Next: renew employer evidence within existing budgets, investigate remaining identity holds, and expand productive boards after recovery.

## Audit evidence

Production still serves snapshot `bc475cfd`, generated November 23 at 05:00:16 Pacific: 5,942 current jobs, including 3,476 internships and 2,466 early-career jobs, plus 636 internal holds. All four public JSON files returned HTTP 200 and matched canonical Git bytes on November 25 at 03:59 Pacific. All 69 November 22 pilot opportunities remain present. Last successful intake: 24,937 candidate rows, 19,099 unique opportunities. Backlog: 6,370 employer identity, 406 availability, 56 early-career evidence, 55 application destination and 12 career-page evidence. These are investigation categories, not promised additions.

Four later refreshes failed: 45301303744 (November 23, 16:57), 45380007395 (November 24, 02:59), 45489493602 (November 24, 13:16), and 45546139122 (November 24, 20:20). Latest hosted collection passed types and all 274 tests, then rejected 284 unexplained removals. This is a coverage safety rejection, not recurrence of the HTTP parser assertion. Public files remained protected.

One bounded local collection reproduced the guard rejection: 5,657 proposed current jobs, 654 holds, 286 unexplained removals. TikTok accounts for 150 removals and ByteDance for 66. Many missing official URLs have expired career-page observations stored under their original licensed-source redirects. Sparse refresh cadence prevents the existing 25-check lane from renewing its cohort promptly. Do not increase caps, extend positive evidence lifetimes or relabel missing rows as closed. Other source omissions remain unresolved.

The repository was renamed to `nothenrynguyen/empluzzed`. The existing deployed scheduler version `cfc9a2a0-ca58-4d41-8b03-96fe9abf1752` predates the rename; its checked-in source still used `app-expo`. The old GitHub API workflow address returns 301; the canonical address returns 200. Scheduler requests correctly reject redirects, so update its fixed repository target while retaining credential protections, schedule and retry limits. Runtime activation and sustained recovery require separate hosted evidence.

## Exact links and bounded expansion

The generic canonicalizer removed `gh_jid`, but MongoDB, Jump Trading, Stripe and Waymo use it as their exact posting identifier. Preserve a single numeric ID only on four reviewed HTTPS employer routes. Generic landing pages, malformed/repeated IDs, lookalike hosts and credentials grant no reviewed board identity. Exact current membership and normal role, qualification, location, freshness, permission, employer and availability gates still apply.

The employers' current Greenhouse responses supply these routes. MongoDB, Stripe and Waymo sample links returned HTTP 200 with matching titles; MongoDB and Stripe redirect to explicit posting routes. Jump Trading returned a client-rendered shell, so that page alone is not positive availability evidence. Its posting must still match the current direct ATS response.

A separate 25-board survey fetched direct ATS APIs using suggestions from the previously reviewed MIT-licensed InternAtlas configuration. No mixed feed was imported. Brex's official careers page includes the same exact posting IDs and titles as its direct board, supporting its narrow custom route. Pin only MongoDB, Jump Trading, Stripe, Waymo and Brex. Six other surveyed board tokens returned 404; other potential custom-route additions remain deferred rather than broadly trusted. Existing exclusions remain intact.

The final local pilot has 69 distinct opportunity and semantic identities: MongoDB 8, Jump Trading 15, Stripe 19, Waymo 19 and Brex 8. Of these, 50 are internships and 19 early-career roles. See `COVERAGE_PILOT_2026-11-25.json`. These are potential additions, not published gains. They include software, data, finance, business operations and product roles. Doubling remains unachieved.

## Reporting and validation

Actions summaries now group the largest investigation cohorts by employer, recorded reason and exact board membership. Counts use unique opportunities, with table-cell sanitization. Blocked artifacts now also retain unique intake and verification backlog, previously available only after successful publication. Failure behavior, public snapshots and notification settings remain unchanged.

Local release checks: all 276 tests, clean types, full lint and static export pass, including the final Brex route addition and compatibility correction. Restricted fixture failures were local TCP/Git permission failures, and passed with permitted fixtures. No paid service, new automation, dependency, access-control bypass or destructive operation was introduced. Local observation files from the diagnostic collection are excluded from the release.

## Recommended next steps

1. Publish the scoped repair after final validation, update the existing scheduler deployment and observe its next normal invocation.
2. Inspect the hosted blocked artifact or new snapshot, reconcile the 69-role pilot and compare all four live files.
3. Let the existing bounded verification queue renew evidence; investigate remaining unexplained losses instead of weakening the guard.
4. Continue employer identity and independently verified private-sector board expansion, measuring unique and actually published additions separately.

## Publication checkpoint, November 25 at 04:12 Pacific

Implementation `9efebe17` is published and Vercel reports successful deployment. All 276 tests, types, lint and static export pass. The existing scheduler is deployed at 100% version `6a5d23d4-587c-4f9c-ac3f-079ba288d3fe`, enabled on the unchanged `17,37,57 * * * *` schedule. Its next natural invocation is still unobserved. A single rerun of 45546139122 is collecting on current main; no new automation was created.

Compatibility review tightened query preservation to the four query-identified routes only. Existing path-identified Samsara, Asana, Datadog and Brex URLs continue ignoring redundant `gh_jid`, preserving their prior identities. A regression check covers this explicitly; all 276 tests, types, lint and export pass again. No rejected snapshot or local observation state is published.

## Additional measured checks

The software-engineering tag covers 1,595 published opportunities in both the November 22 baseline and November 23 live snapshot. There was no successful November 24 publication, so there is no newer published software count to attribute to that day. Tags can overlap and must not be summed into a total.

A high-yield Rivian-labeled backlog sample points to the distinct Rivian and Volkswagen Group Technologies joint venture. Its official `https://rivianvw.tech/` page returned 200 and links directly to `https://jobs.ashbyhq.com/rivianvw.tech`. The current direct board contained 177 postings but yielded zero eligible unique missing opportunities after existing role/location/freshness/qualification and identity comparisons. No parent-company alias, trust relaxation or extra pin was added. The 56 historical Rivian backlog rows are not claimed as 56 recoverable jobs.

## Hosted verification checkpoint, November 25 at 04:18 Pacific

Both implementation commits, `9efebe17` and compatibility follow-up `7acb2f76`, have successful Vercel deployment statuses. Production dependency audit reports zero advisories. A post-release four-file byte comparison at 04:16 Pacific confirms the protected November 23 snapshot remains live; all original November 22 pilot roles remain present. No new pilot additions have been published yet.

The owner-authorized single retry of run 45546139122 (attempt 2, job 139194454274) loaded the release, passed all 276 tests and clean types, and completed collection through the repaired Undici client. The unchanged guard blocked 288 unexplained removals: 168 internships and 120 early-career jobs. Proposed current count was 5,729, with 650 internal holds and 290 proposed additions across the whole refresh. These are rejected proposal counts, not production results or causal growth from this release. New grouped diagnostics identify TikTok (142) and ByteDance (62) as the largest unresolved groups. Observation progress is persisted by hosted commit `687631ad`; public data remains unchanged.

The next normal Cloudflare invocation was observed at approximately 04:17:34 Pacific on version `6a5d23d4-587c-4f9c-ac3f-079ba288d3fe`: outcome `ok`, no exceptions, 3 ms CPU. It dispatched run 45612358363 for slot `2026-11-25T12:17:00.000Z`, created at 04:17:37 Pacific. This verifies the actual hourly dispatch path after the repository rename. The temporary event listener was stopped after observing the outcome. Collection/publication recovery is still separate and unverified; the normal run is in progress.

## Persisted-state repair after the normal invocation

Run 45612358363 passed all 276 tests but failed before the coverage guard with `Invalid persisted source verification target`. The first repair's overly broad query preservation had written two keys for Brex and Samsara that no longer matched the corrected path-based normalization. This was introduced during this release, not an external outage. The owner reported failure emails and requested continued work; notifications remain enabled.

Re-key exactly those two reviewed records to their existing canonical path identities, union their guarded-source IDs with any existing target, and preserve every source restriction. One Samsara record merges into its already-existing canonical target, so total targets change from 2,014 to 2,013 without losing provenance. No positive verification observations are copied, renewed or invented. Every resulting key matches the current validator; the validator remains unchanged and rejects unrelated corrupt state. Add a test loading the actual checked-in production target file before collection, preventing this class of compatibility regression from passing CI. Full-suite validation and a hosted retry follow.
