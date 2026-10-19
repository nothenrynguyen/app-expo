# Source expansion release review

Prepared October 19, 2026. All four development steps approved by the owner are complete locally. No push, deployment or remote secret changes have occurred.

## Proposed release

Publish Keryx non-software coverage and automatic USAJOBS discovery together. Keep existing free, account-free browsing, hourly public-repository refreshes and static hosting.

| Measure | Jobs |
| --- | ---: |
| Captured live production baseline | 5,532 |
| Local release snapshot | 6,106 |
| Net change | +574 |

Baseline generated 2026-10-19T05:23:53.639Z; release generated 2026-10-19T08:34:33.122Z. These are snapshots, not permanent inventory claims.

| Source | Listings carrying source credit | Listings absent from production after destination and semantic overlap checks |
| --- | ---: | ---: |
| Keryx | 855 | 570 |
| USAJOBS | 10 | 10 |

Source-credit counts do not establish that the source was the only discovery route. They must not be added to the net change: other feeds changed and older jobs left the board during refresh. The baseline comparison found 590 release listings without a destination or semantic match in production across all sources.

Keryx's new credited listings include 447 engineering, 53 business, 38 finance/quant and 41 IT/security matches. Families can overlap, so those category counts do not sum to the unique listing count.

USAJOBS contributes eight internships and two full-time graduate roles: six finance/quant, two IT/security, one business and one engineering. Its full bounded search found 82 unique postings; ten passed, 72 were excluded or held. All eleven searches fit within their first 100-result pages, so this run was not truncated. It made eleven authenticated search requests and 82 unauthenticated official-detail requests. Request/pagination/time caps still apply when inventory changes.

Representative additions:

- [Financial management internship, DFAS](https://www.usajobs.gov/job/885487500), Texarkana, TX.
- [Accounting internship, DFAS](https://www.usajobs.gov/job/885488300), Texarkana, TX.
- [IT internship, DFAS](https://www.usajobs.gov/job/886886000), Indianapolis/Cleveland/Columbus.
- [Civil Engineer, Recent Graduate, Reclamation](https://www.usajobs.gov/job/888900400), Lakewood, CO.

## Quality and operation

USAJOBS processing excludes unpaid, closed and senior roles. Standing notices and windows longer than 180 days are held, as are missing location/pay/career/category evidence. Government employer coverage is restricted to candidates produced by the authenticated official API and matching current official pages; no general private-employer approval is introduced. Explicit company pending/blocked entries still win. Country eligibility remains nationwide US/Canada/UK.

Federal listings include citizenship, eligibility, closing/retrieval dates, qualifications/education excerpts and direct official requirements/application links. Source attribution and non-affiliation text are also on the Sources page. Full official instructions remain authoritative, including education, grade, clearance and application requirements. No promise that every visitor qualifies.

API keys remain server-side. The proposed scheduled workflow reads USAJOBS_API_KEY and USAJOBS_EMAIL from GitHub Actions secrets, with the completed cost review flag set in workflow configuration. These secrets still need installation before publication using the existing local values. The key/email must never appear in public snapshots or NEXT_PUBLIC variables. No new paid resource, payment method or runtime backend.

## Validation

- All 70 tests, project lint, TypeScript and static export pass on the final implementation. Regression coverage includes pagination/caps, deduplication, partial-failure rejection, stopping on rate limits, zero requests without access configuration, fresh-object provenance and expiry/recovery.
- Data audit: 0 invalid URLs, 0 country-policy failures, 0 freshness failures, zero duplicate job IDs or application destinations. All ten federal records preserve qualifications metadata; eight appear in internships and two in full-time. Snapshot and summary agree.
- All 24 source records returned data. Refresh duration 155744 ms. Overall status remains degraded: six existing employer-board endpoints return 404 and two Lever boards timed out in this run. Both timed-out boards (Drivetrain and ShyftLabs) returned HTTP 200 on targeted follow-up checks (35 and 23 rows); this does not rewrite the original run diagnostics or imply their jobs were reingested afterward.
- 208 same-company/title/location groups remain review candidates, not confirmed duplicate requisitions. They are not automatically removed. This is existing board-quality follow-up, not a claim that every listing is personally vetted.
- Desktop browser checks confirmed new DFAS internship results, compact/card citizenship disclosures, readable qualifications excerpts and official link destinations, with no console warnings/errors. Local preview: http://localhost:3001/internships (search Defense Finance). React review: native details/summary, escaped text, no new client fetches or dependencies; discovery/credentials stay server-side.

Detailed measurement: [release result](source-expansion-release-result.json). Refresh diagnostics: data/refresh-report.json. Automatic-discovery contract: [operation guide](USAJOBS_AUTOMATIC_DISCOVERY.md).

## Single publication checkpoint

After owner approval: securely install the existing USAJOBS key/email as repository Actions secrets, synchronize the branch with any automated upstream data commits, push the completed batch, then verify the scheduled/manual refresh and deployed snapshot end to end. Until that approval, this remains a local release candidate.

Next milestone after publication: prioritize duplicate/requisition review and remaining role/location leakage, then evaluate additional broad non-software sources using measured unique eligible yield. Avoid returning to manual posting-by-posting discovery as the main strategy.

Final safeguards: private key/email scan found neither value in tracked publishable files. Source attribution page verified in the browser. No credentials have been uploaded remotely; GitHub Actions setup is part of the proposed publication action.
