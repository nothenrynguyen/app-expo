# Active project tasks

Updated October 19, 2026.

## Working agreement

Keep this list current as work progresses. Include a short next-actions list in every iteration report. Make reasonable local implementation changes and record new findings here. Show concrete results and validation for review. Commit each coherent completed task after its relevant checks pass, as authorized by the owner. Obtain explicit approval before pushing or deploying. New hosted resources require the cost review and approval described in COST_POLICY.md.

## Current queue

| Task | Status | Next action / approval |
| --- | --- | --- |
| Audit listing quality | Complete, recorded locally | Findings in [listing quality audit](LISTING_QUALITY_AUDIT.md). Repeatable audit script passes lint. Included with this task-tracking checkpoint. Not published. |
| Fix missed closed-listing signals | Committed locally: `420abbd` | Apple HTTP-200 closure now detected. Ignore scripts, hidden templates and shared page chrome. Empty shells, generic careers pages and access blocks return unknown. Regression tests and public Apple-page replay passed. Publication approval pending. |
| Remove clear role-category leakage | Committed locally: `f7783ea` | Exclude explicit store-floor titles in classification and discovery, including stale stored tags. Local snapshot flags 248 rows (Alo Yoga 190, CSC Generation 58). Professional sales and retail analytics/engineering regression cases pass. Publication approval pending. |
| Define early-career experience boundaries | Needs a concrete proposal | Distinguish new-grad from broader early-career roles before applying broad experience exclusions. |
| Repair screening-count semantics | Committed locally: `98c791e`, data `8d92dae` | Unique final destination counts exclude accepted aliases and recovered jobs from exclusions, separate pending verification, and expose reason buckets. Legacy snapshots show no guessed counts. All 65 tests, lint and static build pass. Real-data consistency checks passed. See [metric contract](SCREENING_METRICS.md). |
| Add homepage screening explanation | Simplified per owner feedback | One small line below the cards: "✦ 15,995 total job links screened", with a four-point text star and the number in the existing purple accent, using the reviewed total rather than exclusions alone. No timestamp, extra explanation or link. Detailed breakdown stays on Methodology. Lint and browser visual checks passed. Preview: http://127.0.0.1:3001. Push/deployment approval pending. |
| Review possible duplicate listings | Queued | Review the 164 matching groups using employer requisitions and descriptions. Matching title/location alone is insufficient for removal. Preserve saved-job compatibility. |
| Review employer-verification false negatives | First evidence batch implemented locally | Verified DLR Group, Olsson, STV and FOTH using official company size and U.S. presence evidence. See [review](EMPLOYER_EVIDENCE_REVIEW.md). All 67 tests, lint and static export pass. Live refresh: 6,080 jobs, 842 Keryx-linked listings, 209 remaining Keryx employer holds. All 23 feeds healthy; employer-board diagnostics remain degraded. Local only. |
| Add browser-local hide-reviewed jobs | Later | Define reviewed/hide/restore behavior and show a local implementation after the quality work. |
| Review optional backend architecture and cost | Later | Assess Go, GraphQL, storage and authentication under COST_POLICY.md. Present a concrete review before adding resources. |

## Source expansion decisions

- Broad non-software source audit: complete locally. Compared seven new source families and a Dreamwork overlap control against 5,532 production listings. See [ranked audit](SOURCE_EXPANSION_AUDIT.md) and [evidence](source-audit-evidence.json). Research tool executed successfully and passed lint. No public listing/configuration changes.
- Keryx integration: owner approved adding it. Configured two local non-software feeds with direct ATS provenance, allowlisted HTTPS ATS destinations, explicit first-seen date fallback, no source-wide trust and no full-board expansion. All 66 tests, lint and static export pass. Local refresh: 1,004 summer and 66 new-grad candidates, four accepted Keryx-linked listings (two new), 1,049 employer holds and five closed-posting quarantine rows. See [integration notes](KERYX_SOURCE.md). No push or deployment for this task.
- Employer admission consistency: implemented and committed locally as `b35679f`, with refreshed data in the next checkpoint. Current-reviewed-source evidence is keyed by normalized company plus exact ATS site, initially for Keryx. No snapshot/self bootstrap or parent/subsidiary inference. Explicit pending/blocked and unpaid records cannot use source coverage exceptions; recovery respects pending holds too. All 67 tests, lint and static export pass. Refresh: 751 Keryx-linked jobs, 489 destinations absent from the previous snapshot, employer holds reduced from 1,049 to 300. Total board: 6,012. See [implementation notes](REVIEWED_EMPLOYER_COVERAGE.md). No push or deployment authorized.
- USAJOBS: conditional second option. Official API requires registration/key; no account or key application submitted and no authenticated yield measured. CareerOneStop, Zapply, Hiring-Now, Jobright and Adzuna have documented permission/access/product-fit questions in the audit.
- Release status: all previously completed site changes were pushed at `470155a`, and production was verified ready. This new research checkpoint is local only; no source activation or additional publication approved.

