# Active project tasks

Updated October 18, 2026.

## Working agreement

Keep this list current as work progresses. Make reasonable local implementation changes and record new findings here. Show concrete results and validation for review. Commit each coherent completed task after its relevant checks pass, as authorized by the owner. Obtain explicit approval before pushing or deploying. New hosted resources require the cost review and approval described in COST_POLICY.md.

## Current queue

| Task | Status | Next action / approval |
| --- | --- | --- |
| Audit listing quality | Complete, recorded locally | Findings in [listing quality audit](LISTING_QUALITY_AUDIT.md). Repeatable audit script passes lint. Included with this task-tracking checkpoint. Not published. |
| Fix missed closed-listing signals | Committed locally: `420abbd` | Apple HTTP-200 closure now detected. Ignore scripts, hidden templates and shared page chrome. Empty shells, generic careers pages and access blocks return unknown. Regression tests and public Apple-page replay passed. Publication approval pending. |
| Remove clear role-category leakage | Committed locally: `f7783ea` | Exclude explicit store-floor titles in classification and discovery, including stale stored tags. Local snapshot flags 248 rows (Alo Yoga 190, CSC Generation 58). Professional sales and retail analytics/engineering regression cases pass. Publication approval pending. |
| Define early-career experience boundaries | Needs a concrete proposal | Distinguish new-grad from broader early-career roles before applying broad experience exclusions. |
| Repair screening-count semantics | Implementation complete, local commit checkpoint | Unique final destination counts exclude accepted aliases and recovered jobs from exclusions, separate pending verification, and expose reason buckets. Legacy snapshots show no guessed counts. All 65 tests, lint and static build pass. Local source refresh underway to validate real counts. See [metric contract](SCREENING_METRICS.md). |
| Add homepage screening explanation | Queued for local preview | Begin with accurate explanatory copy. Add a numerical claim only after the counting is validated. Show the local result for visual approval. |
| Review possible duplicate listings | Queued | Review the 164 matching groups using employer requisitions and descriptions. Matching title/location alone is insufficient for removal. Preserve saved-job compatibility. |
| Review employer-verification false negatives | Queued | Prioritize unique eligible jobs not already accepted, then verify employer aliases and official evidence. |
| Add browser-local hide-reviewed jobs | Later | Define reviewed/hide/restore behavior and show a local implementation after the quality work. |
| Review optional backend architecture and cost | Later | Assess Go, GraphQL, storage and authentication under COST_POLICY.md. Present a concrete review before adding resources. |

## Review checkpoints

- Present coherent changes with what changed, why, validation, and remaining limits.
- Record each approval here with its exact scope. Approval for one batch does not approve publication of later batches.
- Keep unrelated existing working-tree changes out of proposed commits.
- No publication approval has been granted for this queue.

## Completed actions and decisions

- October 18: Audited the production snapshot and checked 19 employer links. Added `scripts/audit-listing-quality.ts` and `docs/LISTING_QUALITY_AUDIT.md` locally.
- October 18: Identified closure-detection and retail-role leakage as the first fixes.
- October 18: Recommended explaining screening on the homepage, with numerical claims deferred until counts represent unique excluded listings accurately.
- October 18: Owner authorized maintaining this running list and making reasonable local changes, with approvals as work progresses.
- October 18: Owner authorized starting the closure-detection and retail-role fixes. Implemented locally in `lib/listing-health.ts` and `lib/role-areas.ts`, with regression coverage in `tests/core.test.ts`.
- October 18: All 64 tests, project lint and production static build passed. Live Apple-page replay returned HTTP 200 and classified closed. A first build attempt failed because its output log was inside the build folder; rerunning without that log passed. No full source refresh or snapshot rewrite performed, and no personal records changed. No commit, push or deployment.
- October 18: Owner authorized commits between completed, verified tasks. Created separate local commits `420abbd` for closure detection and `f7783ea` for retail filtering. Audit and tracking files are recorded in a separate checkpoint. Existing unrelated roadmap, analytics and generated-file edits remain outside these commits. No push or deployment authorized.
- October 18: Implemented unique screening metrics in ingestion, summary and refresh diagnostics, plus a Methodology breakdown with refresh time. Verified 65 tests, lint and static export. Metrics changes are a separate local checkpoint before homepage work. A local source refresh is running; no publication authorized.
