# Coverage and reliability, November 25, 2026

## Action list

- Complete: inspect dirty worktrees and isolate work on `codex/coverage-reliability-2026-11-25` at `.cache/coverage-reliability-2026-11-25`. Root UI/analytics work is untouched.
- Complete: November 23/24 Pacific ingestion audit, four-file production comparison and November 22 cohort reconciliation.
- Complete locally: exact query-based posting identity recovery, five productive employer pins, 25-board private-sector survey and grouped blocked-ingestion reporting.
- In progress: scoped publication, repair deployment of the existing hourly scheduler, hosted collection and live reconciliation.
- Next: renew employer evidence within existing budgets, investigate remaining identity holds, and expand productive boards after recovery.

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

Local release checks: 276 tests and clean types pass. Full lint/export passed before the final Brex route addition; the final complete gate is running. Restricted fixture failures were local TCP/Git permission failures, and passed with permitted fixtures. No paid service, new automation, dependency, access-control bypass or destructive operation was introduced. Local observation files from the diagnostic collection are excluded from the release.

## Recommended next steps

1. Publish the scoped repair after final validation, update the existing scheduler deployment and observe its next normal invocation.
2. Inspect the hosted blocked artifact or new snapshot, reconcile the 69-role pilot and compare all four live files.
3. Let the existing bounded verification queue renew evidence; investigate remaining unexplained losses instead of weakening the guard.
4. Continue employer identity and independently verified private-sector board expansion, measuring unique and actually published additions separately.
