# Project review, October 29, 2026

Audit only. No product implementation, dependency updates, commits, pushes, deployments, workflow dispatches or external configuration changes. The checkout was clean at entry. Current implementation, generated data, production UI and public workflow evidence were inspected, rather than treating prior release receipts as current state.

## Assessment

empluzzed is a useful, working static job board with unusually substantial ingestion safeguards for a personal project. Browser-local tracking, backups, account-free browsing, explicit source permissions, retained employer coverage, uncertainty-aware verification, bounded Workday continuity and publication guards are defensible engineering choices. Keep this architecture. The highest-value work is improving listing precision and identity consistency, alongside dependency maintenance. Broader infrastructure and cosmetic rewrites are not justified.

The product is not yet a guarantee of early-career eligibility, direct employer destinations, unique openings or complete market coverage. Some public copy overstates the implementation. Tests cover important failure cases, but do not establish end-to-end browser correctness or provider availability.

## Verification and boundaries

- Read AGENTS.md, ROADMAP.md, ACTIVE_TASKS.md, COST_POLICY.md, BACKEND_HANDOFF.md, the source-health audit and its production receipt. Inspected board adapters, classification, identity/deduplication, publication guards, schedule/continuity, browser storage, polling, tracker, consent, activity collector and scheduler.
- All 156 tests pass, TypeScript passes, full ESLint passes, and static export passes. An initial restricted build failed creating a generated directory with EPERM; rerunning outside that file restriction passed. This is not established as an application failure.
- Read-only listing-quality audit of the checked-in 01:12 UTC snapshot: 6,854 jobs; zero invalid application URL schemes, destination duplicates under the existing identity function, duplicate IDs, location-policy failures or freshness-policy failures. This only verifies existing rules, not their completeness.
- 200 same-company/title/location/collection groups contain 250 excess rows. These are review candidates, not 250 proven duplicates: separate official requisitions may be legitimate. Examples include DriveWealth across Greenhouse/Ashby and Graphcore across general/early-career boards.
- Production browser: job board renders, search reaches an empty state, application tracker shell renders. At 390 x 844, no horizontal document overflow was observed, rows fit, mobile filters open, Escape closes the panel and restores focus to Filters. Inspected accessible labels and table/control structure. This was a smoke check, not a full screen-reader, contrast, keyboard or tracker CRUD/backup certification. No personal records were created or altered.
- Public production summary advanced to `2026-10-30T01:24:07.537Z`, October 29 at 6:24 p.m. Pacific: 6,854 jobs, 4,255 internships, 2,599 full-time. [Refresh 40984963322](https://github.com/nothenrynguyen/app-expo/actions/runs/40984963322) succeeded following the completed repair. Public repository diagnostics report 357,466 ms, degraded status, no unexplained removals, one addition and one pending-verification removal. Live summary and repository diagnostics share the generation timestamp; all-four-file byte equality was not repeated for this newer snapshot.
- Current production health: all 20 feeds healthy; 665 employer boards, 654 healthy and 11 cooldown; recovery partial. [Live summary](https://empluzzed.fyi/summary.json) and [public diagnostics](https://raw.githubusercontent.com/nothenrynguyen/app-expo/main/data/refresh-report.json) were read directly.
- Post-expiry recovery remains unverified. At inspection, the saved Elkay deadline was October 29 at 7:03:54 p.m. Pacific and the other ten hosts at 8:11:37 p.m. Pacific. Those times were still in the future. The newer normal hourly run confirms skipping and unchanged deadlines, not recovery after expiry. Inspect the first normal runs after these deadlines, expected slots 7:17 and 8:17 p.m., subject to scheduler delays. Do not force retries or reset cooldowns. Require a real attempt after expiry, reset on success or bounded backoff on failure, unchanged evidence dates for unknown results, coverage-guard success, and deployed snapshot agreement before closing this follow-up.
- Production dependency audit completed against npm; saved raw evidence in `project-review-dependency-audit-2026-10-29.json`. Four affected packages, one critical and three high severity package classifications, with fixes available. No dependencies changed.
- Actual hosting billing/account settings and source-by-source legal permission were not independently re-certified. Existing cost controls and source permission gates were reviewed. No new policy violation was established; this is not a legal opinion or a current account-billing attestation.

## Ranked findings

### 1. High product impact, actual bug: excluded career families leak through Operations

`lib/role-areas.ts:131` identifies internal People roles but only guards Solutions/Support tagging. The broad Operations matcher at line 143 still accepts them. The approved scope removal therefore does not hold across overlapping tags.

Checked-in jobs and the live board include TaxRise **People Operations Generalist** and Via **Legal Operations Associate**, tagged only `operations-supply-chain`. Other People Operations examples include Reformation, Arc Institute, Muon Space, Saronic, General Matter, TensorWave and Etched. This contradicts the approved People/Legal exclusion and the Methodology scope statement. Lab Operations Assistant at Arc Institute is another review candidate, not an automatically proven exclusion. Do not exclude genuine analytics or software work merely because it serves HR or a healthcare employer.

Action: define negative domain boundaries before broad Operations tagging, retain supported technical roles, and measure the frozen-snapshot effect with examples. Existing scope tests do not cover this overlap adequately.

### 2. High trust impact, actual bug: Workday identity changes affect reporting and saved state

`lib/source-normalization.ts:jobIdentity` recognizes only a narrow `_JR` numeric Workday pattern, otherwise falls back to the full lowercased URL. `lib/job-dedup.ts:workdayRequisitionIdentity` recognizes more formats but keys only on employer subdomain and requisition and is only consulted within semantic groups. Continuity uses the more conservative exact-board identity in `lib/ingestion/workday-continuity.ts`. These identities serve different purposes without a consistently defined contract.

Executed a read-only reproduction against all four alias pairs in `source-health-production-result.json`: each has equal continuity keys but unequal change identities and unequal generated IDs when company/title are held constant. `scripts/sync-jobs.ts:285` hashes identity plus company and title. Thus URL aliases can become false removals and changed IDs; title/company corrections can also change IDs independently. `useSavedJobs`, `useApplicationStatuses` and `saved-job-details` key on those IDs, so an existing save can become a retained unavailable item while the same opening appears unsaved. The report bug is confirmed; the saved-state consequence is established by code/reproduction, not a claim about observed user data loss.

Action: use exact employer host/site/requisition for Workday matching; distinguish URL replacement from removed opportunity; preserve/migrate old saved IDs and statuses. Do not globally collapse same titles or same requisition text on different sites. Verify negative cases for employer/site collisions, different requisitions, explicit closure and expired continuity evidence.

### 3. Medium-high maintenance priority, confirmed dependency debt; exploitability needs triage

`package-lock.json` installs Next 16.3.0 and affected transitive sharp, source-map-js and undici packages. npm reports four vulnerable packages. Static export in `next.config.ts` avoids a public Next server, image optimization API and Server Actions runtime, so the critical package label does not establish a critical exploit on the deployed static site. Local Windows development and build/ingestion dependency paths still merit prompt review.

The [Windows server advisory](https://github.com/advisories/GHSA-p293-qw3h-jr36) specifically applies to servers on a Windows filesystem. The [Undici decompression advisory](https://github.com/advisories/GHSA-3xpg-4rpp-hhhm) requires its decompress interceptor. Cheerio imports Undici, but the inspected ingestion code uses `load` with separately fetched text, not Cheerio `fromURL`; do not assume every Undici advisory is reachable. Patch compatible affected dependencies after checking installed Next guidance, inspect actual paths, rerun tests/types/lint/export and browser smoke tests, and record any remaining advisory rationale. Do not run a blind force upgrade.

### 4. Medium trust impact, actual public-claim mismatch: intermediary application destinations remain

The local snapshot contains 102 `www.dreamworkhq.com` application URLs. Live board rows for Apple, Amazon and Accenture visibly link through Dreamwork. `app/page.tsx` says “Straight to the employer” and “No detour”; About promises no extra application page. Methodology's narrower “Direct employer links are preferred” matches the fallback behavior better.

Destination recovery exists and remains partial; it does not justify universal direct-link wording. Resolve these links with permitted positive evidence or accurately label the fallback and qualify the promise. An intermediary URL alone does not prove payment, a dead listing or a malicious site, and this audit did not establish those claims.

### 5. Medium, operational limitation: provider cooldown and evidence expiry can still reduce coverage

The source-health repair is complete and later normal collection works during cooldown. It cannot cure upstream 429/500 responses. Workday continuity intentionally expires after 24 hours and unknown results cannot renew it. Repeated outages can therefore remove otherwise open jobs once evidence expires. Health is not listing-open percentage. Post-expiry production observation remains required as described above.

The ten-minute Actions timeout is also tight: a verified repair run spent 542.8 seconds collecting before install/tests/publication overhead. The later 357.5-second collection is better but not a guaranteed bound. `.github/workflows/sync-jobs.yml`, `lib/workday.ts`, `workday-schedule.ts` and the refresh Worker provide bounded requests/retries, serialized writes, fallback scheduling and fresh-snapshot skipping. Preserve these before expanding expensive coverage. Cooldown writes are gated with publication, so a blocked run can leave no persisted new backoff, as the repair audit already discloses.

### 6. Medium, product limitation and verification gap: early-career eligibility is heuristic

`lib/ats-boards.ts:isEarlyCareerTitle` accepts title OR description signals; `lib/role-areas.ts` excludes explicit senior titles but does not enforce an experience ceiling on every source path. The direct adapter labels accepted non-internships “New grad”. A generic 1+ year phrase or a title signal can coexist with stronger qualifications elsewhere. No description-wide requirement conflict assessment is established. Methodology correctly tells users to check requirements. A reviewed experience policy and real posting examples are preferable to blindly dropping all Engineer II roles or trusting source category labels. This audit does not assert that every ambiguous title is ineligible.

### 7. Medium-low, actual documentation drift and operational evidence gap

`docs/BACKEND_HANDOFF.md` says no owned analytics/database exists and proposes an obsolete analytics contract, while the deployed collector, D1, random browser ID and dashboard exist. ROADMAP and ACTIVE_TASKS still contain “local and unpublished” copy sections contradicted by the live personal copy and consent controls. Historical receipts should remain historical; active status needs reconciliation before another implementation handoff.

Analytics cron is configured in `workers/activity/wrangler.jsonc` and implemented in the collector. `ANALYTICS_ACTION_LOG.md` still has no observed successful scheduled cleanup. Do not turn configured retention into a verified production deletion guarantee. Credential rotation and owner walkthrough are recorded as complete and were not reopened by this audit.

### 8. Low, actual usability defects and optional accessibility improvements

The mobile screenshot visibly shows a question mark in Save controls. This is literal `?` markup in `app/JobBoard.tsx:152` and `app/job-board/JobResults.tsx:192`, not a missing font. Accessible button names still identify the action. Fix in a small usability batch.

Engineering specialty links are given `role=radio` in `JobFilters.tsx` without radio arrow-key behavior. Keep normal navigation semantics or implement the full keyboard contract. The mobile modal has focus cycling/Escape behavior, but background content is not made inert. Treat full screen-reader/modal isolation checks as follow-up, not as a completed accessibility certification. Search, filters, tracker and saved-state behavior need a small browser regression suite; the current npm test script is logic-oriented, not a browser suite.

## Privacy, costs and maintainability

The inspected analytics client accepts fixed events/categories, excludes personal record contents and search text, checks consent/privacy signals, omits credentials/referrer and stops collection on withdrawal. The collector validates payloads, uses parameterized transactional SQL, HMACs browser identity, protects reports, bounds accepted events and keeps detailed data cleanup separate from aggregate totals. Application backup is browser-local plaintext with explicit privacy copy. No frontend owner credential was discovered in the inspected implementation. This was not an exhaustive secret-history scan or penetration test.

The collector's per-isolate throttle and client-generated identity do not prevent determined event spoofing or global daily-cap exhaustion. This is an analytics limitation, not a reason to add paid infrastructure. Visitor counts are consenting browser estimates, not people or demonstrated adoption. Browser-local records can be lost with cleared storage and can race across tabs; backups and honest limits matter more than accounts at this stage.

Source permission holds, conservative verification and retained-board discovery are strengths. Coverage expansion should use measured missing employer opportunities and cleared access/reuse, not a target count or automatic activation of held sources. The 5,796 pending destinations in the newer summary are unresolved verification, not a ready-to-publish backlog.

Modules are reasonably separated into adapters, policy, recovery and reporting; the sync script remains the central orchestration point. Improve shared identity/policy contracts when fixing concrete defects. Avoid a broad refactor. JSON collection payloads are several megabytes and parsed client-side; measure compressed transfer and actual mobile loading before choosing a different delivery format or adding a backend.

## Recommended next three tasks

1. **Repair excluded-family overlap with a frozen quality audit (roughly half to one day).** Highest immediate product precision benefit and a concrete correction to an already approved boundary. Add counterexamples for People/Legal Operations and positive controls for HR analytics, technical healthcare roles and legitimate supply-chain operations. Verify full data delta and removal reasons, relevant tests, all checks and representative browser rows. Include the small direct-link claim correction so copy reflects the measured 102 fallback URLs; resolving all intermediaries is separate work.
2. **Unify Workday opportunity matching and preserve saved identity (roughly one to two days).** Fix the known report bug and its user-state consequence without deleting distinct openings. Reproduce the four locale aliases, exact-site collision negatives, title changes, old-ID saves/statuses and unavailable-saved recovery. Verify frozen added/removed opportunity counts and publication guard behavior. Observe post-expiry scheduled refreshes as an operational acceptance check; do not require providers to succeed to prove correct bounded backoff.
3. **Patch and triage dependency advisories (roughly half to one day).** Keep the small dependency footprint while removing known maintenance debt. Read installed Next guides, choose compatible patches, explain reachability and any remaining alerts, rerun the complete suite/export and desktop/mobile consent/tracker smoke checks. No stack migration or service addition.

Separate low-effort operations follow-up: observe scheduled analytics cleanup and reconcile active handoff/status notes. Broader deduplication and early-career experience policy should follow these batches with evidence review, not blanket exclusions. Estimates are engineering effort, excluding provider cooldown wait and any later owner-approved release.

**Specific next implementation recommendation: fix the People/Legal Operations classification leak, using a frozen snapshot and positive technical-role controls, before adding coverage.** This improves the actual feed, aligns the approved scope with behavior, and yields a clear interview story about policy boundaries, regression investigation and measured precision without new infrastructure.
