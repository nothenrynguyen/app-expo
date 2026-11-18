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
6. Renew positives after 12 hours, expire them at 24 hours, and retain their actual verification timestamp on reuse. Unknown results retry after one hour. Any failed recheck immediately invalidates its old positive. Save progress on both successful and blocked runs. Official 404/410 responses and visible closure notices are closures, even when an old Apply button remains; timeouts, 429 and server errors remain unknown and feed the existing outage evidence path.

## Validation and release state

All 225 tests pass, including eight focused tests covering identity, redirects, permissions/holds, hidden content, qualifications, timestamps, recheck invalidation, outage versus closure, brand fairness and the 50-request ceiling. The parser accepts the saved real TikTok sample and rejects the saved hidden-content ByteDance sample. Lint and the production build also pass. Production completion and measured results are recorded below.

## Remaining growth work

Measure actual unique admissions after publication before estimating coverage gains. This recovers verifiable existing leads and does not itself double ingestion. Continue reviewing the largest evidence-backed gaps, and separately review permitted new sources against the unique-intake target. Do not treat all pending rows as valid or weaken filters to reach a count.

## First production receipt

Implementation 3d81a01 passed production run 44306929525 and published snapshot a0c0592, generated November 18 at 4:47 a.m. Pacific. The bounded lane checked 25 source URLs using 50 requests and verified 15 official opportunities. Fourteen reached publication: 12 TikTok and two ByteDance. The snapshot has 5,232 current jobs and 621 internal holds. Overall reconciliation is 15 additions and one verification-pending removal, with zero unresolved removals; the extra addition is normal pipeline churn. Some ByteDance pages provide visible details and pass, while hidden-content responses remain pending. Intake is 23,869 rows and 18,797 unique opportunities. All four deployed data files matched this first snapshot; the subsequent explicit-closure safeguard is verified below.

## Measured classification gap

One of the first 15 verified pages, TikTok requisition 7663389956951918853, was excluded because its title is Research Scientist Graduate rather than Machine Learning Researcher. Official duties explicitly build a recommendation system and deliver machine-learning solutions; qualifications specify completing a computer-science degree. A narrow classifier correction requires a research-scientist graduate/intern title, ML subject matter, and concrete model, algorithm or ML/recommendation-system development duties. Senior and unrelated clinical, marketing and other research titles remain excluded. This corrects a demonstrated false exclusion, rather than relaxing the whole pending queue. All 226 tests, lint and the production build pass. Implementation 402ef24 and its measured admission are production-verified below.

## Production completion

Three successful production refreshes processed 75 bounded source-URL checks and 150 HTTP requests total. Every run stayed within its existing 250 generic-request allowance, reusing prior positives at their original timestamps:

| Run | Implementation | Snapshot | Fresh verified | Reused verified | Newly published reviewed-employer jobs |
| --- | --- | --- | ---: | ---: | ---: |
| [44306929525](https://github.com/nothenrynguyen/app-expo/actions/runs/44306929525) | 3d81a01 | a0c0592 | 15 | 0 | 14 |
| [44307499996](https://github.com/nothenrynguyen/app-expo/actions/runs/44307499996) | 5592601 | 121bdcb | 17 | 15 | 17 |
| [44308032360](https://github.com/nothenrynguyen/app-expo/actions/runs/44308032360) | 402ef24 | 3899642 | 15 | 32 | 16 |

The final extra admission is the already-verified ML research job recovered by the classifier correction. Snapshot 3899642, generated November 18 at 4:54 a.m. Pacific, contains **5,265 current jobs**, **621 internal holds**, and **47 newly recovered reviewed-employer jobs** compared with the pre-release snapshot: **37 TikTok and 10 ByteDance**. Final-run reconciliation is 16 additions, zero removals and zero unresolved removals. All four live JSON files match the final generated-data commit byte-for-byte. GitHub confirms Vercel deployment success. The previously sampled hidden-content ByteDance page remains inconclusive; other visible ByteDance pages verify normally.

Final intake is 23,870 candidate rows and 18,806 unique opportunities. The pending-candidate measure is 7,729, spanning all employers and changing with source churn; it is not a count of valid jobs that should be published. Four preceding hourly refreshes and all three release checks succeeded. Genuine failures still alert, while source degradation uses the existing single incident rather than creating an issue on every run.

No extra public tab, paid service, source-license exception, broad company approval or Workday cooldown change was introduced. The hourly scheduler will continue bounded verification. The doubling target remains open. Next priorities are the remaining exact-employer evidence gaps and reviewed, permitted sources that add genuinely new opportunities. Empluzzed's one-week deployment retention was saved previously; storage usage reduction has not been reverified in this release.