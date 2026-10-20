# Listing cleanup and removal explanations

October 19, 2026 (Pacific). Owner approved task 1 (cleanup) and task 2 (source research). This follow-up is local until publication approval.

## Scope and findings

Baseline: snapshot 82034d1, generated 2026-10-20T02:23:32.235Z, 6,103 jobs. Its 181 semantic groups consisted of 94 groups with distinct recognized requisition tokens, 85 needing official evidence, and two iPipeline same-token groups.

The bounded official review checked **192 URLs across the 85 unresolved groups plus both iPipeline groups**, with four workers, a three-minute budget, a 350-request cap and no retries. HTTP 429 stops further requests to that host. JSON-LD identifiers or official Workday `jobReqId` values establish requisition evidence; successful generic HTML does not.

| Outcome | Groups | Action |
| --- | ---: | --- |
| Distinct official requisitions | 18 | Retain the separate listings |
| Same official requisition present more than once | 15 | Extend conservative Workday format recognition; merge only matching tenant and semantic identity |
| Contains closed or unavailable destination | 5 | Four confirmed HTTP 404/410 URLs and four non-job privacy-page URLs held |
| Insufficient official evidence | 49 | Retain pending stronger evidence; no deletion based on title matching |

The five availability groups include the two iPipeline groups, so the table totals 87. Some same-requisition groups also contain a distinct requisition, which remains visible. The review does not claim that all 15 groups contain only duplicates.

iPipeline's four old URLs serve an HTTP 200 page titled Privacy Notice, with a canonical link to the employer's privacy notice. There is no job consent form to complete. These are marked **unavailable application destinations**, not a claim that the underlying roles were filled. Rechecking can restore them if valid job content returns. Amazon, Meta and Steel Dynamics also had four URLs with explicit HTTP 404/410 responses.

Private evidence cache: `.cache/refresh-audit/official-requisition-review.json`. It stores identifiers, statuses and public URLs, not raw job descriptions or credentials. Reproduce with `node --import tsx scripts/review-requisition-groups.ts --verify`.

## Implemented changes

- Recognize additional verified Workday ID formats such as R0020843, DT-20066, REF086121W, R26-7706, RQ229655 and REQ-10082523. Different requisitions, tenants, locations and collection kinds remain separate. Global job identity and browser storage keys are unchanged.
- Detect non-job privacy notices using both the page title and canonical privacy URL, with a structured-job safeguard. Access-denied and ambiguous shells remain unknown. Links to privacy policies on normal job pages do not trigger exclusion.
- Store one bounded, overwritten-per-run `data/listing-changes.json` report. It includes removed public destinations and an observed reason: screening outcome, unavailable application, actual deduplication, failed employer board, absence from an authoritative board, or absence from current source inputs. Unknown causes remain explicitly unknown.
- Record actual pre-dedup acceptance to identify duplicate removal. Title similarity alone cannot produce that explanation. A source omission is never labeled a confirmed closure.
- Include the report in the refresh workflow's generated-file commit. Comparison audits use recorded decisions only when both snapshot timestamps match; historical comparisons otherwise retain inference labels.

## Validation

76 tests, lint and TypeScript pass. Regression tests cover real Workday format boundaries, lookalike hosts, privacy notices versus ordinary job privacy links, and per-destination removal evidence. The local refresh completed at 2026-10-20T03:04:32.254Z with 6,077 jobs, including 11 federal listings. It added one destination and removed 27: 18 actual duplicate aliases, five confirmed closures (including one caught by the regular refresh), and four unavailable privacy-page destinations. The final report distinguishes all three, with no unknown removal reasons. Privacy-page categories were aligned with the final classifier after the refresh.

Data checks found zero invalid URLs, duplicate IDs/destinations, location-policy failures, freshness failures or cached closed/unavailable destinations still displayed. All 24 feeds succeeded; the four known legacy board 404s remain. The final snapshot has 162 semantic groups: 118 recognized distinct-token groups and 44 still requiring additional official evidence. Those 44 remain visible. The original bounded official review counts above refer to the pre-cleanup snapshot.

## Next

Publish the tested cleanup after approval. Continue investigating the 49 inconclusive groups when official identifiers become available; no blanket same-title deduplication. New-source research and its separate approval checkpoint are documented in [the shortlist](NON_SOFTWARE_SOURCE_SHORTLIST.md).
