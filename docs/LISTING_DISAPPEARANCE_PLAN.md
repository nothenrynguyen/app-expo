# Listing disappearance explanations

Saved October 30, 2026 at the owner's request. The location improvement shipped, and the owner subsequently authorized carrying out this permanent pipeline upgrade. Implementation and release verification are in progress. Earlier deferral was historical.

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

The saved artifact showed all 98 unresolved cases attributed to `Employer recovery`; 180 of the 181 pending opportunities carried an employer-verification detail (the remaining case carried destination-verification detail). These observations narrow investigation but do not establish closures or a complete upstream root cause. No jobs were restored and no guard was bypassed.

The real run also exposed a reporting-name mismatch: recovery listings use `Employer recovery`, while health uses `Original employer link recovery`. The evidence adapter now joins this known lane by its `employer_recovery` kind, with a regression assertion. Subsequent blocked artifacts also retain the source/board diagnostic records alongside the change report so collection failures remain inspectable after the seven-day Actions artifact expires if archived. Final release verification follows below.
