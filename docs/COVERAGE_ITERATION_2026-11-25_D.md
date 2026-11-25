# Exact employer recovery iteration D, November 25, 2026

## Action list

- Complete locally: anonymous public-API discovery and exact posting checks for Bosch and Western Digital; Sika yielded zero U.S. query results and is not enabled.
- Complete locally: 20 unique qualifying recovery targets for the existing capped lane, not a new provider architecture or background task.
- Complete locally: stronger public-posting identity, visibility, content and required-experience validation.
- In progress: full release validation, scoped publication and hosted recovery measurement.
- Open: guard-passing snapshot, all-cohort reconciliation and broader useful coverage growth.

## Evidence and bounded discovery

The SmartRecruiters public Posting API documents active employer postings and detail endpoints: `https://developers.smartrecruiters.com/docs/posting-api` and `https://developers.smartrecruiters.com/docs/endpoints`. Anonymous external requests to WesternDigital and BoschGroup return public listings without an API key or account. No authenticated or internal endpoint is used. Four bounded listing requests cover Western Digital (28 results), Bosch (150 results across two pages of at most 100), and Sika (zero). Queries match broader text, so list rows are not treated as internship admissions.

Western Digital's official `https://www.westerndigital.com/careers` links to `https://careers.smartrecruiters.com/WesternDigital`. Bosch's official `https://www.bosch.us/careers/` links to `https://jobs.bosch.com/en/?country=us`, whose configuration links to its BoschGroup SmartRecruiters careers pages. Exact detail responses match posting ID, employer identifier and title, report `active:true` and `visibility:PUBLIC`, and include substantive job/qualification sections.

After existing role, location, freshness, employer, source-identity and semantic duplicate comparisons, at most 20 new detail requests yielded 20 qualifying targets: Bosch Group 18 and Western Digital 2. Nineteen are internships and one is an early-career finance role. The cohort spans logistics/supply chain, manufacturing, design/test engineering, IT, finance, sales and hardware. Exact factual metadata is in `COVERAGE_PILOT_2026-11-25_D.json`; no employer descriptions are saved in the repository. The public API still marks the Fall 2026 hardware internship active; its season alone is not treated as closure.

Append only these exact URLs to `data/employer-recovery-targets.json`. Reuse `loadEmployerRecovery` with its existing 500-request ceiling, 120-second budget, 80% maintenance allocation, host pauses and 12-hour renewal/24-hour expiry. Actual selection and publication must be measured in hosted runs. No generic source adapter, paid service, dependency, account or new automation is added. The four November 25 local pilot cohorts total 118 candidates, not published gains.

## Quality hardening

The existing SmartRecruiters recovery parser accepted missing posting IDs and missing employer identifiers because it checked only conflicting values. Require an exact posting ID, matching employer identifier, active public visibility and substantive content. Reject required-experience conflicts using the existing qualification parser, including when the title says intern. Reject custom-port recovery URLs. Keep unavailable or incomplete results unknown, never confirmed closed.

Tests cover positive native metadata, wrong/missing IDs and employer names, internal/unknown visibility, inactive status, incomplete shell content, required five-year experience, HTTP and custom ports. Workday recovery behavior and all existing request caps stay unchanged. Existing cache evidence retains its actual timestamp and normal expiry; no positive observation is fabricated or renewed by preparing this batch.

## Latest hosted evidence

Attempt 2 of run 45615562613 passes all 281 tests and types, collects iterations B/C and emits the new per-board report. It proposes Block 17 new, IMC 9 new, Waymo 21, Stripe 20, Jump Trading 15, Brex 8 and MongoDB 8. These are per-board proposal counts, not pilot-specific realized additions. The unchanged guard blocks 141 unexplained internship removals and 59 early-career removals. Proposed current: 5,862; holds: 649. Largest unresolved TikTok/ByteDance groups are 97/19, down from 109/31. Production remains protected, and failure notifications stay enabled.

## Recommended next list

1. Publish only after validation, then inspect the exact recovery lane's hosted admission and request counts.
2. Preserve normal verification progress until the guard permits a new snapshot.
3. Reconcile the 118 local pilot identities against current/held/rejected results and compare all four deployed files with accepted Git bytes.
4. Use measured board yield and recovery outcomes to select further direct employers across supported career fields.

## Release validation

All 282 tests, clean types, full lint and static export pass. After incorporating the latest hosted observation commit, the actual persisted production target file passes its validation test again. This gate checks the data compatibility that caused the earlier failure before allowing a new collection. Publication and hosted verification follow.
