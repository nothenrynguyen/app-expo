# Measured coverage recovery, November 18, 2026

## Authorized batch and baseline

The owner authorized batching steps 1 through 6 and making evidence-backed changes while preserving quality. This batch covers baseline measurement, targeted employer review, a new official verification path and production measurement. It does not activate a new discovery feed or claim the intake-doubling goal is achieved.

Starting snapshot `3997b88`, generated November 18 at 5:20 p.m. Pacific, has **3,365 internships**, **2,081 early-career jobs**, **318 internship holds** and **303 early-career holds** (plus one uncategorized hold). This supersedes the earlier morning counts. Later normal scheduler changes must be separated from this implementation's admissions.

## Findings and implementation

### HNTB official vacancy verification

HNTB's corporate careers page https://www.hntb.com/careers/ links directly to https://hntb.jobs/. The public job site is client rendered and uses public search and JSON detail services. Its robots file allows ordinary pages and excludes feeds; this implementation does not use feeds. A reviewed sample is https://hntb.jobs/white-plains-ny/intern-engineer-summer-2027/BC252E0D321E4B72971A8B9DEECE3B07/job/ (R-32291). Its public detail record and Apply redirect confirm the exact HNTB University Careers Workday opportunity.

A narrow adapter verifies existing source-supplied HNTB candidates only. It requires the exact employer identifier, requisition, GUID, U.S. location, current non-withdrawn record, supported early-career work, acceptable experience and pay conditions, and an Apply redirect to the same Workday host, career site and requisition. Credential-bearing URLs, other hosts/sites and ports fail. A different career site is not treated as an automatic alias, even when the requisition looks similar. Missing records and withdrawn mirror records stay inconclusive rather than being declared Workday closures.

The provider's public client marks expiration through presence of `deleted_at`. Its normal search results contain `is_posted:false`, which that client does not use as its expiration flag. The adapter follows the observed public expiration behavior and independently checks the destination and qualifications.

At most **10 exact opportunities and 30 HTTP requests per refresh**, two jobs at a time, with 10-second timeouts. Both reviewed HNTB career sites receive queue slots. Positives renew after 12 hours and expire after 24; unknowns retry after 24 hours. Failed rechecks invalidate older positives immediately. Actual check timestamps persist, including on blocked runs. Requests are deducted from the existing 250 generic-check allowance together with the TikTok/ByteDance requests. No Workday call is made by the adapter and Workday cooldowns remain untouched.

Existing source attribution, application URL, posting date/provenance and stable Workday identity are preserved. Employer metadata updates the title/location/term/category. Persisted mirror observations store factual role classification, not employer job descriptions. Current positive evidence enters the existing employer, strict-source and restoration checks. No blanket HNTB company approval, source-policy exception or whole-site crawl is introduced.

### Allegion employer identity

The official corporate page https://www.allegion.com/corp/en/careers.html links to https://allegion.wd5.myworkdayjobs.com/careers/jobs. A scoped company-trust entry approves only the two locale variants of that exact careers/job path and requires explicit early-career titles and live-listing evidence. No workforce count is invented. This separates stable employer identity from vacancy availability; it does not admit all Allegion jobs or relax strict-source and fallback deadlines.

The generic employer-review explanation now says that identity/current official evidence is missing, rather than implying workforce size must always be re-proved. This is explanatory text only; admission gates are unchanged.

## Nonpublishing pilot and validation

The focused pilot found **29 missing November 15 internship opportunities still supplied in the current quarantine inventory**: five HNTB, nine Allegion and 15 Booz Allen. Five live HNTB mirror checks used 11 requests, and one passed exact current verification. The other four stayed inconclusive. Remaining HNTB historical losses are not assumed to still be supplied by a current feed. Allegion still needs vacancy evidence, and Booz Allen already has employer approval but remains blocked on availability/strict-source evidence. A planned roughly 50-job sample was not padded with stale candidates to meet a nominal size.

The successful old HNTB sample is explicitly limited to current/recent HNTB interns in its title. That eligibility restriction is preserved. The pilot is verification evidence, not a published-admission count. Broader current HNTB candidates are processed through the normal production gates in bounded batches.

Focused regression coverage checks exact destination and employer scope, identity/country/qualification mismatches, withdrawn and missing records, source holds, actual timestamps, failed rechecks, expiry and hard request limits. All 234 tests, lint and the production static build pass. Production receipts follow below. No paid service, new account, additional request budget or public availability tab was added. No screen-control session was needed.
