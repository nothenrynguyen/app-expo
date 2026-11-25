# November 25 iteration I: accepted growth and exact native identity

## Current evidence and action list

- Completed: normal hosted refreshes resumed after the earlier blocked attempts, with the quality guard unchanged. Snapshot `846c7330`, generated November 25 at 09:20:51 Pacific, publishes 6,013 current jobs (3,507 internships and 2,506 early-career) and 659 internal holds. This is +71 current rows versus the pre-work 5,942 snapshot, not a claim that every gross pilot addition caused the net change.
- Completed: all four live JSON files return 200 and match canonical Git bytes at that snapshot. The latest six workflow attempts succeed; five full accepted snapshots advance main, while the redundant backup attempt must not be counted as another collection.
- Completed: exact native identity reconciliation finds 135 of the 137 November 25 growth-pilot opportunities current, and 64 of the 69 November 22 pilot opportunities current. These cohort counts exclude the 18 retry targets.
- Completed: the exact employer Greenhouse posting endpoints return 404 `Job not found` for all seven missing cohort postings at 09:38 Pacific. This is posting-specific unavailability, not an inference from aggregator absence or a claim about an entire employer. The machine-readable receipt lists each endpoint and result.
- Completed locally: native SmartRecruiters identity repair, cache migration, saved-ID compatibility and frozen-data checks. All 290 tests, types, lint and production export pass. Publication and hosted ingestion verification are next.
- Next: publish the scoped code, inspect a hosted run, compare accepted live bytes, reconcile cohort yield and report count cleanup separately from growth.
- Remaining: wider permission-cleared private-sector expansion and unique intake doubling. Neither is certified complete. No new background automation is authorized or added.

## Exact identity correction

The accepted snapshot contains 178 SmartRecruiters rows across current and held data, including 28 duplicate pairs. Bare posting URLs, title slugs and tracking queries previously generated different opportunity keys. Identity now uses the exact employer identifier plus native numeric posting ID. Different employers or posting IDs remain distinct. HTTPS, no credentials or custom port, and exactly two posting path segments are required. Existing generic URL-health cache keys and persisted source-verification target keys remain unchanged.

Candidate detail enrichment shares one request across these aliases. An explicitly active PUBLIC posting with matching employer and posting ID and native employment type `intern` can correct its candidate category to Internship. Other metadata does not gain that exception. Explicit source-review holds also match native aliases.

Published IDs become aliases of a deterministic native ID. Provisional unpublished IDs do not become compatibility aliases. Saved jobs, tracker status and notes use the existing compatibility resolver, including return after a snapshot gap. Internal outage holds retain all previously published aliases without granting fresh positive evidence. First-published dates retain the earliest known date; legacy unknown dates stay old.

Old recovery observations migrate only from a provable native posting URL key. Positive entries require matching candidate URL identity and exact employer name. Newer negative observations win over older positives, and negative wins a timestamp tie. Observation timestamps and existing request, cooldown, renewal and expiry limits stay unchanged. Legacy Workday state is not broadened.

The coverage guard counts exact native aliases as one opportunity, preserving every existing threshold and real-removal check. The frozen accepted snapshot compacts from 6,013 to 5,985 current rows, with 659 holds unchanged, zero unique opportunities lost, 178 published IDs retained through compatibility aliases and no first-published date regressions. This expected 28-row reduction is a correction to duplicate counting, not loss of coverage. Current production still reflects the pre-cleanup snapshot until an accepted refresh publishes the new representation.

## Validation and limitations

The 290-test release gate covers employer/posting separation, malformed paths, saved-job and application status compatibility, earliest publication date, exact review holds, recovery observation migration, newer denial precedence, held-job evidence and real posting loss still blocking publication. Persisted production target validation passes. The focused frozen-data receipt is `COVERAGE_IDENTITY_AUDIT_2026-11-25_I.json`.

Root UI/analytics edits and the earlier diagnostic worktree remain untouched. Only the isolated coverage receipt branch is used. Sync failure notifications remain enabled. Hosted verification is still required for this iteration.

## Recommended next list

1. Publish and inspect the next real hosted ingestion, including guard results and native ID compatibility output.
2. Compare all four live files to the accepted canonical commit and reconcile all growth cohorts by exact native identity.
3. Use published unique yield and existing queue diagnostics to choose the next bounded employer expansion or demonstrated maintenance repair.
