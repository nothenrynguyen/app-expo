# Coverage expansion and permission review

October 28, 2026 (Pacific). The owner approved investigation, implementation, testing, publication and production verification. Hard constraints: no spending, no payment method, and permission-conscious source use. Unrelated staged source-exclusion and environment edits and the untracked Jobbie review are preserved.

## Decisions and evidence

- Compare actual application destinations rather than advertised source totals. A different geography, historical inventory, duplicate location rows or broader experience definition can inflate apparent coverage. Unmatched candidates are leads, not confirmed additional vacancies.
- Rechecked all 12 active community repositories through GitHub's license endpoint. Nine returned MIT licenses; SimplifyJobs/Summer2027-Internships and the two speedyapply repositories returned no detected license. Six feed entries from those three repositories are inactive pending explicit permission. No restricted competitor feed, account, proxy, CAPTCHA bypass, paid API or trial was added.
- The loader now checks the recorded repository permission review before making any network requests. A newly activated source without a reviewed license fails visibly. Recovery cannot restore old records carrying permission-held feed credit. Independently fetched current employer records may still qualify through approved inputs. Permission holds are recorded separately from job closure.
- `aprameyak/2027-tech-jobs` has an MIT license, Copyright (c) 2026 Aprameya Kannan. Reviewed README, full tables, canonical JSON and collector code. Collector code includes direct employer adapters and other collection methods. The import therefore uses only explicit early-career titles and direct supported ATS destinations, with existing company policy and positive employer availability checks. It does not import aggregator detours, descriptions, sponsorship inferences or education claims. It grants no source-wide employer trust and does not expand employer boards. Attribution is retained in the Sources page and third-party notices.
- Corrected ambiguous date-column selection: graduation/start/deadline dates cannot be posting dates. The captured new-grad table parsed 33 rows before the correction and 1,085 after it. Parsing a row is not evidence that it is eligible, open or new to empluzzed.
- Existing company approval gaps affect recognizable employers as well as small firms. Added narrow Northrop Grumman and Booz Allen Hamilton approvals after checking official workforce/headquarters evidence. These require the reviewed Workday destination, an explicit early-career title and current positive availability evidence. They do not approve arbitrary similarly named companies or every vacancy at these employers.
- Independently verified SpaceX, Varda Space and Astera Labs workforce/U.S. presence and restricted their approvals to reviewed employer boards. Varda's official page embeds `vardaspace`; Astera's official early-career page embeds `asteraearlycareer2027`, distinct from its main board. Source labels alone would not establish that ownership. These approvals retain ordinary role/freshness/risk checks and require positive official listing membership.
- Only candidates passing location/category/freshness and plausible employer admission enter the new guard queue. This avoids spending the bounded verification budget on thousands of otherwise ineligible records. Persisted guards and previously published guarded jobs remain guarded even when source attribution changes.
- Reuse exact membership from already fetched authoritative employer boards for scoped availability. A current omission invalidates old positive evidence immediately. Remaining employer and source checks each receive half of the shared 150-check budget, with unused slots available to the other queue. Both now use the requisition-aware verifier, including locale-prefixed Workday links; the prior scoped checker could reject those links without requesting their actual details.
- Permission holds reclassified 305 known boards as retained, exceeding the original 250-retained allowance while total board count remained 595 before Workday. Raised the retained allowance to 400 after review; the independent 1,000-total cap, 90-day retention, bounded concurrency and no-billing architecture remain. Exceeding a cap still stops publication.

## Rights and cost boundary

This is an evidence-based technical review, not legal advice or a guarantee against claims. A repository license does not override upstream third-party restrictions. Public accessibility and the lack of authentication do not by themselves establish redistribution permission. Official API documentation supports the access mechanism; it is not described as a blanket employer-content license. Public snapshots contain short factual listing metadata and original application links rather than copied job descriptions. USAJOBS has explicit public-data redistribution terms. Sources with unresolved permission are held, rather than interpreting silence as approval.

