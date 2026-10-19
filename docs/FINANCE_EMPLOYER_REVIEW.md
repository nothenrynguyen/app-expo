# Finance and consulting employer evidence

Reviewed October 19, 2026. This batch resolves missing employer evidence for existing Keryx candidates; it adds no discovery crawler or full-board expansion. Job-level filters remain in force.

| Employer | Evidence | Recorded employee floor | U.S. presence |
| --- | --- | ---: | --- |
| Brevan Howard | [Official overview](https://www.brevanhoward.com/about-us/) reports over 1050 team members and New York/Austin offices | 1,050 | Major operations |
| Charles River Associates | [Official facts](https://www.crai.com/cra-careers/essential-facts/) reports over 1,000 consultants and Boston headquarters | 1,000 | Headquartered |
| Virtu Financial | [2025 Form 10-K](https://ir.virtu.com/node/12471/html) reports approximately 1,027 employees on February 13, 2026; [contact page](https://www.virtu.com/contact/) identifies New York headquarters | 1,000 | Headquartered |

The explicit Charles River Associates (CRA) alias is supported by the company's own CRA branding and legal footer. No broad CRA abbreviation alias or subsidiary inheritance is introduced. Employee floors are dated evidence, not a current headcount guarantee. No LinkedIn links are inferred.

These companies accounted for 12 Keryx employer holds before this refresh. Compeer Financial remains held because this review did not establish its employee-count evidence from an authoritative company source. Other unresolved employers are not bulk-approved.

## USAJOBS access checkpoint

The public [API request form](https://developer.usajobs.gov/apirequest/index) asks for name, email, phone, company/agency and a use description, plus acceptance of the terms. No payment field is displayed. This observation does not establish all billing/limit behavior; activation remains conditional on the cost-policy review. No request was submitted. The owner must provide accurate contact details and accept the terms personally. Suggested use description: empluzzed is an independent, free early-career job board. We will display filtered public federal job announcements with USAJOBS attribution, retrieval dates and links to the current official announcement.

A key must stay in local environment configuration and repository secrets, never public JSON or chat. The initial pilot should cap requests, honor rate limits and compare unique eligible destinations before source activation. Include hiring-path eligibility and federal application instructions in the product-fit review.

## Validation and measured result

All 67 tests, lint and static export pass. Refresh result: {"generatedAt":"2026-10-19T07:03:42.659Z","totalJobs":6100,"previousTotal":6080,"keryxPublished":854,"keryxPreviouslyPublished":842,"keryxEmployerHolds":197,"reviewedEmployerPublished":27,"reviewedEmployerPreviouslyPublished":7,"reviewedEmployersStillHeld":[],"refreshStatus":"degraded","healthySources":23,"totalSources":23,"durationMs":145468}. Job IDs are unique, summary totals agree and the existing blocked-company exclusion is preserved. Total board changes include movement from other sources, so they must not be attributed entirely to this batch. Overall refresh remains degraded by employer-board diagnostics. See [result evidence](finance-employer-refresh-result.json). Committed locally; no push or deployment.