## Review checkpoints

- Present coherent changes with what changed, why, validation, and remaining limits.
- Record each approval here with its exact scope. Approval for one batch does not approve publication of later batches.
- Keep unrelated existing working-tree changes out of proposed commits.
- October 18: Owner approved pushing all completed work. Queued future tasks remain unimplemented.

## Completed actions and decisions

- October 18: Extended the homepage gravity canvas to a shared wrapper around the headline and collection cards, with a soft fade beneath the screening line. Canvas coverage follows both stacked mobile cards through the existing ResizeObserver. Desktop and 390px browser checks confirmed coverage and no horizontal overflow; lint passed. No changes to board-page effects, animation logic or reduced-motion handling. Local commit checkpoint; no push or deployment.
- October 18: Audited the production snapshot and checked 19 employer links. Added `scripts/audit-listing-quality.ts` and `docs/LISTING_QUALITY_AUDIT.md` locally.
- October 18: Identified closure-detection and retail-role leakage as the first fixes.
- October 18: Recommended explaining screening on the homepage, with numerical claims deferred until counts represent unique excluded listings accurately.
- October 18: Owner authorized maintaining this running list and making reasonable local changes, with approvals as work progresses.
- October 18: Owner authorized starting the closure-detection and retail-role fixes. Implemented locally in `lib/listing-health.ts` and `lib/role-areas.ts`, with regression coverage in `tests/core.test.ts`.
- October 18: All 64 tests, project lint and production static build passed. Live Apple-page replay returned HTTP 200 and classified closed. A first build attempt failed because its output log was inside the build folder; rerunning without that log passed. No full source refresh or snapshot rewrite performed, and no personal records changed. No commit, push or deployment.
- October 18: Owner authorized commits between completed, verified tasks. Created separate local commits `420abbd` for closure detection and `f7783ea` for retail filtering. Audit and tracking files are recorded in a separate checkpoint. Existing unrelated roadmap, analytics and generated-file edits remain outside these commits. No push or deployment authorized.
- October 18: Implemented unique screening metrics in ingestion, summary and refresh diagnostics, plus a Methodology breakdown with refresh time. Verified 65 tests, lint and static export. Metrics changes are a separate local checkpoint before homepage work. A local source refresh is running; no publication authorized.
- October 18: Committed metrics as `98c791e`, then refreshed and checked actual data: 5,532 jobs, 6,151 excluded application destinations, 4,293 awaiting verification. All 21 feeds returned data; six employer boards failed. The degraded status is preserved. Snapshot, collections, summary and diagnostic totals agree. Data committed as `8d92dae`.
- October 18: Added the homepage explanation with real counts, a refresh timestamp, an honest legacy-data fallback and a Methodology anchor. All 65 tests, lint and static build pass. Browser checks confirmed the count, link and expandable breakdown; mobile wrapping at 390px has no horizontal overflow. Console warnings/errors: none. React review: reuse existing fetch/state, type-only data imports, native links/details, no new dependencies or tracking. Local preview remains running for owner review. No push or deployment.

## Next actions after this iteration

1. Review the measured employer-evidence results and remaining holds, prioritizing finance/business coverage.
2. Resolve USAJOBS access and zero-cost requirements, then measure a bounded pilot before integration.
3. Review the accumulated local source changes for publication approval, then verify the deployed refresh.

## October 19 finance/consulting iteration

- Verified Brevan Howard, Charles River Associates (including its explicit parenthetical CRA name) and Virtu Financial using official size and U.S. presence evidence. No blanket source trust or board expansion. Compeer remains unresolved.
- All 67 tests, lint and static export pass. Refresh: 6100 total jobs, 854 Keryx-linked jobs and 197 remaining Keryx employer holds. All 23 feeds returned data; overall refresh remains degraded. See [review](FINANCE_EMPLOYER_REVIEW.md). Local only.
- Next: owner-managed USAJOBS access and cost-limit confirmation, a bounded pilot to measure new finance/business coverage, then publication review of the accumulated local batch. Review remaining employer holds as evidence becomes available rather than making manual employer discovery the main strategy.