The [U.S. Copyright Office distinguishes facts and short titles from protected expression](https://www.copyright.gov/help/faq/faq-protect.html). That distinction alone does not resolve contractual restrictions, compilation/database rights or every jurisdiction's rules, and is not used to override a source restriction.

Official evidence:

- [New source license](https://github.com/aprameyak/2027-tech-jobs/blob/main/LICENSE)
- [New source collector](https://github.com/aprameyak/2027-tech-jobs/blob/main/.github/scripts/scrape_jobs.py)
- [Greenhouse public Job Board API documentation](https://docs.greenhouse.io/job-board)
- [USAJOBS public-data terms](https://developer.usajobs.gov/guides/terms-of-service)
- [Northrop Grumman 2025 annual report](https://investor.northropgrumman.com/node/43526/html), approximately 95,000 employees and Falls Church principal offices.
- [Booz Allen May 22, 2026 results](https://boozallen.gcs-web.com/static-files/42011851-db05-4136-adf0-d612a1e56d33), approximately 31,500 employees and McLean global headquarters.

No new infrastructure, package dependency, account, payment method or billing entitlement is required. The existing static build, public GitHub Actions workflow and approved USAJOBS credentials are used. Review source permissions again before activation or materially changed upstream use. No provider outreach was sent.

## Measurement and validation

The comparison is `npm run measure:coverage -- --capture` for a fresh bounded capture, or `npm run measure:coverage` to reuse captured licensed source tables in ignored `.cache/coverage-expansion/`. It matches normalized destinations, Workday requisitions and possible semantic duplicates separately. Input hashes and baseline timestamp are retained. Research captures and full response bodies are not published.

The [controlled result](coverage-expansion-controlled-result.json) compares two isolated licensed-only collectors with identical initial state, a fixed clock and a shared immutable HTTP capture. Both replays had zero missing inputs. The control uses previous employer trust and posting-date parsing; the trial adds scoped employer approvals, the corrected parser and the guarded discovery feeds. Both use the permission holds and corrected availability queue.

| Collection | Licensed-only control | Improved trial |
| --- | ---: | ---: |
| Internships | 1,562 | 1,579 |
| Full-time | 343 | 894 |
| Total | 1,905 | 2,473 |

The difference is +568 destinations, including restored coverage, not 568 jobs newly posted by employers. Source credit appears on 43 trial jobs and is not a net-new measure. The earlier published 5,886-job snapshot is a different comparison: the trial removes 3,445 destinations, including 1,625 permission holds and 1,625 pending-verification outcomes. These are not 3,250 confirmed closures. Most of the large decline reflects loss of feed-dependent discovery/employer trust and remaining verification work. Counts must not be presented as market completeness.

Local validation: 132 tests, TypeScript, lint and production static export pass. Windows initially denied a generated build-directory write; the normal-access retry passed. React review: the Sources and Updates changes are static text, with no new hooks, client requests, dependencies or interaction behavior.

The [fresh local release receipt](coverage-expansion-local-result.json) uses the newer published baseline (5,893 jobs), not the frozen comparison. It contains 2,472 jobs (1,579 internships and 893 full-time), 23 destinations absent from that baseline, and 3,444 removals: 1,623 permission holds, 1,626 pending verification, 61 location decisions, 105 role decisions, 23 employer decisions, three actual deduplications and three expiry decisions. There are zero unexplained removals, invalid supported locations, expired published jobs, duplicate destination identities, held-source credits, guarded jobs without positive evidence or collection mismatches. All 24 feed records succeeded; one employer-board failure keeps overall health degraded. Runtime was about 196 seconds. These are local measurements; production verification is pending.

## Remaining scope

This batch does not establish complete market coverage or a universal new-grad experience threshold. Unsupported employer systems, unresolved source rights, employer-review holds and role classification remain possible gaps. Further expansion should prioritize verified eligible opportunities absent from the board, rather than a target advertised count. Private or school-restricted opportunities cannot be assumed available for republication.

The remaining employer-evidence queue includes RTX/Raytheon naming variants, Palantir, Shield AI, CACI and General Dynamics Mission Systems. These are review leads, not approvals or counts of valid vacancies. Palantir's official careers page links its Lever board and its SEC filing documents workforce/U.S. presence; a separately scoped record is a concrete next candidate. Unclear aliases and unsupported destinations must not receive blanket approval.

## Publication and live verification

Implementation `8f2078a` and follow-up `c160d76` were pushed with full owner approval. The follow-up ensures a missing permission-review record is held during recovery, just like an explicitly unresolved record; all 132 local tests and TypeScript pass. Unrelated staged source-exclusion/environment work and the untracked Jobbie review remain outside these commits.

Production [workflow 40831094943](https://github.com/nothenrynguyen/app-expo/actions/runs/40831094943) passed tests, refresh and snapshot publication. Generated snapshot `ed828c0` completed October 28 at 11:48 PM Pacific (October 29, 06:48 UTC). GitHub's Vercel status confirmed the implementation deployment; direct public fetches confirmed the actual deployed snapshot.

The [production receipt](coverage-expansion-production-result.json) records byte-for-byte matches for `jobs.json`, `internships.json`, `fulltime.json` and `summary.json`. Production contains **2,560 jobs: 1,667 internships and 893 full-time roles**. This automated refresh added 88 internships and removed none compared with the initial release. All 24 feed records succeeded. Two employer-board failures remain visible: a Wadetrim timeout and the known Old Mission 404. Overall refresh health is therefore degraded, not fully healthy.

Production checks found zero invalid supported locations, expired published jobs, duplicate destination identities, held-source credits, guarded jobs without fresh positive evidence, collection mismatches or unexplained removals. Sources, Updates and both job-board routes returned HTTP 200 with the expected deployed content. The new discovery feeds receive source credit on 104 published jobs; source credit is not exclusive or net-new yield. No spending, payment method or new hosted resource was introduced.

This completes this implementation/release checkpoint. It does not establish the one-stop-shop coverage goal. The permission-first inventory remains substantially smaller than the old unrestricted snapshot, and the roadmap now prioritizes rebuilding independently supported coverage.

October 29: the owner identified Jobright. Its terms do not clear the automated competitor corpus; see [Jobright review](JOBRIGHT_BENCHMARK_REVIEW.md). The earlier comparison is against one reviewed licensed discovery source, not a completed 100-role-per-collection Jobright benchmark. The follow-up [loss diagnosis](COVERAGE_LOSS_DIAGNOSIS.md) separates missing permitted inputs from employer-evidence holds. No result is inferred from marketing counts.
