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

Production verification is pending. Provider availability can still block publication; no threshold or evidence lifetime has been relaxed.

## Local validation

All 198 tests, lint, TypeScript and static export pass using the isolated checkout's locked dependencies. Regression coverage includes blocked-state restart, unchanged public files, persisted invalidations and expiry, published-listing queue shares, queued host denials, Retry-After and a real temporary Git commit excluding a staged rejected snapshot. Initial restricted-environment file rename failure passed outside that environment; a dependency junction could not satisfy the build boundary, so dependencies were installed independently in the isolated checkout.

Separate dependency finding: the locked Next.js version has a moderate cache-related advisory, [GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h). Production dependency audit reports one moderate advisory and no high/critical advisories. No `unstable_cache` or `use cache` usage was found in `app` or `lib`. This is not the refresh failure and no dependency versions were changed in this repair.
