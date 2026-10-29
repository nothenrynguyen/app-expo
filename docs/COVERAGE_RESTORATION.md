# Coverage restoration and expansion

Approved October 29, 2026. Target: exceed 3,500 internships and 2,300 full-time early-career jobs, with useful, current application destinations. No spending, payment method, paid source or access-control bypass is authorized.

## Approved work and implementation

1. Diagnose the loss against snapshot `93a0218`. The completed diagnosis attributes most missing rows to employer admission changes and paused inputs, rather than proven closures. See [diagnosis](COVERAGE_LOSS_DIAGNOSIS.md).
2. Restore historical employer/site admissions independently of feed reuse rights. Local implementation records 903 historical exact employer/board pairs. Current exact board membership can also admit an employer without workforce-size evidence. Prior publication is not represented as a new independent employer audit. Explicit blocks, unpaid rules, supported geography and current listing evidence still apply.
3. Recover missing discovery inputs through employer destinations. A local queue began with 2,112 historical Workday/SmartRecruiters URLs and now also includes eligible current destinations from permitted discovery, without copied historical titles or descriptions. Fetch current employer metadata, require positive live flags and requisition matching, cache evidence for at most 24 hours, cap each run at 500 requests/120 seconds, and stop a host on access denials or rate limits.
4. Expand supported student disciplines. Local title-based classification adds people/legal, science/health and education. Senior-role and unrelated retail exclusions remain.
5. Prevent repeat losses. Local publication guard blocks large policy-driven collection drops, including explained exclusions, before persistent writes.
6. Compare old and new implementations under identical snapshots, clocks and captured employer responses. Add tests and run types, lint and export. Current unit suite: 145 passing; types, lint and the static export pass. The controlled comparison and production release are complete; see the receipts below.
7. Continue permitted discovery and recovery until the numerical target is reached, or document specific remaining coverage constraints and the next implementation batch. Do not inflate totals with duplicates, closed jobs, unsupported countries or senior roles.
8. Publish validated changes under existing approval, run the production refresh, verify deployed collection files and counts, and record a production receipt. A local count or successful push alone is insufficient.

Jobright is a comparator, not an ingestion source. Its competitive automated-extraction restrictions remain respected. Paused community feeds stay paused unless separately supported by a reviewed reuse basis. No claim of guaranteed legal immunity or market-wide completeness is made.

## Additional local findings

- The prior paid-work filter rejected the word "volunteer" anywhere, including paid volunteer days and prior experience. It now distinguishes those benefits from an actual volunteer role; unpaid and fee-based rules remain.
- SmartRecruiters numeric posting IDs followed by title slugs were not recognized. The parser now resolves the same numeric posting endpoint and recovery rejects contradictory returned identifiers.
- "Graduate Civil Engineer" and "Associate Software Engineer" were absent from the explicit early-career title patterns. Those standard titles now qualify; senior and unqualified management titles remain excluded.
- Direct discovery has expanded beyond four Workday boards using employer/site pairs with current positive responses. Searches remain bounded, use at most three boards concurrently and four detail requests per board, and each board has a 90-second budget. An intermediate local run had 3,757 internships and 1,909 full-time jobs. The later final controlled candidate below supersedes that intermediate count.
- Current employer evidence does not override a blocked or pending trust decision, a scoped destination restriction, or an unpaid rejection. New tests cover these boundaries. Prior admission and board membership are not described as independent company audits.

## Controlled release candidate

The [final controlled receipt](coverage-restoration-controlled-result.json) compares the published baseline implementation with this candidate, starting with the same snapshot and clock and replaying shared captured responses. Both runs have zero missing frozen inputs. Control: 1,761 internships and 922 full-time roles. Candidate: 4,257 internships and 2,608 full-time roles (6,865 total). Both numerical targets are exceeded locally. Invariants find zero invalid countries, expired listings, duplicate destination identities, held-feed credits or guarded destinations without positive evidence.

There are 4,186 added destinations and four removed destinations versus control. The NVIDIA intermediary copy is replaced by its direct employer posting. Leidos returned 404, AbbVie detail fetching failed, and Home Depot returned 403; those three stay pending current verification. Unknown and access-denied responses are not reported as confirmed closures.

The candidate queries 58 Workday sites alongside existing ATS discovery. Its recovery queue has 3,094 destinations and the fixed input contains 1,467 positive cached records. Only factual derived metadata is persisted, and evidence keeps its original timestamp. Positive recovery records become due for refresh at 12 hours, before their 24-hour publication expiry, so a bounded queue can renew them without a simultaneous inventory cliff. Access denials pause further host requests for 24 hours. General Engineering preserves uncertainty about specialty; the graduate-program label requires a student/graduate title signal. Source, country, seniority, employer blocks and destination restrictions still apply.

All 145 tests, types, lint and the static export pass locally. Public-page edits are static copy, with no new client dependency, hook, request waterfall or interactive control. The local receipt remains separate from the production result below and does not establish complete market coverage.

## Published and verified October 29

Implementation `6b8d7cd` was published under the owner's existing end-to-end authorization. [Workflow 40850435335](https://github.com/nothenrynguyen/app-expo/actions/runs/40850435335) succeeded and generated snapshot `fb3fea2` at `2026-10-29T09:38:55.650Z`. All four deployed public JSON files match the generated commit exactly. Live inventory: **4,288 internships and 2,618 full-time roles**, 6,906 total. The [production receipt](coverage-restoration-production-result.json) records hashes, target counts, validation, source failures and removals. Both requested numerical targets are met in production. The United States default filter alone contains 4,025 internships and 2,515 full-time roles; browser verification confirmed the 2,515 full-time result.

The refresh added 4,228 destinations and removed nine versus its actual previous production snapshot: eight current-verification holds and one deduplication. These differ from the frozen comparison because production uses fresh responses and a later baseline. Invariants find zero invalid supported locations, expired jobs, duplicate destination identities, held-feed credits, missing guarded positives or collection-count mismatches. Browser verification confirmed the new People / Legal filter shows 68 U.S. internships and that a recovered SoundExchange Legal Summer Intern opens the employer's live application page. The Methodology and Updates pages show the new policy and milestone.

Collection took 362,419 ms, within the existing ten-minute workflow limit. The run succeeded with degraded sources: 73 of 79 source records and 646 of 653 boards were healthy. Old Mission's retained Greenhouse site returned 404; Zurn Elkay Workday returned 500; Intel, Bank of America, Sierra Space, Milwaukee Tool and LPL Financial Workday returned 429. No denied endpoint was bypassed. Follow-up remains for backoff, site mappings, unsupported providers, remaining disciplines and broader market recall. A numerical restoration milestone is not a claim that every suitable job on the market is present.

No paid service, billing configuration, payment method or additional dependency was introduced. Held community feeds remain inactive and Jobright is not an ingestion source. Unrelated staged source-exclusion/environment changes and the untracked Jobbie review were preserved.
