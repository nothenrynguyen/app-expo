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
