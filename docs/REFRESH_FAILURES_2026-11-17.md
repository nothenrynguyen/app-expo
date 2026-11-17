# Refresh failures: November 17, 2026

Read-only production investigation, with local documentation only. No pipeline change, rerun, push or deployment.

## Verified evidence

- GitHub history: 32 consecutive sync workflow failures from run 1011 (November 16, 1:17 p.m. Pacific) through run 1042 (November 17, 3:37 a.m. Pacific). Other workflows still succeed. Last successful sync: [run 1010](https://github.com/nothenrynguyen/app-expo/actions/runs/43948264778).
- Live `https://empluzzed.fyi/summary.json` matches repository summary: generated `2026-11-16T20:19:57.212Z` (November 16, 12:19 p.m. Pacific), 5,982 jobs. The site retains this snapshot while new publication is blocked.
- [Latest inspected run](https://github.com/nothenrynguyen/app-expo/actions/runs/44075716077): all 195 tests pass; sync fails at `assertCoverageSafe`; publication is skipped. The first failed run has the same guard failure.
- Latest proposed reconciliation: 5,982 + 38 additions - 845 removals = 5,175. Removed diagnoses: 494 source-unavailable (all Workday), 310 verification-pending (231 Workday), 21 unresolved and 20 scope-exclusion. None is diagnosed as confirmed-closed.
- Diagnostic artifact `14323759900`: all 20 discovery feeds succeed; 58 Workday sources are in cooldown following HTTP 429. Employer boards: 98/100 Lever fail, 1/230 Ashby fails, 1/356 Greenhouse fails, all 58 Workday records are cooldown. Sample Lever errors are HTTP 500/502, with a retry already attempted.
- Guard reports 214 unexplained internship removals and 285 unexplained full-time removals. These are guard reason counts, distinct from the richer diagnosis categories above.
- Scheduler permits two dispatches per hourly slot, explaining repeated failure emails. GitHub backup scheduling adds occasional runs. This is configured bounded retry behavior.

## Recovery weakness found in code

`scripts/sync-jobs.ts` persists Workday schedule and employer-recovery state before the coverage guard. Scoped verification results, listing health, source targets and accepted Workday continuity are written only after the guard. The failure workflow commits only the two retry-state files. Therefore blocked attempts discard newly collected scoped verification results, and later attempts can select the same due checks. Positive verification and Workday continuity have 24-hour limits. This creates a plausible recovery stall as old evidence expires; the precise fraction of losses caused by this mechanism is not yet measured.

## Recommended next work

1. Keep the coverage safeguard and provider cooldowns. Do not treat source outages as closures, increase request pressure, or raise the loss threshold to force publication.
2. Separate durable verification observations and queue progress from public snapshot admission. Preserve exact fresh checks, unknown results and terminal evidence on blocked runs, with tests proving no stale admission or closure override. Review continuity handling separately because its existing accepted-job constraint is intentional.
3. Measure verification throughput against expiry and prioritize previously published opportunities fairly. Inspect Workday retry behavior after existing cooldowns and investigate the broad Lever 500/502 failures with bounded checks.
4. Validate the proposed snapshot against current exact employer evidence. Require an unchanged-guard successful refresh, then verify generated files against production before declaring recovery.

## Authorized repair

The owner subsequently requested these fixes end to end, including publication and production verification. Work is isolated on `codex/refresh-recovery-2026-11-17` under `.cache/refresh-repair`; unrelated local analytics and documentation edits remain untouched.

- Persist scoped checks, source guards, generic listing checks, accepted Workday continuity and existing retry state before the coverage gate. Failure publication explicitly commits only these six state files. Public snapshots, aliases and accepted reports remain behind the unchanged safeguard.
- Renew positive scoped evidence after 12 hours while keeping the 24-hour admission expiry. Reserve 80% of each source/employer queue share for previously published listings, retaining discovery capacity within the existing 150-check cap. Share requests for identical URLs between the two checks.
- Apply Workday host cooldowns to generic, scoped and employer-recovery checks. Serialize additional checks per host and stop queued requests after 401/403/429. Honor Retry-After without clearing existing pauses.
- Include scoped queue and verification diagnostics in blocked artifacts, so future recovery progress can be measured.
- A bounded local Lever probe returned HTTP 200 for Zoox with both the existing 1,000-row limit (238 rows returned) and a 100-row limit. This does not establish GitHub-runner recovery, but does not support changing the request format. The public [Lever Postings API documentation](https://github.com/lever/postings-api) describes these listing parameters.

The repair is published and its blocked-run recovery behavior is production-verified below. Job snapshot recovery remains blocked by upstream Workday availability. No threshold or evidence lifetime has been relaxed.

## Local validation

All 198 tests, lint, TypeScript and static export pass using the isolated checkout's locked dependencies. Regression coverage includes blocked-state restart, unchanged public files, persisted invalidations and expiry, published-listing queue shares, queued host denials, Retry-After and a real temporary Git commit excluding a staged rejected snapshot. Initial restricted-environment file rename failure passed outside that environment; a dependency junction could not satisfy the build boundary, so dependencies were installed independently in the isolated checkout.

Separate dependency finding: the locked Next.js version has a moderate cache-related advisory, [GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h). Production dependency audit reports one moderate advisory and no high/critical advisories. No `unstable_cache` or `use cache` usage was found in `app` or `lib`. This is not the refresh failure and no dependency versions were changed in this repair.

## Publication and first production check

- Repair commit [`17a258f`](https://github.com/nothenrynguyen/app-expo/commit/17a258f1ce42bfe032c89409dd0ef7174de17888) was rebased over the latest automated state commit, scoped-reviewed and pushed to main. GitHub's Vercel status reports a successful deployment.
- Fresh scheduler [run 44084908207](https://github.com/nothenrynguyen/app-expo/actions/runs/44084908207), attempt 1, checked out the repair and passed all 198 tests. Collection completed in about 95 seconds, then the unchanged coverage safeguard blocked 5,982 + 43 - 779 = 5,246 proposed jobs.
- Lever recovered: all 100 boards succeed in this run. All 58 Workday board sources remain in cooldown; their recovery requests were not forced. There are still 494 source-unavailable Workday omissions. Other proposed removal diagnoses are 241 verification-pending, 23 unresolved and 21 scope-exclusion.
- The repaired failure step successfully published [`00578b6`](https://github.com/nothenrynguyen/app-expo/commit/00578b6ddc0ff72764e3f49b77178a9468f2172e). Its five changed files are all in the observation allowlist; all four public job files are byte-for-byte unchanged. The sixth allowed file, employer-recovery state, had no change.
- Committed scoped cache comparison: 1,807 changed records, of which 1,798 have the run's timestamp: 1,575 live observations and 223 unknown observations. These totals include reused current board membership, not 1,798 extra detail requests. The bounded detail queue selected 150 source checks, 71 for previously published listings, and verified 57. There were no due employer-only checks in this run. 1,007 scoped entries were paused by host cooldowns.
- Live summary after the run still reports `2026-11-16T20:19:57.212Z`, 5,982 jobs. This verifies preservation, not fresh publication. Earliest seeded Workday retry eligibility is November 17 at 5:40 a.m. Pacific; the latest is 4:19 p.m. Pacific. Expiry permits another bounded attempt and does not guarantee source recovery.

## Second production check and remaining blocker

The same run's controlled attempt 2 passed all 198 tests and completed collection in about 77 seconds. It proposed 5,982 + 46 - 778 = 5,250 jobs, again blocked by the unchanged guard. It successfully published observation-only commit [`8e2e0f7`](https://github.com/nothenrynguyen/app-expo/commit/8e2e0f73ff05928a1c76ef874bee2b958139c5af), changing only listing health, scoped listing health and Workday schedules. Public snapshot files still match the pre-repair version.

The second bounded queue selected only 57 due, unpaused source checks and verified three. Committed records show 56 newly timestamped non-board source observations; none had been timestamped in attempt 1. This verifies queue advancement rather than repeating discarded work. There were no due, unpaused published checks remaining in that queue, and the total paused scoped entries rose from 1,007 to 1,042 as more hosts denied access. All 100 Lever boards still succeeded and all 58 Workday source boards remained in cooldown.

The implementation, release and blocked-run recovery checks are complete. Fresh snapshot recovery is **not** complete: the 494 source-unavailable Workday omissions still block publication. The normal scheduler remains active, and failure emails may continue while that condition persists. Retry eligibility starts at the saved deadlines; it does not prove that Workday will accept the next request. Do not clear cooldowns, extend stale evidence or force a lossy snapshot to turn the workflow green.

Browser-based manual dispatch was attempted after the owner asked to retry browser control, but the UI tool reported an Escape-key stop; no further browser input was used. The fresh run came from the normal scheduler, and the controlled retry used GitHub's authorized workflow rerun tool.

## Afternoon follow-up, November 17

The owner requested another check and fixes. At 3:36 p.m. Pacific, the latest [run 44198076914](https://github.com/nothenrynguyen/app-expo/actions/runs/44198076914) still passed all 198 tests and failed the coverage guard: 5,982 + 128 - 864 = 5,246 proposed jobs. Removed diagnoses were 478 source-unavailable, 275 verification-pending, 85 unresolved, 24 scope-exclusion and two confirmed-closed. All 58 Workday source boards were again in cooldown; all 101 Lever boards succeeded. The scoped queue had no due unpaused checks, and persisted progress continued across runs.

Waiting for expiry did not restore access. An earlier [post-expiry run 44112640506](https://github.com/nothenrynguyen/app-expo/actions/runs/44112640506) records seven actual Workday retries returning HTTP 429, one request each, with 51 other sources correctly skipped. A bounded local probe checked only an expired-cooldown host, Zurn Elkay, and also received 429 on its first request. This establishes repeated denials outside the GitHub runner as well; it does not establish Workday's rate-limit scope or reset time. There is no credit, storage or billing error in the inspected failures.

A separate repairable failure was found in OpenAI's Ashby board: one public posting has an empty title but a valid application URL. The parser rejected the entire board. The repair isolates that posting as unverified, retains valid jobs, reports partial health, excludes the incomplete posting from positive availability evidence, and prevents it being labeled closed solely due to the missing title. Invalid response structure and missing URLs still fail closed. A live check collects 838 valid postings and three early-career candidates while holding one incomplete posting. A regression test covers the incomplete posting's availability and closure semantics. No coverage threshold, employer policy, cooldown or evidence expiry changed.

The broader Workday restriction cannot be repaired by increasing retries, buying project credits, or changing the parser. Fresh overall publication still requires sufficient current employer evidence. A different public policy for unavailable historical jobs would be a separate product decision, not part of this repair.

Release validation also encountered the existing Next.js security advisory as a build failure after static export. The scoped follow-up upgrades Next.js and its matching lint configuration from 16.4.3 to the patched 16.4.6 release, preserving the existing framework version line. All 199 tests, lint, TypeScript and static export pass on 16.4.6. Production dependency audit reports zero advisories. A fresh audit of the unchanged previous lockfile reports 16 total advisories (seven moderate, nine high); the patched lockfile reports 15 (six moderate, nine high), all remaining findings in development tools. Thus the patch removes the production advisory without introducing those development findings. No broad automatic audit fix, framework downgrade or service change is used. Development-tool advisory remediation remains separate from this refresh repair.

### Follow-up release verification

Repair [`216ddda`](https://github.com/nothenrynguyen/app-expo/commit/216ddda33f7c4351dae86c0078d0b71d266dd78c) is published; Vercel reports deployment success. The latest attempt of run 44198076914 checked out the current main, passed all 199 tests, and confirmed OpenAI/Ashby now returns 836 valid posting identities with partial health for one incomplete title. Its previous whole-board parser failure is resolved. All 101 Lever boards succeeded; 58 Workday source boards remained in cooldown. Iterable's separate Greenhouse 404 remains a visible unavailable board, not a parser failure.

At 3:50 p.m. Pacific, this attempt proposed 5,982 + 147 - 934 = 5,195 jobs and was blocked by the unchanged coverage guard. Diagnoses were 484 source-unavailable, 290 verification-pending, 134 unresolved, 26 scope-exclusion and zero confirmed-closed. It successfully committed observation-only state as [`d016c0f`](https://github.com/nothenrynguyen/app-expo/commit/d016c0f3941a97dc3064afd34141413d5b579c3b). All four live job files matched the protected repository snapshot by SHA-256 comparison. The live generation time remains November 16, 12:19 p.m. Pacific, with 5,982 jobs.

The repairable parser and production dependency issues are resolved. Overall fresh publication is still externally blocked. No provider reset deadline was supplied by the bounded local 429 response, so another guaranteed recovery time cannot be given. Normal bounded retries remain active. Publishing healthy-source changes while preserving unavailable historical jobs would require a separately reviewed outage policy with explicit per-listing verification status; the current fresh-evidence requirement and coverage safeguard are unchanged.
