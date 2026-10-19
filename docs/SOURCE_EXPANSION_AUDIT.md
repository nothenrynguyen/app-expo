# Broad non-software source audit

Reviewed October 18, 2026. Research only: no connector, source admission, company approval or public listing change.

## Recommendation

Approve a bounded **Keryx direct-link shadow pilot**, starting with Summer 2027 internships. It has the strongest measured engineering coverage among the accessible candidates. This means preparing an unpublished candidate report and resolving admission/provenance questions, not trusting the whole repository or publishing its listings automatically. USAJOBS is the next broad-source candidate, subject to API access and the remaining cost/limit checks.

The immediate blocker is not just finding more jobs. Of 668 direct-link candidates across Keryx's summer and new-grad files, 667 receive pending employer verification under the current local company registry and trust policy; one receives approval. No trusted-source bypass was applied. Connecting Keryx without addressing that policy would yield very little immediately publishable coverage.

## Baseline and method

Compared with the production snapshot generated 2026-10-19T05:23:53.639Z, containing 5,532 jobs. Reviewed seven new source families plus one Dreamwork overlap control. GitHub files and repository licenses were fetched directly without credentials. API products were assessed from official documentation; no accounts, keys, trials or provider messages were created.

The repeatable tool is `scripts/audit-source-candidates.ts`. Research evidence is retained in [source-audit-evidence.json](source-audit-evidence.json). Large downloaded files remain temporary in ignored `.next/source-audit/` and may be cleared by builds.

For the measured lists, the audit uses existing parsing, URL identity, company/title/location identity, country rules, freshness rules and explicit early-career signals. Target roles have an engineering, business, finance/quant or IT/security tag and no software-family tag. Data-only, product-only and solutions-only roles are outside this particular comparison. Tags overlap, so specialty totals are not additive.

"Unmatched" means neither the destination identity nor the existing exact semantic key matched the current board. It does not establish a genuinely new vacancy: aliases, shortened locations, rewritten titles and aggregator detours can conceal duplicates. Company admission and live availability are separate gates. No employer-board expansion was performed.

## Ranked source decisions

