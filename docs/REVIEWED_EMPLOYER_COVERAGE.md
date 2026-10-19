# Consistent reviewed employer coverage

Implemented locally after owner authorization to investigate Keryx admission holds.

## Finding

The first Keryx refresh held 1,049 rows for missing employer evidence. Of these, 810 named employers already represented on the board, and a snapshot comparison matched 730 to both a normalized employer name and an ATS site associated with a reviewed feed. Board presence alone was not used as approval evidence.

The inconsistency was in refresh admission: reviewed feeds could use a coverage exception, while Keryx could not reuse that same employer/site evidence. Unreviewed employers and explicit manual holds must remain distinct from this missing-evidence case.

## Change

`buildReviewedEmployerCoverage` builds an ephemeral evidence index from current-refresh candidates in the already reviewed source set. An anchor must pass current location, role and freshness rules, have no known closure, and have either approved company evidence or the existing missing-evidence coverage exception. No previous snapshot or newly admitted Keryx listing can bootstrap this index.

Keryx can reuse an anchor only when the normalized company name and employer ATS site both match. Workday identities include the full tenant hostname and recruiting site, independent of locale. Greenhouse identities include region and board slug. Lever, Ashby and SmartRecruiters identities include host and employer account. Arbitrary domains, insecure URLs, credential-bearing links and malformed identities provide no evidence. Legal suffix normalization is reused; parent/subsidiary relationships and similar names are not inferred.

All of Keryx's own location, role, freshness, unpaid-risk, company-block and closure checks still apply, and cross-source deduplication still runs. Existing company metadata can be reused where present; missing employee counts and LinkedIn information are not invented. No company trust records or verified-company registry entries were bulk-approved.

## Explicit holds take precedence

The former source exception could also bypass an explicitly pending trust entry. `QualityDecision.coverageExceptionAllowed` is now set only for missing employer evidence. Manual pending/blocked records and unpaid/fee-based postings never qualify, including through reviewed feeds or direct ATS coverage exceptions.

The last-known-good recovery path also respects explicit pending records. This refresh had all 23 source records healthy/nonempty, so recovery was not needed.

## Verification

All 67 tests, lint, TypeScript and static export pass. Regression cases cover order-independent current evidence, no self-approval, unreviewed seeds, different employers, different Workday tenants/sites, closure/ineligible anchors, manual aliases and holds, unpaid postings, Greenhouse region separation, malformed URLs and credentials.

A local source refresh measures admitted Keryx jobs after all remaining checks. Source evidence resolves employer coverage only; it is not a claim that every listing has a live application page or that a company is independently vetted beyond the documented admission standard. No push or production release is included in this task.

## Measured local result

Refresh at 2026-10-19T06:52:57.957Z (October 18, 11:52 p.m. Pacific): 751 jobs carry Keryx as a source, up from four. Of these, 489 normalized application destinations were absent from the previous snapshot; others overlap existing jobs and retain merged source credits. Employer-verification quarantine rows fell from 1,049 to 300, while five closed-posting quarantine rows remain. These are source rows, not unique-job screening totals.

The total board grew from 5,526 to 6,012 jobs. The net change differs from Keryx's added destinations because other sources changed during the refresh. Both Keryx files were healthy; the full refresh remains degraded due to employer-board diagnostics. Duration: 131,203 ms. Public summary, snapshot screening metrics and refresh report were checked for agreement. See [result evidence](reviewed-employer-refresh-result.json).
