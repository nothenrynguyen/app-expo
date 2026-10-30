# Approved audit fixes, October 29, 2026

October 30 release authorization: the owner subsequently requested continuing through completion, including commit, push, deployment and production verification of this batch. Release is in progress. The earlier local-only approval and verification record below describe the completed implementation stage, not the current release authorization.

Owner approved actions 1 through 5 from the project review, for local implementation and verification. No commit, push, deployment, workflow dispatch or external configuration change is authorized or performed. Earlier uncommitted audit documentation is preserved. Public production data files remain untouched in this checkout.

## Action list

| Action | Local result | Publication status |
| --- | --- | --- |
| 1. Excluded career families | Fixed broad Operations overlap, including legacy stored tags. Frozen comparison excludes 19 rows. | Local only |
| 2. Workday identity | Exact host/site/requisition matching, deterministic IDs, compatibility for old saves/statuses/details/tracker records, and separate URL-change reporting. | Local only |
| 3. Dependencies | Next and matching ESLint config updated from 16.3.0 to 16.4.3; compatible affected transitive production/development packages patched. Full npm audit reports zero vulnerabilities. | Local only |
| 4. Direct-link claims | Home and About now prefer employer links and disclose source-board fallback. | Local only |
| 5. Normal cooldown recovery | Verified ordinary production retries after expiry: Elkay failure/backoff and all ten rate-limited hosts succeeding/resetting. Collector regressions also cover both paths. | Existing production implementation only |

## Listing scope and frozen evidence

`excludedOperationsDomain` in `lib/role-areas.ts` prevents general People, Legal, clinical and laboratory Operations titles from inheriting supply-chain eligibility. Genuine software, AI and analytics tags are preserved. Clinical supply-chain/logistics/procurement roles remain supported. Both fresh classification and old snapshot tags use the boundary.

The read-only command `npx tsx scripts/review-approved-fixes.ts` produces [frozen comparison evidence](approved-fixes-frozen-result-2026-10-29.json). Baseline: 6,854 rows at `2026-10-30T01:12:12.152Z`. The comparison excludes 19 rows and merges 70 duplicate Workday rows across the exact same host/site/requisition, yielding 6,765 rows. This is not 89 lost openings: 70 are redundant rows. The four known historical URL replacements yield zero added opportunities, zero removed opportunities and four URL changes. Every retained baseline ID is represented by the resulting primary ID or compatibility IDs.

The 19 exclusions include People/Legal Operations, lab/clinical Operations and a Law School Operations title. Positive tests retain HR analytics, technical healthcare roles, AI engineering serving recruitment, and clinical supply-chain planning. This is not a broad experience-ceiling rule or a new employer-sector exclusion.

The comparison reprocesses frozen accepted jobs, not every raw candidate. It does not claim current market counts or model every newly collectable row in a future full refresh. No fresh employer collection or new source activation was performed. Existing generated timestamps and tracked public snapshots are preserved rather than relabeled as a fresh collection.

## Identity, recovery and private-state compatibility

- `lib/workday-identity.ts` provides a browser-safe exact Workday opportunity key. Locale/case/slug variations match; different full hosts, career sites and requisitions remain separate. Unrecognized requisitions remain URL-specific in the ingestion opportunity matcher.
- Ingestion merge keys, previous-record lookup, last-known-good insertion, deduplication and change reporting use this boundary. Legacy URL-health cache keys are deliberately not migrated into broader trust. Existing exact-site continuity keys and the 24-hour evidence lifetime remain unchanged. Unknown results cannot renew evidence; closure/ineligibility still wins.
- Primary Workday IDs hash the exact opportunity key, excluding title, company display name, locale and slug. They remain stable after temporary absence from the previous snapshot.
- `previousIds` carries historical references. `data/workday-legacy-ids.json` records the four confirmed removed IDs from historical snapshot `ed62823`, scoped to their exact opportunities. `data/job-id-aliases.json` maps public old IDs to canonical IDs, starting with 2,633 compatibility references from the frozen baseline and those four historical aliases. It contains no visitor data or trust decisions.
- The compatibility map ships with the static client, supports direct tracker visits and reloads, and is updated by refreshes only after publication guards pass. The existing workflow's snapshot-file list now includes it. No workflow was run or changed remotely.
- Saved IDs, statuses, retained details and tracker job references are resolved when read. Record IDs, notes, dates, manual records and backup format remain intact. A stored current-ID status takes precedence over an older alias if both exist. Conflicting historical statuses have no timestamps, so no fabricated chronological ordering is claimed.
- Old JSON snapshots are also normalized in memory, including duplicate IDs, so a new static app with an older collection file does not make saves appear unavailable. Snapshot alias updates notify the existing storage subscribers and invalidate their parsed caches. No bulk localStorage migration is performed. Existing retained-detail maintenance and explicit user edits still write normally.
- URL changes are reported separately from lost opportunities. Coverage guards measure unique Workday opportunities for large-drop detection, while retaining row counts and existing unexplained-removal thresholds. Distinct missing requisitions still block publication when thresholds are exceeded.

Compatibility metadata is roughly 153 KB of JSON before build compression. It is bundled with code using saved-state parsers, rather than introducing an extra service or private-data upload. Retain old public-ID mappings for saved-state compatibility; monitor size if this history grows substantially. No new paid dependency, account or infrastructure was added.

## Dependency verification

