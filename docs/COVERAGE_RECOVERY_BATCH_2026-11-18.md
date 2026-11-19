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

Focused regression coverage checks exact destination and employer scope, identity/country/qualification mismatches, withdrawn and missing records, source holds, actual timestamps, failed rechecks, expiry and hard request limits. All 234 tests, lint and the production static build pass. Production receipts follow below. No paid service, new account, additional request budget or public availability tab was added. No native desktop screen control was used. A later short background-browser check is described below and was ended/reset.

## First production result and discovered follow-up

Implementation `cf51ecf` passed [run 44442532962](https://github.com/nothenrynguyen/app-expo/actions/runs/44442532962) and published snapshot `accb96f`, generated November 18 at 6:14 p.m. Pacific. All four live job JSON files match. The mirror lane made 10 attempts and 24 requests, verifying three HNTB postings that all reached publication (one internship, two early-career roles). Allegion gained one internship through the existing bounded source fallback; it was present in the November 15 baseline and its public ID is unchanged. HNTB destination variants remain separate, so their additions are not claimed as restored old-site saved identities.

The overall result was **3,359 internships and 2,083 early-career jobs**, versus 3,365 and 2,081 at the start. Five additions and nine removals produced net -4 overall. The recovery gain is real but does not establish net board growth in this run. Nine removals were one verification-pending Northwoodspace posting, one unresolved Varda board omission and seven ByteDance rows diagnosed as source-unavailable.

Investigation of the ByteDance removals showed the feed was healthy and the job pages still render visibly. The seven were not proved feed removals. Failed page parsing left the candidate under its short URL while the previous public job used its canonical employer URL, causing a misleading disappearance diagnosis. A temporary background browser check confirmed the exact title, qualifications and matching Apply URL for https://joinbytedance.com/search/7669791940490168629, then the computer-use session was ended/reset.

### Completed streaming content correction

The official career site delivers React streaming containers initially marked hidden, then emits literal segment moves that insert their contents into the visible page. The prior parser removed those completed job segments along with genuinely unused hidden content. The correction resolves only the page's literal completed segment/template moves, in document order, without running scripts. Unreferenced hidden content, incomplete streams, mismatched job IDs, closure notices and unsupported qualifications still fail. The saved real ByteDance graduate-research sample now parses successfully and matches the browser-visible behavior.

The parser version permits a one-time retry of old HTTP-200 inconclusive records within the existing 25-job/50-request cap, prioritizing recent false negatives while retaining renewal and expiry rules. Validated redirect destinations normalize pending candidates to the exact employer identity without granting positive evidence. Existing actual dates, strict source requirements and hidden-content rejection remain in force. Final full-suite results and follow-up production admissions are recorded below.
## Production completion and measured growth

The completed-stream correction `9a59396` passed [run 44443862984](https://github.com/nothenrynguyen/app-expo/actions/runs/44443862984), publishing `0280af3`. Normal follow-up refreshes continued safely. The latest checked [run 44471098942](https://github.com/nothenrynguyen/app-expo/actions/runs/44471098942) published snapshot **4d000a2**, generated November 18 at **10:19 p.m. Pacific**. All nine most recent refresh runs succeeded; Vercel deployment status is successful and all four live public JSON files match the latest snapshot byte-for-byte. All **236 tests**, lint and the production build passed for the final implementation.

| Current inventory | Starting 3997b88 | Latest 4d000a2 | Net change |
| --- | ---: | ---: | ---: |
| Internships | 3,365 | **3,413** | **+48** |
| Early-career jobs | 2,081 | **2,089** | **+8** |
| All current postings | 5,446 | **5,502** | **+56** |

Comparing exact opportunity identities with the starting current snapshot gives **61 additions and five removals** across the interval. Added current postings include **19 HNTB** (all 19 have live mirror evidence), **39 ByteDance**, **one Allegion**, and two other normal pipeline additions. These are new to this starting current inventory, not a claim that all are newly created employer vacancies. Four HNTB opportunities and the Allegion opportunity match the November 15 baseline, with their historical public IDs preserved. Other HNTB career-site variants are not claimed as reconciled old-site identities. Explicit former-intern restrictions remain visible in affected titles.

All seven ByteDance jobs that disappeared in the first run are present again. Because they were already in the starting snapshot, their restoration is not included in the 39 additional ByteDance postings. The completed-stream parser also processes more previously inconclusive pages automatically. The latest lane checked 25 jobs with 50 requests, verified all 25 and reused 229 valid positives. The HNTB lane reused 19 live observations without additional requests in that latest run. The queued probes and prior automatic runs stayed within the fixed per-run caps.

Current holds remain 622 (318 internships, 303 early-career jobs and one uncategorized). Workday remains degraded: the latest report has 53 cooldown records and five actual rate-limit records. The latest run adds ten tracked opportunities with no removals or unresolved-removal diagnoses. This is partial coverage recovery, not provider recovery.

Intake is **23,882 candidate rows and 18,907 unique opportunities**, compared with 23,893 and 18,908 at the start. This batch improved publication/retention of existing opportunities and did not increase source intake or achieve doubling. The internship total remains 747 below the November 15 count of 4,160.

## Next bounded batch

Follow-up: the [cybersecurity pilot and classification correction](CYBER_SOURCE_PILOT_2026-11-18.md) are now production-verified. That follow-up corrected 131 graduate jobs previously counted as internships. Historical collection counters above preserve their original labels and should not be treated as a classification-adjusted internship growth baseline.

The completed batch covers steps 1 through 4: baseline, focused review, implementation and measured production verification. Steps 5 and 6 remain open. Extend current-official verification to another high-impact employer with a reviewed public careers interface (GlobalFoundries/Micron are investigation candidates), separately reconcile historical Workday site variants where exact evidence supports aliases, and pilot one permitted source using overlap-adjusted qualifying additions. Keep reporting internship and early-career changes separately and distinguish recovered old listings from genuinely new intake. Do not loosen availability standards or activate duplicate/unlicensed feeds to raise the count.
