# November 25 iteration I: accepted growth and exact native identity

## Approved closeout completed

This section supersedes the interim pending/unpublished instructions below. The owner approved four final steps only: reconcile the last refresh, recheck pilot retention and ID aliases, publish the handoff, then stop. No new collection, employer addition, feature or automation was started for closeout.

Accepted snapshot `a368b742` from successful hosted run `45667809235` has 5,984 current listings and 659 holds. The prior 6,013 rows reconcile exactly: 28 duplicate rows compacted, two distinct opportunities removed, one added. The addition is SpaceX Regulatory Affairs Engineer (Starship), posting `8957654002`. Jump Trading Campus UI Software Engineer (Intern), posting `7974943`, was absent from the successful employer board response; a closeout check of its exact native endpoint returns 404 `Job not found`. NBCUniversal NBC Sports Bay Area & California - Programming Intern - Summer 2027, posting `744000159947792`, was excluded by the supported-role gate after native internship category correction. This is a scope exclusion, not closure. No jobs were restored or quality gates changed during closeout.

November 25 pilot retention is 134/137 current: initial cohort 67/69, B 19/20, C 9/9, D 20/20 and H 19/19. The three missing postings are the two Jump Trading postings and Block posting `5436151008`; all have exact native 404 evidence, recorded here or in the iteration I audit. November 22 retention remains 64/69. These are retained pilot counts, not causal net growth or a claim that unique intake doubled.

All 177 retained previously published SmartRecruiters IDs resolve to the accepted canonical IDs through the published compatibility map. There are zero missing aliases. The one additional formerly published SmartRecruiters ID belongs to the scope-excluded NBC posting, so it is not a retained-ID migration failure. Frozen tests separately prove all 178 original IDs survive the identity-only transformation before fresh ingestion policy outcomes. Existing saved-job/application compatibility tests are included in the passing 290-test release gate.

All four live JSON files were verified HTTP 200 and byte-identical to `a368b742` at the preceding stopping-point check. The final refresh report and pilot checks use that exact accepted snapshot; main was fetched again before documentation publication and had no newer snapshot. Machine-readable closeout evidence is `COVERAGE_CLOSEOUT_2026-11-25.json`. Only documentation is published in this closeout batch. The isolated worktree is preserved, unrelated root edits remain untouched, and broader coverage expansion and intake doubling remain open.

Recommended next list, for a future authorized session: inspect current repository/production state, use published unique yield to select a bounded employer recovery or expansion, and keep all zero-cost, permission, availability and quality limits. Stop work after publishing this receipt.


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

## Owner-requested stopping point

The owner paused coverage work to correct local GitHub sign-in and conserve credits. Code `aace2325` is pushed to main and Vercel reports success. Hosted verification run `45667809235` checks out that exact commit, passes setup, types and tests, and was still collecting when this handoff was recorded. Its publication and live-byte verification are pending, not certified complete. Do not start another collection until inspecting that run and current main.

The connected GitHub plugin reports `nothenrynguyen`. Local Git has both the personal and separate work account saved. The requested sign-in reset is scoped to the personal account, with repository-local username `nothenrynguyen`; leave the work account untouched. The owner completes the browser authentication themselves.

No iteration J code or trust changes were made. Read-only leads for later: existing identity holds on 1Password and AMT Engineering have official corporate hiring/size evidence worth checking against their exact current native boards. No jobs from those leads are claimed as recovered. Ignored `.cache/identity-j-evidence.json` contains preliminary observations only.

Resume in `.cache/coverage-receipt-2026-11-25`, branch `codex/coverage-receipt-2026-11-25`. The root UI/analytics edits remain unrelated and untouched. First inspect hosted run `45667809235`, fetch current main, reconcile native aliases and all pilot cohorts, compare four live JSON files, then update ROADMAP and ACTIVE_TASKS. Keep the duplicate cleanup separate from net new opportunities. No new automation was created.

### Final stopping-point verification

Hosted run `45667809235` completed successfully. Accepted snapshot `a368b742`, generated November 25 at 09:46:41 Pacific, has 5,984 current listings and 659 holds. All four live JSON files return HTTP 200 and match canonical `origin/main` bytes. This is 29 fewer rows than the preceding snapshot: frozen identity-only compaction accounts for 28; inspect the actual listing-change report before attributing the remaining refresh difference. The frozen zero-loss assertion applies only to the isolated identity transformation, not every change in a fresh ingestion. Local account reset completed and repository-local `credential.username` is `nothenrynguyen`; the separate work account remains saved. The connected plugin also reports `nothenrynguyen`.

The handoff documentation commit remains local, deliberately unpublished at the stopping point. Next session should reconcile the accepted report and pilot retention, then publish this handoff receipt if still current. Stop coverage work now as requested.
