# Broad non-software source research

Reviewed October 19, 2026 (Pacific). Research only: no new source, account, payment method or production integration was enabled. Nationwide US coverage and existing Canada/UK eligibility remain unchanged.

## Recommendation

Correction after preparing the application: [CareerOneStop now routes new job API requests to NLx](https://cloudfront.careeronestop.org/Developers/WebAPI/jobs-api-updates.aspx). NLx's current research-data terms do not authorize identifiable public listings by default. The old CareerOneStop form is not the right job-data application. A public-feed clarification request is prepared in [the application draft](NLX_ACCESS_REQUEST_DRAFT.md), but is not submitted. Adzuna publisher-access verification remains a fallback. No source is cleared for integration. Jobicy is easy to access but showed weak early-career yield.

| Priority | Source | Potential fit | Access and publishing findings | Decision |
| --- | --- | --- | --- | --- |
| Hold, route corrected | [CareerOneStop Jobs API](https://api.careeronestop.org/api-explorer/home/index/JobSearchV2_GetJobsByKeywordAndOnetCode) | Broad US jobs, searchable by keyword/O*NET; useful for finance, operations and engineering searches | [Registration agreement](https://cloudfront.careeronestop.org/Developers/WebAPI/registration.aspx) states royalty-free licensing, requires approved purpose, attribution and approval notification. Data modification restrictions need clarification for normalization, filtering and committed snapshots. Request limits and no-billing behavior still need verification. | General license is legacy background for this job-data use. New requests go through NLx; public-feed rights and pricing remain unconfirmed. See the prepared clarification draft. |
| 2 | [Adzuna](https://developer.adzuna.com/overview) | Broad US/Canada/UK occupations | [API terms](https://developer.adzuna.com/docs/terms_of_service) expressly permit publishing listings with attribution. Default caps include 250 requests/day and 2,500/month. Other uses can require a license after a trial. Confirm free publisher classification, hard limits and snapshot redistribution before requesting access. | Conditional second choice. No assumption of unlimited free use and no trial started. |
| 3 | [Reed Jobseeker API](https://www.reed.co.uk/developers/jobseeker) | UK graduate business/finance/operations roles | Documented graduate and direct-employer filters, pagination and authenticated search/details endpoints. Registration is required. Current public documentation inspected did not establish publisher permission, no-payment requirements or overage behavior. | UK-focused access review after US priorities. No key requested. |
| 4 | [Jobicy public API](https://jobicy.com/jobs-rss-feed) | Remote business, finance, sales and support | Current documentation permits job boards, public access needs no key, and polling passes must be at least an hour apart. Free Apply links must remain Jobicy URLs; direct ATS URLs are a paid feature and are excluded from this proposal. | Low growth priority based on the sample below. A no-key research pilot is technically feasible, but publication still needs owner approval. |
| Hold | [The Muse](https://www.themuse.com/developers/api/v2/terms) | Broad employer/category coverage | API terms allow displaying content in registered apps but restrict replicating its services, require backlinks, and prohibit scraping. Product-fit permission and zero-cost access need clarification. | Do not integrate without confirming this job board's permitted use. |
| Hold | [Himalayas](https://himalayas.app/terms) | Remote non-software categories | API terms prohibit redistributing listings to other job boards or aggregators, despite broader promotional wording on its API page. | Not approved for this use. |
| Hold | [Remotive](https://remotive.com/remote-jobs/api) | Remote business/support roles | Public API conditions require source links and restrict submission to third-party sites. Its [general terms](https://remotive.com/hire/resources/terms-of-use-u4kbkf) also restrict redistribution. | Permission must be clarified before a job-board integration. |
| Hold | [Arbeitnow](https://www.arbeitnow.com/terms) | Predominantly Germany-focused | API backlink condition exists, while general display licensing is restrictive. Geographic fit is weak for the current country policy. | Poor priority; no integration proposed. |
| Hold | [Summer role index](https://github.com/NyXkim5/summer-2027-role-index) | Business/strategy/operations and other early-career categories | Repository distinguishes MIT code licensing from employer-owned listings. It includes mixed upstream discovery methods. No clear blanket job-data redistribution grant was established. | Discovery lead only, not an approved feed. |

## Measured Jobicy sample

A single bounded public traversal of the documented USA filter returned **446 rows across three cursor pages**, with no remaining page. This is the endpoint's seven-day feed window, not the site's entire inventory. No authentication or commercial endpoint was used.

- Declared levels: 153 Senior, 185 Director, 96 Any, six Entry-Level/Junior and six Midweight.
- Eight rows had an entry/junior/intern signal in either level or title. These include clinical, interpreting and coaching roles outside current categories, plus a title/level contradiction on an entry-level financial analyst marked Senior.
- These are screening leads, not accepted jobs or confirmed unique additions. No employer, compensation, application availability or duplicate audit has established publishable yield.
- The result favors access research on broader early-career-capable sources rather than adding Jobicy merely to increase raw counts.

Private research cache: `.cache/source-research/jobicy-sample.json`. No sampled job descriptions were copied into tracked research documents or the public feed.

## Approval-ready next step

The approved access review and application preparation are complete. Owner reviews the corrected [NLx request draft](NLX_ACCESS_REQUEST_DRAFT.md) next. Do not accept its standard research restrictions as permission to publish identifiable jobs. Clarify the authorized public-feed route and zero-cost limits before any application or integration. Adzuna publisher-access review remains the fallback.

No outreach was sent. No new provider credentials or scheduled polling were installed. A pilot must report raw rows, exclusions/holds, likely overlap, confirmed unique eligible jobs and API requests separately.
