# Automatic USAJOBS discovery

Release published October 19, 2026 at 7ab69a1. Repository Actions secrets are configured; live refresh run 39315578545 passed and its snapshot deployed successfully. Supersedes the earlier two-announcement allowlist in the pilot history.

## Automatic operation

The shared refresh searches eleven student/recent-graduate combinations covering finance, business, engineering, IT/data, analysis and relevant student trainee series. Search uses 100 results/page, up to two pages/query and 22 authenticated search requests. Detail verification is capped at 120 distinct official postings. Search and detail work share a 120-second budget, 15-second request timeouts, no redirects and no retries. Caps are in data/usajobs-config.json. Pagination/truncation is recorded, not represented as a complete federal inventory.

Every eligible candidate must be discovered through the authenticated official API, then pass matching title/agency checks on its current official USAJOBS page. Only the resulting in-memory candidate object receives federal employer coverage. Copying metadata, replaying a saved report or claiming the source name cannot grant admission. This replaces per-employer/per-posting allowlists while keeping federal authority evidence confined to the official pipeline. Private-company trust is unchanged; explicit pending/blocked records and unpaid checks still take precedence. No invented headcount.

Unpaid/closed/senior postings and standing recruitment notices are excluded or held. Windows longer than 180 days are conservatively held for recruiting-pool review even without explicit notice language. Missing country/career/category/pay evidence remains held. Closing-day uncertainty is held. All structured locations must pass the existing nationwide US/Canada/UK policy, rather than restricting ingestion to a few metros.

Pre-filtered USAJOBS links enter the shared screening tracker, with uncertain evidence counted as pending verification rather than silently omitted from the assessed-link totals. Accepted aliases still override exclusion outcomes under the existing metric contract. Diagnostics expose discovered, accepted, held, search/detail request and cap counts. No public applicant or agency contact details are harvested; reports contain selected public job fields only.

Federal cards/rows retain retrieval/closing dates, citizenship indicators, student/recent-graduate eligibility notes and up to 4,000 characters of official qualifications/education text, with a link to the full official announcement. It remains the source of truth, including application instructions, grade and clearance requirements. Official application links do not transmit an application from empluzzed.

## Reliability and credentials

Missing credentials, invalid API schemas, authentication/rate-limit failures and request failures do not trigger retries or paid upgrades. Failed discovery publishes no partial federal candidate set. Expired or disabled-source records are never resurrected by last-known-good recovery. Source failures remain visible in the overall refresh report.

Local commands load ignored .env.local automatically on Node 22. USAJOBS_API_KEY and USAJOBS_EMAIL remain private. USAJOBS_PILOT_COST_REVIEWED must be true. USAJOBS_ENABLE_DISCOVERY=false explicitly disables the source, including when enabled in configuration. The workflow references GitHub Actions secrets, but no secrets have been uploaded as part of local preparation. Before publishing, the existing owner key/email must be installed securely as repository secrets with those names. No key belongs in Vercel public variables or committed JSON.

## Validation

Regression checks cover multi-page request caps, cross-query deduplication, stopping at rate limits, zero requests when credentials/cost review are missing, no credential headers on public detail requests, URL restrictions, fresh-object provenance, expiry and stale recovery. All 70 tests, lint, TypeScript and static export pass. Final live measurements and release comparisons are recorded in SOURCE_EXPANSION_RELEASE.md.
