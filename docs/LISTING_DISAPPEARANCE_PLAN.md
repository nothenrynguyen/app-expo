# Listing disappearance explanations

Resolution, October 30: the subsequent [sync recovery repair](SYNC_RECOVERY_REPAIR_2026-10-30.md#production-completion) is published and verified by two successful production refreshes. Publication has resumed with existing guards intact. The blocked-run evidence below is historical; remaining individual holds and provider limits are still reported rather than automatically restored.

Saved October 30, 2026 at the owner's request, then owner-authorized after the location improvement shipped. The permanent reporting upgrade is implemented and published. Two real refreshes exercised its report and blocked-publication path. The collection/verification problem they exposed remains open; no new snapshot was published by either run. Earlier deferral was historical.

## Implemented upgrade

- Version 2 of `data/listing-changes.json` retains the legacy URL-row fields for compatibility and adds reconciled unique-opportunity counts, duplicate-row counts and a diagnosis for each missing opportunity. Repeated Workday locale/slug URLs are grouped by exact host/site/requisition; they do not inflate opening counts.
- Each diagnosis includes prior IDs/URLs, candidate presence, original sources, recorded screening decisions (including verification details), exact board status/membership, current Workday posting checks and dated generic posting-cache evidence. Cached evidence outside the current refresh is explicitly marked and cannot establish a fresh closure. Conflicting live/closed observations remain unresolved. Retired boards and board omissions alone do not prove closure.
- Categories separate confirmed closure, scope exclusion, pending verification, unreliable sources, unresolved omissions and acceptance followed by deduplication. Each has an explanation and an investigation action. A source failure is relevant evidence, not proof that it caused the omission. Scope expiration means a freshness rule, not necessarily employer closure.
- `data/refresh-report.json` embeds the reconciled summary and points to full evidence. Console output and the existing GitHub Actions step summary show totals and up to ten investigation cases. No new requests, infrastructure or services are introduced.
- The audit comparison helper uses the version 2 diagnosis only when both compared snapshots match the report, counts unique openings separately, and labels stale-cache fallback as unverified. A no-material-change refresh records the retained snapshot timestamp explicitly so report evidence remains attributable without changing publication behavior.
- Publication/recovery rules and coverage thresholds are unchanged. Legacy reasons remain available for the existing guards; a legacy `closed` screening reason can still originate from a board omission, so use the new diagnosis for a closure claim. This upgrade does not restore jobs, renew evidence or expand coverage.

## Outcome

Every refresh should explain missing opportunities in terms an owner can investigate: URL replacement, confirmed closure, intentional scope exclusion, unreliable source check, or unresolved omission. Do not turn an absence into closure evidence or automatically restore old listings.

## Existing foundation and remaining work

`lib/ingestion/listing-changes.ts` already records per-removal reasons and same-opportunity URL replacements. Build on this rather than replacing it. Improve ambiguous cases with the actual source/board evidence and a clear investigation trail. Reconcile unique opportunity totals separately from legacy URL-row counts so duplicate compaction cannot be mistaken for lost coverage.

Use the existing report and refresh infrastructure. Preserve exact Workday employer/site/requisition identity, source-permission gates, freshness limits and conservative publication guards. No new service or public page is required.

## Verification and value

Local verification: all 165 tests, full lint, TypeScript and static export pass. Four new scenario tests exercise dated closure evidence, board absence/retirement, exact-site Workday aliases and conflicting observations, policy/verification/deduplication reasons, outages and missing diagnostics, plus alias-specific screening details. An initial Windows directory permission error prevented export; the full suite/export rerun with filesystem access passed.

The [frozen reconciliation replay](listing-report-frozen-result.json) confirms the October 30 release changed 6,765 rows to 6,781, but unique openings changed 6,738 to 6,781: 67 added minus 24 removed equals +43. The 27-row alias compaction accounts for the difference from the +16 raw-row change. Pending verification is two opportunities across three URL rows. Historical candidate/posting-check/board-membership inputs were not retained, so this replay does not invent that evidence or substitute for a new production refresh.

Test representative URL replacements, explicit closures, policy exclusions, source failures and uncertain omissions. Require consistent opportunity totals and useful evidence for unresolved cases. Then inspect one real refresh without treating that single run as the feature itself.

Expected effort: roughly one focused development day, subject to the unresolved cases found. The result should reduce manual refresh investigations and misleading closure claims, while providing an interview-defensible example of handling uncertain external data. This improves diagnosis; it does not promise that all missing listings will be recovered.

## How to use the report

1. Open the completed refresh's Actions summary. Check the opening equation separately from the published-row change. URL replacements are retained openings, not disappearances.
2. For investigation cases, open `data/listing-changes.json` at that run's generated snapshot commit. `removedOpportunities` contains one record per exact opportunity, its prior aliases, diagnosis, supporting evidence and next action.
3. For pending verification, inspect `evidence.screening` and its recorded detail. For outages, inspect the exact `evidence.board` and `evidence.sources`, then the existing health report/cooldown schedule. A missing diagnostic is explicitly `not-checked`, not healthy.
4. For unresolved or conflicting checks, compare candidate presence, recorded decisions and posting-specific evidence. Do not infer closure from board absence, a retired endpoint, an inactive source input or a stale cache. Do not restore a listing without admission evidence.
5. To compare recorded snapshots locally, run `npx tsx scripts/audit-refresh-changes.ts BEFORE_REF AFTER_REF`. It writes `.cache/refresh-audit/comparison.json`. Recorded diagnoses are attached only to matching snapshot timestamps; arbitrary historical comparisons retain explicit inference labels.

The reconciliation uses existing opportunity identity, not a new heuristic employer/title match. Cross-provider duplicates and unrecognized Workday URL forms can still need review. A clean refresh with zero removals validates integration, but does not exercise every diagnosis; controlled tests cover those branches.

## First production observation

Implementation `9a2c6da` deployed successfully. [Run 41027805416](https://github.com/nothenrynguyen/app-expo/actions/runs/41027805416) passed clean install/all 165 tests and exercised the new report, then correctly stopped at the existing coverage guard: 57 unexplained full-time removals exceeded its limit. Publication was skipped, preserving the prior snapshot. Proposed totals reconciled as 6,781 + 30 added - 297 removed = 6,514. Diagnoses: zero confirmed closed, 17 scope exclusions, 181 pending verification, one unreliable source and 98 unresolved. This was a blocked proposal, not a published inventory change.

The saved artifact showed all 98 unresolved cases attributed to `Employer recovery`; All 181 pending opportunities carried an employer-verification detail; one also carried destination-verification detail. These observations narrow investigation but do not establish closures or a complete upstream root cause. No jobs were restored and no guard was bypassed.

The real run also exposed a reporting-name mismatch: recovery listings use `Employer recovery`, while health uses `Original employer link recovery`. The evidence adapter now joins this known lane by its `employer_recovery` kind, with a regression assertion. Subsequent blocked artifacts also retain the source/board diagnostic records alongside the change report so collection failures remain inspectable after the seven-day Actions artifact expires if archived. Final release verification follows below.

## Completion and operational follow-up

- The correction deployed successfully in `0b1dbc5`. [Run 41029028929](https://github.com/nothenrynguyen/app-expo/actions/runs/41029028929) passed clean install and all 165 tests. Its real report reconciled 6,781 + 27 added - 297 removed = 6,511 proposed openings. The unchanged guard again blocked publication for 57 unexplained full-time removals. These are proposed changes, not a published loss.
- The final run's [full blocked artifact is archived](listing-report-blocked-production-2026-10-30.json), including source/board diagnostics. Its ZIP hash was checked against GitHub's recorded digest. The [verification receipt](listing-report-production-result.json) records both attempts and byte-for-byte preservation of all four deployed data files from snapshot `9f125a1`, generated `2026-10-30T08:25:41.068Z` (1:25 a.m. Pacific). The live inventory remains 6,781.
- Recovery health was explicitly partial: 3,094 targets, 763 live candidates, 1,077 unknown records, 653 unchecked targets, 31 paused hosts, and 143 requests during this run. Those counters describe different queue/cache states and should not be summed as disjoint dispositions. They do not prove that every omitted opening is closed or that the recovery lane caused every verification failure.
- The second run revealed one more reporting distinction: HP's board returned `status: ok` together with `outcome: rate_limited`. Diagnosis now respects degraded board outcomes as well as outright failures. A regression assertion and [frozen replay of the captured production diagnoses](listing-report-final-diagnosis-replay.json) verify that this case joins the unreliable-source category. Corrected diagnosis totals are 17 scope exclusions, 181 pending verification, 99 with relevant unreliable-source evidence and zero confirmed closures. This correction was validated against captured evidence; a third network refresh was deliberately not used merely to exercise that pure classification change.
- All 165 tests, full lint, TypeScript and static export pass for the completed code, including both real-run regressions. No dependency, infrastructure, source permission, billing, admission, recovery or guard-threshold change was introduced.
- A relevant health problem is not enough evidence to waive the coverage guard. The guard's legacy `unexplained` metric still counts missing inputs without an accepted removal decision, even where the new diagnosis records an outage. Its 57 count is therefore compatible with the improved health annotations.
- The step summary explicitly labels its equation and row totals as proposed, since it is emitted before publication gates. It points blocked runs to their Actions artifact rather than the unchanged successful-snapshot file. Focused report tests verify this wording as well as the arithmetic.

At this earlier stage, the reporting feature was complete but normal publication remained blocked by a separate collection/verification issue, and the checked-in successful-snapshot report remained older. The subsequent sync recovery repair linked above resolved that blockage. Use the Actions summary and archived blocked report for these attempts. The next recommended implementation is a targeted employer-recovery/verification investigation and repair, using these exact missing opportunities and evidence ages. Establish the failure cause and reproduce it before changing admission behavior; preserve current publication and do not restore the missing rows wholesale. Unrecognized Workday requisition formats, including HP's `UNI4799-1`, remain URL-specific rather than being merged by a guessed identifier.