Installed Next's upgrade/static-export guidance was read before code changes and checked again after upgrading. Next and `eslint-config-next` are 16.4.3, React/React DOM remain 19.2.4, and static export remains enabled. Relevant resolved packages include sharp 0.35.5, source-map-js 1.2.2 and Undici 7.30.1. Compatible brace-expansion, js-yaml and Zod updates also clear development-tool advisories. No force upgrade or stack migration was used.

Full registry evidence: [before](project-review-dependency-audit-2026-10-29.json), [after](project-review-dependency-audit-after-2026-10-29.json). A zero-advisory registry result is a dependency-maintenance check, not a security certification.

## Verification

- 161 tests pass, including five new scope/identity regressions and expanded collector expiry/backoff assertions. Existing uncertainty, closure, permission, backup and privacy tests still pass.
- TypeScript, full ESLint and production static export pass on Next 16.4.3.
- Frozen alias tests cover exact host/site collision negatives, complete requisition formats, title/company changes, absence/reappearance, false removals, duplicate compaction and publication guards.
- Local browser verification uses the generated static export on an isolated localhost origin and synthetic records only. An old Northrop ID appears as a current saved opening with its Interviewing status. Changing status propagates to Applications. Direct tracker reload retains the selected status. Notes and applied date remain intact. The tracker Saved jobs tab finds the current Apply URL. Unsave removes the save while the application record remains.
- Tested both a frozen reprocessed JSON fixture and the unchanged older exported JSON snapshot. The latter proves client compatibility across app/data transitions. No browser console errors were observed in the checked flows. The temporary simple static server does not emulate Vercel's Next segment routing: some prefetched segment paths returned 404 and navigation fell back to full-page loads. This preview does not certify production prefetch/transition behavior for the upgraded Next version.
- At 390 x 844, the retained saved opening, Apply link, status and Unsave controls fit. [Mobile evidence](approved-fixes-mobile-2026-10-29.jpg) contains synthetic local test data.
- The updated Home copy was checked in the browser. Searching People Operations in the local board produces no matching rows. The literal question-mark Save icons and unrelated accessibility follow-ups remain outside actions 1 through 5.

The screenshots/fixtures do not represent a production release. Temporary preview files live only in ignored generated output/cache folders; tracked public JSON was not rewritten.

## Production cooldown observation

The existing production repair was reviewed without deploying local fixes or forcing retries. Normal hourly run `40984963322` succeeded with a deployed generation timestamp of `2026-10-30T01:24:07.537Z`. Its saved deadlines remained unchanged: Elkay `02:03:54.915Z`, ten rate-limited hosts `03:11:37.523Z`. These are October 29 at 7:03:54 p.m. and 8:11:37 p.m. Pacific.

Completed October 30 Pacific by reading the intervening normal runs. [Run 40990832038](https://github.com/nothenrynguyen/app-expo/actions/runs/40990832038), created October 29 at 7:17 p.m. Pacific, succeeded. Collection took 390,775 ms. Elkay made three requests after expiry, still received HTTP 500, advanced its failure count from one to two and saved the next attempt at `2026-10-30T04:23:59.041Z`. This verifies increasing backoff rather than successful employer recovery. Of 227 retained continuity entries belonging to the ten skipped hosts, none advanced its evidence timestamp. All four deployed JSON files matched snapshot `4783605` byte for byte.

[Run 40996555133](https://github.com/nothenrynguyen/app-expo/actions/runs/40996555133), created October 29 at 8:17 p.m. Pacific, also succeeded. Collection started at `03:18:06.827Z`, after the ten rate-limit deadlines, and took 428,670 ms. Every affected host made actual requests, returned healthy results and cleared its persisted cooldown: GlobalFoundries, HNTB, HP, Johnson & Johnson, Northrop Grumman, Amentum, Bank of America, Sierra Space, Milwaukee Tool and LPL Financial. Snapshot `1e3623e` records these outcomes. Both observed refreshes passed their existing coverage guards.

Subsequent 9:17, 10:17 and 11:17 p.m. Pacific refreshes also succeeded. At the final observation, all four deployed JSON files matched snapshot `f8bb115` byte for byte, generated October 29 at 11:23 p.m. Pacific (`2026-10-30T06:23:33.132Z`), with 6,847 listings. The current health groups show 20 healthy feeds and 665 employer boards: 650 healthy, 14 cooling down and one unavailable. Recovery remains partial. Later failures/cooldowns recur; the successful expiry/reset observation is not a promise that providers stay healthy.

The 7:17 run's two unexplained removals, Intel `JR0286629` and Micron `JR111582`, have no exact host/site/requisition counterpart in its published snapshot. Their boards reported healthy collection with zero detail failures, but that alone does not prove closure. Direct detail verification was inconclusive through the available web tool. Preserve these as unresolved disappearance diagnostics, distinct from the four confirmed URL-alias cases fixed locally. Sierra's separate removal was recorded as absence from its official Ashby board. No listings were restored or deleted by this verification.

Complete machine-readable evidence is in [the cooldown receipt](approved-fixes-cooldown-result-2026-10-29.json). These are observations of the already-published source-health repair. None of this batch's local product or dependency changes was deployed.

## Release boundary

The owner has now authorized releasing this batch. Keep the compatibility map with the code and generated refresh state, preserve intervening automated commits, refresh under the existing gates, and verify deployed data rather than claiming the frozen comparison is live. Production completion will be recorded separately with exact implementation/snapshot commits and workflow/deployment evidence.