| Rank | Source | Measured fit / access | Decision |
| --- | --- | --- | --- |
| 1 | [Keryx](https://github.com/GodlyDonuts/keryx) | Public markdown; repository MIT license; substantive direct employer links. Summer file: 651 unmatched direct non-software candidates; 2027 new-grad file: 17. Repository includes fallback aggregator links too. | Best shadow-pilot candidate. Direct links only, preserve source provenance, verify employer pages, and resolve company admission before publication. Repository MIT does not establish rights in every upstream third-party compilation. |
| 2 | [USAJOBS](https://developer.usajobs.gov/guides/authentication) | Broad federal source with search API and an explicit public-data reuse policy. Search credentials require an application. No authenticated sample obtained. | Conditional next candidate for finance, analysis, engineering and IT. No yield estimate yet; confirm zero-payment access/limit behavior before integration. |
| 3 | [CareerOneStop](https://cloudfront.careeronestop.org/Developers/WebAPI/registration.aspx) | Broad API access is application-based. Registration describes royalty-free use, a 36-month term, purpose restrictions, no modification and per-page attribution. No authenticated sample obtained. | Hold. Clarify compatibility with normalized, merged static snapshots and obtain actual job response/destination evidence plus documented limits. |
| 4 | [Zapply Internships](https://github.com/zapplyjobs/Internships-2027) | 472 parsed rows; 171 target matches. All 472 destinations are `zapply.jobs` links. Current repository terms restrict resubmission to third-party job aggregators/feeds. | Do not integrate under the observed terms. Public accessibility is insufficient permission for our use; do not decode or relay its links to bypass this gate. |
| 5 | [Hiring-Now finance list](https://github.com/mehek-builds/Hiring-Now/blob/main/lists/finance-internships.md) | 260 parsed rows; 240 target matches. All 260 destinations lead to `trylitos.com` job pages. GitHub license endpoint returned 404; reuse permission not established. | Hold: destination detour and permission unresolved. The apparent 230 unmatched candidates are not verified net-new jobs. |
| 6 | [Jobright business-analysis internships](https://github.com/jobright-ai/2026-Business-Analyst-Internship) | 67 parsed rows; 31 target matches; all destinations are `jobright.ai` pages. No repository license retrieved. | Hold: neither direct employer destinations nor reuse permission established. The title says 2026 but includes later roles, so labels alone cannot determine freshness. |
| 7 | [Adzuna API](https://developer.adzuna.com/docs/terms_of_service) | Broad job-search API, registration required. Documented default quotas and per-ad branding/link requirements. Redirects and ongoing-use/limit terms need review for this use. No authenticated sample. | Lower priority under the current direct-application and zero-cost constraints. The 14-day clause applies to specified other uses; do not describe every listing integration as a paid trial. |
| Control | [Dreamwork BUSINESS.md](https://github.com/dreamworkhq/Tech-Internships-2027/blob/main/BUSINESS.md) | MIT repository. 468 parsed destinations, all Dreamwork job pages; 277 target matches, of which 253 match existing board semantic keys. An existing BUSINESS feed is already configured under `Open-Tech-Internships-2027`. | Do not prioritize as independent coverage. Content is not byte-identical to the configured feed, but measured overlap is high. Only 24 target rows lack semantic matches, before resolving employer destinations. |

## Keryx measurements

| Measure | Summer 2027 | New-grad 2027 |
| --- | ---: | ---: |
| Parsed candidate rows | 3,609 | 571 |
| Unique parsed destinations | 3,497 | 563 |
| Target country/role/freshness/early-career matches | 1,092 | 47 |
| Already on board by destination | 412 | 30 |
| Additional possible semantic overlaps | 2 | 0 |
| Unmatched before destination filtering | 678 | 17 |
| Unmatched after known aggregator detours removed | 651 | 17 |
| Already approved by local company policy | 0 | 1 |
| Awaiting employer verification | 651 | 16 |

The summer file advertises 4,558 rows; the current parser reads only 3,609. In particular, source rows without a usable posting date are not imported by this parser. Parser coverage is not an employer-closure test, and skipped rows must not be relabeled as screened-out jobs. A pilot must handle missing dates explicitly without inventing an employer posting date. The new-grad file also has more advertised rows than the parser accepts. We did not audit every seasonal/year file or claim repository-wide yield.

The 668 direct-link candidate rows include 140 civil/infrastructure, 136 mechanical, 111 electrical/hardware, 57 process/manufacturing, 29 operations/supply-chain and 23 finance matches. These overlap. Keryx is strongest here for engineering; this is not evidence of a large finance expansion.

Keryx distinguishes direct applications from discovery-page fallbacks. The audit removes known intermediary domains. Its provenance cells also identify direct ATS inputs for 278 of the summer candidates and all 17 new-grad candidates. Preserve those distinctions during the pilot, and inspect upstream reuse conditions rather than assuming a repository license overrides third-party restrictions. Do not consume restricted upstream feeds indirectly.

### Bounded link check

Checked 12 direct destinations selected across the candidate list, not a random sample: 10 returned HTTP 200, one returned 403 and one failed. Existing closure detection found five live signals, six inconclusive results and one fetch failure. No confirmed closures were detected, but this does not imply a zero closed-job rate. Workday/Oracle application shells require authoritative checks; HTTP 200 alone is insufficient.

Five positive heuristic examples included Kittelson transportation engineering, DLR electrical engineering, TKDA structural engineering, Compeer lending operations and Vast mechanical engineering. The sample includes conditional eligibility such as returning-intern restrictions and US-person requirements elsewhere in the feed. Keep those as employer conditions, never imply that every early-career visitor qualifies.

## Existing coverage and duplication

The project already consumes a Dreamwork business list, product-specific ApplyGuy data and broad feeds alongside direct ATS enrichment. It is not software-only. Adding differently named mirrors can inflate source counts without expanding opportunities. Broad-source comparisons should resolve employer application identities before claiming incremental yield.

## Official API findings and remaining gates

- [USAJOBS public-data terms](https://developer.usajobs.gov/guides/terms-of-service) permit reuse of public data with accuracy/non-affiliation obligations. The [search limits page](https://developer.usajobs.gov/guides/rate-limiting) specifies 500 rows per page and 10,000 per query; it does not establish an unlimited request allowance. Credentials are required for search. No cost, credential, API-response, applicant-eligibility or net-new-yield claim has been verified through an authenticated run.
- CareerOneStop's [registration agreement](https://cloudfront.careeronestop.org/Developers/WebAPI/registration.aspx) is not an already-granted license. No submission was made. Its modification and attribution conditions need a concrete fit assessment before building on its job data.
- Adzuna's [API terms](https://developer.adzuna.com/docs/terms_of_service) list 25 requests/minute, 250/day, 1,000/week and 2,500/month and allow access suspension. No card/overage behavior was verified, and no account was opened. Do not add it with those cost-policy questions unresolved.

## Proposed approval scope

Approve an unpublished Keryx Summer 2027 shadow pilot only. First review the directly sourced ATS subset and parser/date gaps, then verify a bounded set of employer records and propose a justified admission strategy. Retain employer holds; do not mark Keryx trusted wholesale. Produce a final preview of approved, pending, rejected, duplicate and unknown-availability outcomes, with request volume and refresh duration. Preserve existing countries, nationwide coverage, no-sign-up access and zero-cost operation. Return for approval before public source activation.

USAJOBS is the alternative if explicit public-data terms matter more than avoiding API registration. It needs an owner-managed key and a measured sample before any yield promise. No provider messages, registration or resource creation are authorized by this audit.
