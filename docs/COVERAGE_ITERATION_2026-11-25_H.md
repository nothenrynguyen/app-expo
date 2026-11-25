# Reviewed internship groups and queue visibility, November 25 iteration H

## Action list

- Complete locally: verify 19 missing public internships, 17 NBCUniversal and two Bosch in Canada, through the existing exact recovery lane.
- Complete locally: support plural `Internships` only when the native SmartRecruiters employment type explicitly confirms `intern`; preserve original titles and all experience checks.
- Complete locally: add renewal-versus-other selection metrics by employer, with no selection-policy or budget change.
- Complete locally: all 286 tests, types, lint and static export pass.
- Pending: scoped publication and hosted outcomes. Internship publication and growth-pilot reconciliation remain open.

## Discovery and evidence

Bounded anonymous Posting API queries cover NBCUniversal U.S., Wise U.K., Bosch Canada and Western Digital Canada. NBCUniversal has 264 matching-text results across pages of 100, 100 and 64, so local eligibility filtering is mandatory. Bosch Canada returns five results; the Wise graduate query and Western Digital Canada query return zero. No source is enabled merely because a query is empty or a search result exists.

Wise's exact Graduate Software Engineer posting `744000156354869` still appears in search results, but its direct response reports `active:false` and `visibility:INTERNAL`. It is excluded, without inferring closure for other Wise jobs. No credentials or internal-posting endpoint are used.

NBCUniversal's corporate `https://www.nbcuniversal.com/careers` returns 200 and links to its own job-search site. That site returned 403; no retry, proxy or bypass was attempted. The exact NBCUniversal3 public posting board is already represented in the existing public inventory and recovery sources. Current posting-specific native API metadata matches the reviewed employer identifier and public active state. Bosch's corporate-to-BoschGroup recruitment link was verified in iteration D and applies to this Canadian country query.

At most 20 new posting-specific responses were checked after comparing exact source identities and semantic duplicates against current, held and already-seeded jobs. Nineteen qualify and are appended as exact recovery seeds. One environmental health and safety role was held for manual scope review rather than treating the generic Operations wording as sufficient. Exact factual metadata and that exclusion are retained in `COVERAGE_PILOT_2026-11-25_H.json`. No employer descriptions are saved to the repository.

The new roles span finance, analytics, mechanical engineering, automation, supply chain, IT, software, product/creative design, sales and marketing. Every collective internship posting remains one opportunity per exact posting ID. The five November 25 growth cohorts total 137 local candidates (69 + 20 + 9 + 20 + 19), not published gains. The 18 iteration E retry targets and its Continental recovery are separate from that growth count.

## Narrow eligibility fix

Several employer postings use plural Internships in the title and explicitly report native employment type `intern`. The title-only matcher missed those groups. Normalize that plural only for the eligibility check when type is explicitly `intern`, retaining the original displayed title and correct Internship category. Permanent/unknown type does not gain this exception. Public visibility, exact employer/posting identity, substantive content, required-experience conflicts, location, freshness, source and duplicate gates remain mandatory. Tests cover correct classification, unchanged title and refusal of permanent, senior and five-year-experience variants.

## Queue allocation investigation

The persisted cache shows TikTok 74 renewals due and four other due records; ByteDance four renewals and four other due records at the audit time. Cache inventory is not proof of which current source candidates are eligible or selected. Keep the established selection policy unchanged. Add per-employer due/selected and renewal/other counts to existing verification diagnostics and hosted console output. The cap stays 25, renewal stays 12 hours and positive expiry stays 24 hours. Diagnostics make no requests, grant no evidence and do not alter state timestamps.

## Latest hosted evidence

Run 45622089854 at 05:17 Pacific passes all 286 tests and selects 20 native omission diagnostics within the unchanged shared budget. Its rejected proposal has 5,935 current jobs, 659 holds, 324 additions and 308 removals. One posting-specific closure is confirmed, and 17 remaining removals carry source-unavailable diagnoses. Internship coverage remains blocked by 121 unexplained removals; early-career coverage passes with 15. Largest unresolved TikTok/ByteDance groups are 58/4. These proposal counts are not published gains. Hosted observation state `e5913a4f` is incorporated, preserving fresh diagnostic and renewal progress.

## Recommended next list

1. Publish this scoped batch, then inspect its actual renewal allocation and exact recovery results.
2. Keep the internship guard unchanged while completing fresh evidence and native omission diagnosis.
3. Reconcile all 137 growth-pilot identities after the first accepted snapshot and compare all four deployed job files to canonical Git bytes.
4. Use actual published yield and the new queue metrics to select further private-sector expansion or a demonstrated renewal fix.
