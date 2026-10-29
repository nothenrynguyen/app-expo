# Why the published inventory fell

October 29, 2026 (Pacific). Owner-authorized investigation and recovery under the existing no-spending, no-card and permission-conscious sourcing constraints. This investigation uses empluzzed's historical/current snapshots, permitted feeds and official employer evidence, not Jobright listing data.

## Measured causes

The [repeatable audit](coverage-loss-audit-result.json) compares the published pre-migration snapshot `93a0218` (5,893 rows: 3,516 internships and 2,377 full-time) with the published snapshot generated October 29 at 07:20 UTC (2,606 rows: 1,711 internships and 895 full-time). Those are historical measurements, not a permanent live count.

There are 3,401 old destination rows absent and 114 current rows absent from the old snapshot. Therefore `5,893 - 3,401 + 114 = 2,606`, a net decrease of 3,287. Counts use the existing pipeline destination identity; possible URL/requisition aliases are reported separately.

| Observed cause for an absent old row | Rows |
| --- | ---: |
| Employer size/U.S.-presence evidence hold | 1,613 |
| Held source without a current permitted replacement input | 1,602 |
| Role decisions, including current category holds | 92 |
| Location decision | 37 |
| Possible application URL/requisition alias still present | 31 |
| Positive availability evidence missing | 17 |
| Employer decision | 4 |
| Actual deduplication recorded during migration | 3 |
| Employer destination review | 1 |
| Not explained by the initial migration record | 1 |

The two largest buckets account for 3,215 of the 3,401 absent rows, approximately 95%. They are not confirmed closures. The single row outside the initial migration is retained as an unresolved historical explanation, not relabeled closed or silently assigned to permission holds.

Of the 1,613 employer-evidence holds, **1,093 still have rows freshly collected by a direct ATS adapter** in the audited refresh. Employer-board request counts barely changed, from 600 to 599. This directly demonstrates an admission/evidence bottleneck, rather than treating all missing rows as lost sourcing or employer closures. The remaining missing-input destinations include TikTok, Tesla, Workable, SmartRecruiters, Amazon and other employer systems where replacement discovery is incomplete; host counts in the receipt are leads, not eligibility confirmations.

## Root causes

1. **Source eligibility and employer evidence were coupled.** Curated-feed membership supplied both job discovery and a company-admission exception. Holding those feeds removed the company exception even for jobs still freshly collected from retained official employer boards. An employer being missing from the small independent registry is not evidence that it is fake.
2. **Independent discovery is incomplete.** A job that arrived only through a held feed may have no current replacement input, particularly on unsupported employer systems. Retaining approximately 600 existing boards preserves useful coverage but does not provide market-wide discovery.
3. **The employer rule is stricter than lawful/public availability.** It asks for company size or substantial U.S. employment evidence despite supporting Canada and the UK as well. This is a product screening policy, not a legal requirement or evidence that a withheld role is bad. No blanket policy relaxation is made in this batch; scoped first-party evidence is used to recover specific employers.
4. **Names and application routes differ.** `RTX (Raytheon)` is not the same normalized key as `RTX`. Some held rows use aggregator links while other rows for that employer use its official hiring site. Approval must follow a reviewed employer/site relationship, not a global hostname or a brand label on an intermediary.
5. **Feed tables can mislabel employment type.** The reviewed summer discovery feed contains junior full-time titles alongside internships. Its guarded import now derives internship status and season from the actual title, rather than assuming every summer-table row is an internship. This corrects collection labels without inflating coverage.

The earlier permission-first release was intentionally conservative, but it exposed a large recoverable evidence backlog. A low published count is not evidence that the rest of the market consists of low-quality jobs. The correct priority is independently corroborating employers and finding permitted replacement inputs, not imposing more exclusions to justify the count.

## The broader market gap

The sudden decline and the longer-term coverage goal are different questions. Current role families cover software, data, engineering, product, solutions/support, business, finance/quant and IT/security. They are not comprehensive across student majors. Direct local classifier checks return no supported tag for generic nursing, legal, teaching, human-resources and biology-research internship titles. Such exclusions describe current product scope, not job quality. The existing role-exclusion count also includes irrelevant or senior roles, so it cannot be interpreted as a count of missed eligible internships.

To support the owner's goal of a destination for any student, the next product work must review these missing disciplines as well as employer identity, company-size/U.S.-presence policy and permitted discovery. More employer records alone do not make the board comprehensive. No market-wide or Jobright recall percentage has been established.

## Recovery batch

- Palantir: [official SEC filing](https://www.sec.gov/Archives/edgar/data/1321655/000132165526000011/pltr-20251231.htm) reports 4,429 employees at December 31, 2025, with 72% in the U.S.; the [official careers page](https://www.palantir.com/careers/open-positions/) identifies its Lever board. Approval is restricted to that board, explicit early-career titles and positive current listing membership. Intermediary copies and senior titles remain held.
- RTX (Raytheon): [official RTX careers](https://careers.rtx.com/global/en/) and [Raytheon](https://www.rtx.com/raytheon/who-we-are) establish the business relationship. A local alias-approval experiment yielded three extra availability holds for existing RTX rows through shared verification identities and URL variants. That experiment is deferred rather than deployed. The final batch approves Palantir only; the RTX route/verification interaction needs its own fix and comparison. Parent workforce counts are not assigned to subsidiary labels, and intermediary copies remain held.
- Mixed summer-table rows: guarded direct-ATS ingestion classifies explicit intern/co-op titles as internships and other accepted early-career titles as full-time; seasons come from the title.

The [controlled comparison](coverage-recovery-controlled-result.json) uses identical initial state, a fixed clock and shared immutable HTTP responses, with zero missing inputs in both replays. The final Palantir-only batch adds 62 destinations and removes zero compared with the control: 38 were previously published before migration and 24 were absent from that older snapshot. Internships change from 1,731 to 1,761 and full-time roles from 895 to 927. These are controlled local counts, not deployed inventory. No published row changes collection in this sample; the mixed-table correction is preventive and has regression coverage.

All 133 tests, TypeScript and lint pass. The production static export passes after retrying a Windows-generated-directory permission failure with normal filesystem access. Checks find zero invalid supported locations, expired published jobs, duplicate destination identities, held-source credits or source-guarded jobs without positive evidence. Release and live verification are pending. No held feed is reactivated, and no Jobright listing is imported.

## Reproduction and limits

Run `node --import tsx scripts/audit-coverage-loss.ts [baseline-ref]` after updating the local generated snapshot. The default baseline is the recorded pre-migration publication. Audit output includes timestamps, causes and examples. Quarantine entries do not establish that a job is still open or that every listed requirement fits a new graduate. Source-permission holds are conservative operational decisions, not a legal ruling that the underlying employer facts cannot be used.

## Resolution of the recovery milestone

The subsequent [October 29 restoration](COVERAGE_RESTORATION.md#published-and-verified-october-29) is published and production-verified above the prior inventory targets. This diagnosis retains the historical cause analysis and initial Palantir comparison; its earlier pending-release language is superseded by the restoration production receipt.
