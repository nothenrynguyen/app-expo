# Reviewed official career pages, November 18, 2026

## Problem and evidence

The pending queue includes TikTok and ByteDance opportunities whose licensed source links use `go.vansh.nyc`. A successful response from that short link cannot establish the employer, vacancy or eligibility. Sample redirects resolved to exact official job pages:

- TikTok: https://lifeattiktok.com/search/7663042453461600517, Backend Software Engineer Graduate (Business Governance), San Jose.
- ByteDance: https://joinbytedance.com/search/7623552015124154629, Research Scientist Graduates. The saved response keeps job content in hidden streaming fragments, so the new parser deliberately does not accept this sample.

The last production snapshot contains no TikTok or ByteDance listings, so this pilot changes no previously published short-link IDs. Booz Allen remains a separate Workday availability problem; this release does not loosen its strict-source checks or reset cooldowns.

## Implemented decisions

1. Verify only source-supplied candidates named exactly TikTok or ByteDance, on the reviewed short-link host or exact official `/search/<job-id>` pages. This is a bounded verification step, not a new discovery feed. Existing source permissions and explicit review holds remain enforced.
2. Follow one short redirect manually. Require HTTPS, the exact brand's official hostname and numeric job path. Refuse arbitrary hosts, credentials, nonstandard ports, brand mismatches and further redirects.
3. Require a visible job title matching the page title, location, substantive responsibilities and qualifications, and an exact employer application link containing the same job ID. Apply existing early-career and required-experience rules. Hidden fragments, generic shells and HTTP 200 alone provide no positive evidence.
4. Replace source title, location and application destination with verified employer fields. Preserve source attribution and date provenance. No permanent company approval is added. Normal role, location, freshness, employer and source admission checks still run.
5. Check at most 25 source URLs per refresh, four at a time, with at most two requests each and 10-second timeouts. Deduct the actual requests from the existing 250 generic-request budget. Workday and 150 scoped-check caps are unchanged. Both brands receive queue slots; due positive evidence receives maintenance priority within each brand.
6. Renew positives after 12 hours, expire them at 24 hours, and retain their actual verification timestamp on reuse. Unknown results retry after one hour. Any failed recheck immediately invalidates its old positive. Save progress on both successful and blocked runs. Official 404/410 responses are closures; timeouts, 429 and server errors remain unknown and feed the existing outage evidence path.

## Validation and release state

All 225 tests pass, including eight focused tests covering identity, redirects, permissions/holds, hidden content, qualifications, timestamps, recheck invalidation, outage versus closure, brand fairness and the 50-request ceiling. The parser accepts the saved real TikTok sample and rejects the saved hidden-content ByteDance sample. Lint and the production build also pass. Implementation is local; production refresh, admissions and deployment remain unverified.

## Remaining growth work

Measure actual unique admissions after publication before estimating coverage gains. This recovers verifiable existing leads and does not itself double ingestion. Continue reviewing the largest evidence-backed gaps, and separately review permitted new sources against the unique-intake target. Do not treat all pending rows as valid or weaken filters to reach a count.
