# Self-service source discovery, batch 1

Checked October 20, 2026. Scope: research and measurement only, with no accounts, outreach, payments or source activation.

## Decision

Jobr is the strongest candidate for a **local validation pilot**, but no candidate is ready to enable. Across 2,142 sampled rows, **zero additions are confirmed publishable** under the complete current policy. This is an evidence limit, not a claim that these providers have no useful jobs.

Jobr is a job aggregator offering a public XML feed for other job boards. It is separate from Jobright. Its sample contains 59 potentially useful non-software roles awaiting employer review, plus one possible existing role with a different location. However, all 60 application links returned HTTP 403 at the Jobr redirect. Two diagnostic requests confirmed a Cloudflare challenge at Jobr, before an employer destination. No challenge bypass was attempted. Browser users might behave differently; automated checks did not establish that path.

## Measured samples

Compared with the captured production snapshot generated **2026-10-20T18:32:42.461Z**, containing **5,990 jobs**. Counts describe bounded samples, not provider inventories or future net board growth.

| Source | Rows examined | Potential additions after initial screening | Confirmed publishable | Finding |
| --- | ---: | ---: | ---: | --- |
| Jobr | 439 | 59 employer holds, plus 1 possible overlap | 0 | Best role coverage, unresolved application destinations and employer evidence |
| YubHub | 800 | 4 employer holds | 0 | Two Anduril leads belong to an employer board we already track; cannot claim new source coverage |
| OnJob | 804 | 1 employer hold | 0 | Mostly unsupported locations or roles outside current early-career scope |
| Remote OK | 99 | 0 | 0 | Sample lacks qualifying non-software early-career leads with supported locations |

Jobr: six US-filtered queries at limit 100 each: Financial Analyst, Operations Analyst, Supply Chain Analyst, Mechanical Engineer, IT Support Specialist, Accounting Intern. Returned counts: 100, 100, 18, 100, 100, 21 respectively. Four exact semantic matches were excluded, nine employer rejections retained, and one possible company/title overlap held. Provider redirect IDs prevent trustworthy employer-destination overlap counts.

YubHub: eight category feeds, capped at 100 rows each: finance, operations, manufacturing, IT, engineering, HR, consulting, sales. These are the latest enriched records, not the full corpus. There were 27 within-sample duplicates and one eligible existing destination. The four employer holds comprise two Anduril roles, one Bayer/Crop Science role and one Honda role. Feed labels are not automatically approved legal-entity aliases.

OnJob: the current JSON feed returned 804 records, one page and no next page. Its remaining healthcare help-desk lead lacks employer approval and exposes an OnJob destination. Remote OK: 99 job records after excluding its metadata entry; 80 location holds and 19 career holds.

The [machine-readable result](self-service-source-measurement.json) contains sequential stage counts and held-lead metadata. Raw descriptions remain in ignored local cache. Initial screening applies existing geography, early-career, category, freshness, overlap and employer checks. Employer review was not weakened to manufacture accepted yield. Missing provider dates are treated as first seen, not original employer dates. Current listings may change after this snapshot.

## Access, permission and cost

| Source | Primary evidence | Requirements and boundary |
| --- | --- | --- |
| Jobr | [Feed documentation](https://jobr.pro/job-feed), [terms](https://jobr.pro/terms) | Expressly authorizes free job-board syndication without signup. Limit defaults to 100, maximum 500; hourly caching guidance. Application URLs use Jobr redirects. Preserve job-page backlinks and visible credit. Generic site restrictions are not permission to crawl unrelated pages. |
| YubHub | [Free feeds](https://yubhub.co/free-job-feeds/), [terms](https://yubhub.co/terms/) | Public feed-specific redistribution grant and per-feed rights metadata require “Data by YubHub” attribution. No key/signup. Free category feeds cap results at 100; paid full-corpus access is outside scope. Provider permission does not independently prove every upstream employer's rights. |
| OnJob | [Job-board feed](https://onjob.io/for-job-boards/), [terms](https://onjob.io/terms/) | Public feed-specific permission to cache and republish, free without key/signup, daily refresh; retain OnJob backlinks. Does not authorize unrelated automated access. |
| Remote OK | [Feed FAQ](https://remoteok.com/faq) | Public feed permits aggregators with attribution and original-post links. Not shortlisted for integration given measured yield; no broader legal clearance inferred. |

These samples used unauthenticated public feeds without a payment method or subscription. There is no associated billing account for overages. Future access changes must stop ingestion instead of registering, upgrading or switching to a paid API. Public access is not an uptime guarantee; unpublished quotas remain unknown, so any pilot must impose its own small request budget and stop on access or rate-limit failures.

Other discovery: Career Nest's advertised API documentation currently resolves to a parked page. Hiring-Now has broad role lists but no explicit redistribution license found in the repository review. Neither merits ingestion. NLx remains deferred without outreach. Existing Keryx, USAJOBS and Dreamwork feeds are not new candidates.

## Recommended next batch, approval required

1. Validate Jobr's existing 60 held leads locally. Match a small representative set to independently accessible official employer listings and requisition IDs, then verify employer evidence. An independent official link must be supported by evidence, never guessed from titles.
2. Resolve the application-path tradeoff: preserve the documented Jobr redirect and verify normal-browser behavior, or establish a permitted, reliable direct-employer path. Stop if access challenges prevent verification. No circumvention or provider outreach.
3. Only if those checks establish useful additions, prepare a disabled adapter and a publication review. Budget six requests per refresh, at most 100 rows each, US-only pilot queries, existing filters unchanged, Jobr credit and job-page provenance preserved. Proposed acceptance threshold: at least ten confirmed unique eligible jobs across at least three non-software role areas, with official destinations and employer approval. A sample does not guarantee this threshold.

Estimated implementation after validation: one source adapter, attribution/provenance handling, and focused adapter tests using synthetic fixtures. No backend or paid service is needed. If the validation fails, close Jobr rather than enabling an unverified feed. Do not spend another batch expanding low-yield Remote OK or OnJob samples first.

## Reproduction and validation

`node --import tsx scripts/measure-self-service-sources.ts` reads the captured baseline and source JSON from `.cache/batch1`, using current repository policy helpers. It writes only ignored research output. Raw samples are intentionally not committed; the sanitized measurement artifact preserves this review's counts and held metadata, but is not a substitute for a fresh fetch. No public snapshot or active source configuration changed.
