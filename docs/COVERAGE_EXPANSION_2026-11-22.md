# Employer coverage expansion, November 22

## Current evidence

- All 39 workflow attempts checked since the HTTP parser recovery through November 22 at 08:19 Pacific succeeded. This includes maintenance and redundant-refresh skips, not 39 complete collections. Latest refresh: [45043003480](https://github.com/nothenrynguyen/app-expo/actions/runs/45043003480).
- Baseline snapshot `7450ef9`, generated at 08:19:29 Pacific: 5,839 current listings, comprising 3,420 internships and 2,419 early-career jobs; 632 internal holds. Intake: 24,804 candidate rows, 18,983 unique opportunities. Reliability has recovered, but the intake-doubling goal remains open.
- All four deployed public JSON files return HTTP 200 and byte-match Git's canonical snapshot bytes. Vercel commit status is successful. Exclude Windows checkout line-ending conversion from byte comparisons.

## Implementation and decisions

Exact reviewed employer-owned application routes for Formlabs, Roblox, Samsara, Akuna Capital, Datadog and Asana identify their fixed Greenhouse employer board. This mapping never grants availability or employer approval by itself. Pin the five added boards and the already discovered Formlabs board. Formlabs custom links previously failed to connect to its current direct board evidence. This also handles future roles on the reviewed routes, without repairing listings one by one.

Preserve exact current posting membership, matching employer name, experience conflicts, role/location/freshness screening, deduplication, source checks and coverage guards. Lookalike hosts, credentials, non-HTTPS URLs, custom ports, landing pages and unrelated paths provide no custom-board evidence. No request caps, parallelism, cooldowns, notification settings, paid services or account settings change.

## Bounded pilot, not published additions

Twelve employer boards were fetched through the repaired collector HTTP client. The final six-board pilot reapplied existing role, location, freshness, employer and ATS qualification checks, then compared opportunity and semantic identities against the baseline. All 69 resulting rows have distinct opportunity and semantic identities. Full collection and publication may produce a smaller realized gain.

| Employer | Potential missing opportunities |
| --- | ---: |
| Formlabs | 28 |
| Roblox | 14 |
| Samsara | 15 |
| Akuna Capital | 10 |
| Datadog | 1 |
| Asana | 1 |

Exact titles, locations and URLs are retained in [the pilot receipt](COVERAGE_PILOT_2026-11-22.json). Roles span software, hardware, manufacturing, design, finance, operations and business. This is not government-only expansion.

## Primary employer evidence and discovery

Employer-owned pages were checked against the current Greenhouse API's absolute application URLs. Samples returned HTTP 200 with matching role details. Samsara, Akuna Capital, Datadog and Asana also expose matching Greenhouse board tokens in their page or embed configuration.

- [Formlabs internships](https://careers.formlabs.com/internships/) and [exact application](https://careers.formlabs.com/job/8400855/apply/).
- [Roblox careers](https://careers.roblox.com/) and [exact posting](https://careers.roblox.com/jobs/8242621).
- [Samsara posting with board token](https://www.samsara.com/company/careers/roles/8214590?gh_board=samsara&gh_jid=8214590).
- [Akuna Capital posting and embed](https://akunacapital.com/careers/job/8016687/).
- [Datadog posting and embed](https://careers.datadoghq.com/detail/8186363/).
- [Asana posting and embed](https://www.asana.com/jobs/apply/8357334).

Suggestions came from [InternAtlas](https://github.com/sonak11/internatlas), whose board configuration is MIT-licensed, copyright 2026 InternAtlas contributors. Its [source notes](https://github.com/sonak11/internatlas/blob/main/SOURCES.md) describe mixed direct ATS and secondary upstream sources. No mixed feed or secondary repository rows were imported. Suggestions were independently checked and employers fetched directly through the existing integration. Existing source exclusions remain in force.

MongoDB and Jump Trading were deferred because their current API records collapse multiple jobs onto generic landing URLs. They are not counted in the 69. Stripe/Waymo showed similar collapsed identities; no new pin or custom trust route was added for them. Applied Intuition's suggested board returned 404. Empty and overlapping pilots did not inflate the gain.

## Validation and next checkpoint

All 274 tests, clean types, lint and static production export pass. New regression scenarios cover reviewed/adversarial routes, exact current membership, missing/failed board evidence, cross-employer separation and retained experience conflict screening. Existing HTTP transport tests also pass.

Implementation [d5952e2](https://github.com/nothenrynguyen/app-expo/commit/d5952e2) is published; GitHub's Vercel status confirms successful deployment. The 69 pilot opportunities comprise 24 internships and 45 early-career jobs. The first hosted refresh using this code remains pending; publication alone does not add pilot jobs to the public snapshot. Next normal slot: November 22 at about 09:17 Pacific. Reconcile pilot identities against current/held/rejected outcomes, distinguish additions from ordinary closures/removals and verify deployed files. Then expand high-yield private-sector boards and resolve exact-link gaps before changing broader filters. Workday throttling and the unique-intake doubling target remain open.
