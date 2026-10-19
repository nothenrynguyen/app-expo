# USAJOBS research pilot

Prepared October 19, 2026. Not an active source. No credentials are configured and no authenticated coverage claim has been measured.

## Owner setup

1. Request your own key at https://developer.usajobs.gov/apirequest/index using accurate name, email, phone and project details. Read and accept the terms yourself. The displayed form has no payment field, but complete the zero-cost review before enabling requests.
2. Copy the blank USAJOBS settings from .env.example into ignored .env.local, then enter the issued key and registered email locally. Never paste credentials into chat, public JSON or Git.
3. Confirm access requires no payment method, billable overages or converting trial, and document the actual request-limit behavior. Only then set USAJOBS_PILOT_COST_REVIEWED=true. The public limit documentation specifies 500 rows/page and 10,000/query, not a requests-per-day guarantee.

Suggested application description: empluzzed is an independent, free early-career job board. We will display filtered public federal job announcements with USAJOBS attribution, retrieval dates and links to the current official announcement.

## Run locally

Preview without credentials or network:

    node --import tsx scripts/audit-usajobs.ts --plan

Run after setup and the cost review:

    node --env-file=.env.local --import tsx scripts/audit-usajobs.ts

The pilot makes at most four sequential requests, each limited to 25 rows with a 25-second timeout. No retries, pagination or redirect following. Any HTTP/network/schema failure stops subsequent requests. Missing credentials or cost-review confirmation makes zero requests. No external resources or scheduled workflow are created.

Finance series: 0501, 0510, 0511 and 0560. Business series: 1101 and 1102. Separate student and graduate hiring-path searches avoid assuming that every public job is entry-level. Results represent a bounded recent sample, not a complete federal inventory.

The ignored .next/usajobs-pilot/report.json contains whitelisted announcement metadata and exact destination overlap against the local board. It omits raw response bodies, agency contacts, credentials and registered email. A destination absent from the board is a discovery candidate, not an eligible or publishable job. Manual review must cover location, career level, citizenship, hiring-path eligibility, closing dates and application instructions. Student/graduate matches do not guarantee any particular visitor can apply.

## Activation review

Review measured unique destinations, semantic duplicates, relevant finance/business yield, country eligibility, application flow and stale/closed handling. Public presentation should retain official announcement links, retrieval dates, USAJOBS attribution and a clear non-affiliation statement. No public source configuration or employer trust exception is enabled by this script. Publication remains a separate decision.

Official references: [authentication](https://developer.usajobs.gov/guides/authentication), [search parameters and schema](https://developer.usajobs.gov/api-reference/get-api-search), [limits](https://developer.usajobs.gov/guides/rate-limiting), [public-data terms](https://developer.usajobs.gov/guides/terms-of-service), [OPM series](https://www.opm.gov/policy-data-oversight/classification-qualifications/classifying-general-schedule-positions/).

## First authenticated result, October 19

Four successful searches returned 12 rows representing eight distinct announcement URLs, all absent from the local board. Finance/student: 2; finance/graduate: 4; business/student: 3; business/graduate: 3. These are discovery results, not eight verified suitable vacancies. No public listings changed. See [sample](usajobs-pilot-result.json).

One result is titled Supervisory Accountant and requires exclusion or seniority review despite matching both hiring paths. The remaining seven are Air Force Civilian Career Training announcements. Official pages for auditor (887758500), cost analyst (888515400), acquisition program management specialist (888601400) and both contract specialist notices (888632500, 888633100) explicitly state that actual/projected vacancies may not exist at application time. Such recruiting pools should not inflate current-job counts. The auditor page also requires U.S. citizenship and directs applicants to the Air Force recent-graduates site. Budget analyst (888516200) and financial management specialist (888514800) remain subject to detailed qualification/public-notice review.

Recommendation: do not activate this narrow sample yet. Expand a bounded research sample to engineering, IT and analysis plus student trainee occupational series, then separate actual vacancies from standing public notices. Preserve citizenship, grade/qualification and application instructions. Hiring-path filters alone do not establish early-career fit. Authentication and four-request access worked; no monetary charge was displayed by the API, which is not a contractual cost guarantee.

## Expanded pilot, October 19

Use --expanded for seven searches (maximum 175 rows, no pagination or retries): student trainee series 0399/0599/0899/1199/1599/2299, engineering 0801/0810/0830/0850/0854/0855, IT/data 2210/1550/1560 and analysis 0343/1515/1530. Professional series are queried separately for students and recent graduates. The original four-search mode is unchanged.

The expanded run completed all seven requests, returning 72 rows and 54 unique announcement URLs across 15 agencies, all absent from the baseline board. The trainee query matched 45 but sampled only 25; the other queries fit within their first page. This is a bounded sample, not complete coverage. A second seven-request run after adding unpaid detection reproduced 54 unique announcements. Fourteen requests were made in this iteration. See [expanded sample](usajobs-expanded-pilot-result.json).

Five announcements have unpaid review signals; three have possible standing-notice signals in the API summary/qualification fields. These flags are incomplete review aids, not reliable absence-of-risk tests: full official pages may contain additional conditions. Citizenship-mentioned counts likewise do not identify every citizenship restriction. The payPlans field contains GS/GG/etc., not numeric grade levels.

### Official-page spot checks

- [General Engineer (Developmental)](https://www.usajobs.gov/job/888903800): two Washington, DC vacancies, paid summer May-August 2027 internship seeking undergraduate juniors, U.S. citizenship and minimum 3.4 GPA. Strong candidate for inclusion after normal admission/location/closure checks.
- [Civil Engineer (Recent Graduate)](https://www.usajobs.gov/job/888900400): four Lakewood, CO vacancies and salary range, GS 9-11. Promising recent-graduate candidate; degree/grade qualifications must remain visible and require final review.
- [Business Process Design & Automation](https://www.usajobs.gov/job/888901900): explicitly unpaid volunteer project with zero compensation. Exclude under the existing paid-job policy even though it is a real student opportunity.
- [Statistician](https://www.usajobs.gov/job/888849400): recent-graduate pathway confirmed; remaining qualifications and vacancy details still require review.
- Two attempted trainee page lookups were unavailable through the web tool. Their API results are retained as unverified rather than silently approved.

Recommendation: proceed toward a selective integration, beginning with paid student/graduate announcements whose official details establish suitable career level and actual hiring. Preserve agency identity, citizenship/clearance, eligibility and official application links. Hold unpaid roles, standing notices, ambiguous locations and unverified qualifications. The sample does not establish 54 publishable jobs, nor semantic uniqueness across differently numbered announcements.

Validation: script lint and TypeScript pass; both live expanded runs completed, public data/source configuration unchanged. No credentials in the reports. No publication or scheduled activation.
