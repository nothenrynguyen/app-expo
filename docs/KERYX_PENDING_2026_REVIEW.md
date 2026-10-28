# Pending Keryx 2026 feeds: review

Reviewed October 28, 2026. New Grad 2026 was published with positive-availability safeguards and production-verified; Fall remains inactive. The production receipt below supersedes the historical decisions and local-only handoffs above it.

## Scope and source evidence

The production source catalog lists Fall 2026 internships and 2026 new-grad as inactive pending review. Existing Keryx Spring, Summer, Winter, and New Grad 2027 feeds are active. The source report's "failed" label for the inactive entries is a default when no health record exists, not proof of a failed fetch.

The current upstream repository LICENSE is MIT (blob 1bb8c49656234ba024d2fd850e90d9026a2a5405); preserve its existing attribution and notices. At review time upstream Fall 2026 file blob 28ba9038558b1b4f12a7f6299dff05d45af055ce reported 393 roles; new-grad 2026 blob a78567d1f196f2806bc6cff6ce37718871b74a2c reported 1,907 roles. Those are upstream claims, not empluzzed-eligible jobs or verified open counts.

## Preliminary parser and screening measurement

Using the local Keryx parser and current local company registries, sampled source rows with explicit supported direct ATS provenance were parsed and screened against the local October 22 snapshot (6,214 jobs). Upstream rows were prefiltered on the parser's direct-provenance and destination-host requirements; academic and source metadata fields not used by the parser were removed. Sequential counts below exclude rows at the first applicable stage. They are not estimates against current production.

| Feed | Parsed | Unique destinations | Freshness rejected | Exact URL matches | Potential unmatched, approved company | Potential unmatched, company quarantine |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Fall 2026 | 35 | 34 | 4 | 5 | 4 | 21 |
| New Grad 2026 | 14 | 14 | 0 | 9 | 1 | 4 |

No location failures or semantic matches were found in this preliminary sequence. Matching uses the old snapshot; local trust data differs from the remote production state. Unmatched and company-approved do not mean new, live, eligible, or publishable. This is not a full refresh and does not measure all holds, source changes, availability, or downstream filters. The production JSON snapshot could not be retrieved through the available connector because it exceeds the response transport; local network access is restricted.

## Employer destination sample

- Burgess & Niple Traffic Civil Engineer Co-Op: an employer Greenhouse page was retrievable, with an Apply form and availability spanning Fall 2026, Spring 2027, and Summer 2027. The retrieval was a cached web result, not a live confirmation at review time. The local preliminary company screen held it.
- AMT Engineering Entry Level Transportation Engineer: an employer Lever page described an entry-level position for December 2026 graduates, with an Apply link. The retrieval was cached, and the local preliminary company screen held it.
- Cerebras Ashby returned a JavaScript shell in the web tool, and AECOM SmartRecruiters was inaccessible through that tool. Neither result proves the job is closed.

## Recommendation and next steps

Keep both feeds pending for now. Their source files can contain useful opportunities, but the expected incremental value and final availability cannot be established from an old baseline and preliminary screening. A production-equivalent controlled comparison and direct employer checks are needed before an activation decision.

For future seasons, recommend scoped automatic discovery as currently implemented, plus review before activation until source-specific license continuity, format, direct ATS admission, quality, and hold behavior can be verified. A possible future improvement is automatic activation only for new files within an explicitly approved repository and constrained filename patterns, with independent validation and fail-closed safeguards. This is a proposal, not an approved or implemented policy.

Rocket Lab scoped employer verification was separately published and production-verified; it does not resolve these seasonal feed decisions. Do not activate feeds or change policy based on this preliminary review.

## Live-baseline follow-up, October 27

The environment check recovered network access through execution outside the restricted network environment. The public snapshot returned HTTP 200, and GitHub access worked through both Git and the connected GitHub tool. The checkout was reconciled with remote commit `bf91d9a2e8cb1f1d2cfa8230005571a40f1767a8` before review. See [environment and checkout receipt](ENVIRONMENT_RECONCILIATION_2026-10-27.md).

The baseline was downloaded from `https://empluzzed.fyi/jobs.json`, generated at `2026-10-27T23:20:26.706Z`, with 5,807 jobs. Screening started at `2026-10-27T23:39:14.223Z`. Complete raw upstream files were passed to the unmodified production `parseKeryxSource`, without prefiltering or removing academic/source metadata. Both files still reported 393 and 1,907 source rows respectively. MIT license content was retrieved again. The [machine-readable receipt](keryx-pending-2026-result.json) records file SHA-256 hashes, screening decisions, destination URLs, and employer evidence.

Sequential counts exclude a destination at its first applicable stage: shared source-review hold, location, role, freshness, exact baseline URL, semantic baseline match, then full company decision with title and destination URL. There were no hold, location, role, or semantic exclusions in this scoped pass. Company approvals below do not include reviewed-coverage inheritance.

| Feed | Parsed | Unique destinations | Freshness excluded | Exact baseline matches | Unmatched company approved | Unmatched company quarantined |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Fall 2026 | 35 | 34 | 4 | 4 | 4 | 22 |
| New Grad 2026 | 14 | 14 | 0 | 9 | 1 | 4 |

All 31 unmatched destinations received employer checks, including quarantined companies. Greenhouse, Lever and Ashby used current authoritative board membership. Other destinations used employer-page classification; Workday shells were then followed with job-specific JSON detail checks. A positive Workday check requires a title and both `posted` and `canApply` true. Access denial stays unknown.

- Fall: 12 destinations had positive availability evidence, 11 remained unknown, two employer pages showed closure, and one destination was absent from a successfully fetched authoritative board. All 12 positive destinations remained company-quarantined in this direct company screen. All four company-approved unmatched destinations, two RTX and two Disney listings, returned 403 on Workday details and remain unknown.
- New Grad: four destinations had positive evidence and one employer page showed closure. NVIDIA ASIC Design Verification Engineer, requisition `JR2010391`, was the only unmatched direct-company-approved candidate and returned positive employer detail evidence. Cerebras, AMT Engineering and GlobalFoundries were also live but remained company-quarantined in this screen. AECOM returned visible closure evidence.

These are point-in-time scoped measurements, not net additions from a full refresh. They do not reproduce the complete candidate load, reviewed employer coverage inheritance, SmartRecruiters enrichment, cross-source deduplication, availability cache scheduling, or last-known-good recovery. Exact baseline matches were not rechecked in this audit. No full production-equivalent control/trial refresh was run, so the old production-comparison blocker has narrowed from snapshot access to completing that controlled experiment.

Recommendation: retain both inactive source records. Fall has no newly unmatched candidate with both direct company approval and positive availability in this pass. New Grad has one promising verified-open candidate, but that alone does not establish full-feed incremental value or authorize activation. Next, run isolated control/trial refreshes with identical frozen inputs and current production policy, accounting for shared holds, inherited coverage, and recovery. Review the resulting delta before proposing an activation decision. No trust, source, hold, or publication policy changed in this review.

## Completed controlled comparison, approved steps 1-4

The owner approved checkout review, isolated comparison preparation, complete control/Fall/New Grad runs, and difference auditing. Those four steps are complete. No activation decision or implementation was performed. The [controlled result receipt](keryx-2026-controlled-result.json) contains input hashes, source health, screening counts, every addition and its employer audit. Earlier scoped counts above are historical and are not the complete pipeline yield.

### Isolation and method

- Verified the retained Git bundle, stash `1cf1231dc865e1edb9516133189e5660e6ec5da6`, and original recovery files. Local main remains two commits ahead, but `git diff origin/main HEAD` is empty: the retained separator commit and merge do not add a file difference beyond the fetched remote. Remaining uncommitted reviews, exclusions and generated environment-type changes were preserved.
- Copied the unmodified ingestion code and initial data into isolated directories under `.cache/keryx-controlled/`. The real catalog, company records, holds and public snapshots were not changed. All 74 copied code/data input files still match their original hashes.
- Used the 5,807-job production baseline generated at `2026-10-27T23:20:26.706Z`, with Date construction fixed at `2026-10-27T23:52:43.501Z`. Runtime timeout clocks were retained. The only catalog difference between trials is enabling the selected pending feed in that isolated copy.
- Recorded shared public responses, including all four Workday boards, authenticated USAJOBS discovery, employer enrichment and listing checks. Authentication headers were not stored. Different availability-check queues required 30 additional responses beyond the initial 1,641. Final cache: 1,671 distinct request records, identified by an aggregate manifest hash in the receipt.
- Restarted each final run from identical initial files and replayed cached responses with live network access disabled. All three completed successfully with zero missing inputs. Recorded timeout categories were preserved so production retry handling still ran. The same recorded failure is returned on replayed retries; this is a controlled comparison, not evidence that a later live retry would fail.

### Complete pipeline results

| Run | Accepted jobs | Added versus control | Removed versus control | Published shared-held destinations |
| --- | ---: | ---: | ---: | ---: |
| Current active sources | 5,802 | 0 | 0 | 0 |
| Current sources plus Fall 2026 | 5,819 | 17 | 0 | 0 |
| Current sources plus New Grad 2026 | 5,804 | 2 | 0 | 0 |

All configured sources were healthy: 26 in control and 27 in each trial. Each run had the same three board failures: an Anduril timeout and WhatNot/Old Mission 404 responses. All four Workday boards completed without being disabled. The reports are degraded, with last-known-good recovery running under the existing policy. These controlled counts are not current production counts or an unconditional forecast for activation.

All 19 additions are absent from both the control and the initial production baseline, pass the existing location policy, and have no semantic or Workday-requisition identity match against control. The higher yield than the scoped company screen is explained by existing reviewed employer coverage inheritance. Neither feed enables ATS board expansion; additions came from the admitted feed destinations. No existing accepted job was removed in either trial.

### Audit of every addition

**Fall: 17 additions.** Six have positive employer evidence: Applied Materials, Itron, Louisiana Blue, Micron's Realtime Defect Analysis internship, Bosch, and Western Digital. Eleven Workday destinations returned 403 and remain unknown, not closed: Northrop Grumman, two RTX listings, two Disney listings, five other Micron listings, and Johnson & Johnson. The complete pipeline can currently accept such unknown destinations when other policy checks pass, so accepted does not mean independently verified open.

Itron (`JR102930`) and Louisiana Blue (`R12127`) explicitly report `Part time` in employer detail. The existing Workday normalizer rejects both, while the Keryx admission path accepts their source rows. This route inconsistency needs an explicit decision before implementation. Applied Materials and Western Digital are doctoral internships. The RTX technician URL identifies SkillBridge, but its employer details were blocked, so its military-transition eligibility remains unresolved. No policy or shared hold was added in this research-only batch.

**New Grad: two additions.** NVIDIA `JR2010391` and GlobalFoundries `JR-2501678` both returned a job title with `posted` and `canApply` true; normalized employer locations remain eligible. NVIDIA passes the direct company record; GlobalFoundries relies on existing reviewed coverage. GlobalFoundries requires a master's or PhD, not necessarily a bachelor's new graduate. Its URL slug contains 2025, but its current employer title says 2026, so there is no confirmed source/employer title-year mismatch. These degree requirements are applicant-facing limitations, not newly introduced exclusion rules.

### Handoff after credit reset

Completed: steps 1-4. Both real 2026 source records remain inactive. No application code, trust policy, holds, source activation, commit, push or deployment changed. Only review receipts and project status documentation were added or updated; isolated run artifacts are ignored local files.

Next approval can cover the previously proposed steps 5-7: decide separately whether each feed should activate, implement only the approved outcome and safeguards, validate it, and prepare coherent commits while keeping unrelated local work separate. Before proposing Fall activation, resolve the 11 unknown destinations, part-time admission inconsistency and SkillBridge eligibility. For New Grad, review both confirmed-open additions and whether the master's/PhD role fits the intended collection. Refresh time-sensitive employer evidence before any later release. Pushing and deploying still require separate approval.

Continuation artifacts: `.cache/keryx-controlled/manifest.json`, `responses/`, `control/`, `fall/`, `newgrad/`, `comparison.json`, and `delta-audit.json`. Review helpers live in `.cache/keryx-2026-review/`. Keep these and the recovery folder/stash until the outcome is reviewed. The committed-format receipt in `docs/keryx-2026-controlled-result.json` preserves the key findings if ignored caches are later unavailable.

## Step 5 decision, October 27

The owner authorized step 5 separately. This section records the activation recommendation, not authorization to implement or publish it.

| Feed | Decision for the next implementation batch | Reason |
| --- | --- | --- |
| Fall 2026 | Keep inactive and pending. Do not include in the next activation batch. | Of 17 trial additions, 11 lack positive availability evidence; two of the six confirmed-open jobs are explicitly part time and fail the existing Workday normalizer. SkillBridge eligibility is unresolved. Four other positive destinations do not justify activating the unresolved full feed without further work. |
| New Grad 2026 | Recommend activation in step 6, conditional on availability safeguards and validation. | Both incremental destinations have positive employer evidence, eligible US locations, full-time status, and no control duplicate or shared-hold conflict. The controlled run removed no accepted jobs. |

At approximately 5:12 p.m. Pacific on October 27 (`2026-10-28T00:12:49Z`), fresh job-specific employer checks again returned HTTP 200, `posted: true`, `canApply: true`, and `Full time` for NVIDIA `JR2010391` and GlobalFoundries `JR-2501678`. See [step 5 employer recheck receipt](keryx-2026-step5-recheck.json). The controlled yield remains a historical measurement; the complete comparison was not rerun in step 5.

GlobalFoundries' master's-or-PhD requirement is compatible with the existing New Grad collection: `lib/job-collections.ts` categorizes early-career/new-graduate roles without a bachelor's-only restriction. Keep the employer's actual requirement intact; do not introduce a new degree exclusion or describe the role as broadly bachelor's-eligible. Its current employer title confirms 2026 despite the older year in its URL slug. Doctoral internships in Fall are not rejected merely for their degree level; the deferral rests on unresolved availability and inconsistent admission.

### Scope to propose for step 6

- Activate only New Grad 2026 after validation. Keep `trustedCoverage: false` and `expandAtsBoards: false`; preserve direct ATS admission, current company evaluation, reviewed coverage rules, and shared holds. No blanket company approvals or new automatic seasonal activation.
- Require positive, current employer availability evidence for destinations admitted through this newly activated feed. Unknown, blocked, stale or unchecked destinations must remain pending, including through cross-source aliases and recovery. Reuse the existing bounded verification approach where practical; do not silently treat a generic HTTP 200 shell as confirmation or relax global policy.
- Revalidate the resulting accepted delta and existing-job effects after that safeguard is implemented, because the previous trial measured the current pipeline without this additional condition. Recheck the two employer details before a later release; two additions are evidence, not a guaranteed future count.
- Leave Fall inactive. Its unknown destinations, part-time consistency and SkillBridge eligibility can be a separate later review. Do not change the global part-time or degree policy in the New Grad batch.

Step 5 changed only documentation and saved employer recheck evidence. Both actual source records remain inactive. Steps 6 (implementation and validation) and 7 (commits) still need approval. Push and deployment remain separately unapproved. The previously documented historical handoff is retained above; this section is the current next action.

## Step 6 implementation and validation, October 27

The owner authorized step 6. The New Grad 2026 source is enabled **locally**, with `requireLiveListing: true`, `trustedCoverage: false`, and `expandAtsBoards: false`. Fall is unchanged and inactive. No company trust or global degree/part-time rule changed. The public JSON snapshots in the working checkout were not replaced with trial data, and there is no claim of production activation.

### Availability safeguard

- `lib/ingestion/source-verification.ts` remembers destinations admitted through a guarded source. `data/source-verification-targets.json` is seeded with the 14 reviewed destinations, so a failed first fetch cannot erase their known association. It stores URLs and source IDs, not positive availability claims. The hourly workflow includes this file when persisting generated data.
- The same destination guard applies to other feeds, recognized Workday aliases, Greenhouse host aliases, SmartRecruiters title-slug variants, and recovery from the previous snapshot. Remembered membership survives missing/failed/empty source responses, source-attribution changes and automatic source retirement. Invalid persisted target data aborts the refresh rather than disabling protection. Removing the source's verification policy (or catalog record) explicitly retires its membership requirement; changing `active` alone does not.
- Verification shares the existing maximum of 150 checks per refresh, concurrency eight, fair queue and 24-hour positive cache. Unchecked, stale, blocked and negative destinations stay pending. A recorded failure invalidates older positive evidence; fresh positive evidence can be reused within its 24-hour validity. Budget exhaustion does not grant publication.
- Workday requires a title, matching requisition ID, `posted: true` and `canApply: true`. Greenhouse uses authoritative board membership or an exact job-detail endpoint after a board outage. Lever and Ashby use authoritative membership. SmartRecruiters requires explicit active job metadata with a title. Generic HTTP 200 pages and unsupported/unavailable endpoints cannot establish availability.
- The guard is checked before admission from any source and before outage recovery. Guarded unavailable rows cannot establish reviewed employer coverage. Verification diagnostics separately report `source_listing` checks.

### Full pipeline validation

The [step 6 receipt](keryx-2026-step6-result.json) records implementation hashes, complete-run results, verification diagnostics, failures, and every addition/removal. The control and trial reused the earlier frozen provider inputs, supplemented with new detail responses required by the safeguard. Both final replays completed with zero missing inputs.

| Run | Accepted jobs | Added versus control | Removed versus control | Unverified guarded jobs published | Shared-hold leaks |
| --- | ---: | ---: | ---: | ---: | ---: |
| Control, New Grad inactive | 5,802 | 0 | 0 | 0 | 0 |
| New Grad active with safeguard | 5,804 | 2 | 0 | 0 | 0 |
| Simulated outage after successful trial | 5,800 | 0 | 2 | 0 | 0 |

The normal trial added only NVIDIA `JR2010391` and GlobalFoundries `JR-2501678`, preserving all control jobs. Thirteen of the 14 guarded destinations had positive evidence; the closed AECOM destination remained excluded. Existing company eligibility still quarantined other destinations despite positive availability. Full control/trial reports retained the same three historical board failures (Anduril timeout, WhatNot and Old Mission 404s), with all four Workday boards included.

The outage fixture began from the successful trial with persisted destination membership. It injected one feed 503, four guarded employer-detail 403s, and 280 generic HTML 403s, while replaying all remaining inputs with zero missing responses. The four blocked destinations (the two new roles and two previously accepted Anduril roles) did not reappear through other sources or recovery. The fixture removed two jobs relative to control and four relative to the preceding trial. This demonstrates the intended conservative behavior: guarded existing jobs can temporarily disappear when positive evidence expires or becomes unavailable. It is a simulated failure test, not a report of live employer closures or actual production outages.

All 118 automated tests, TypeScript, ESLint and the production build passed. The build initially hit the same restricted-filesystem EPERM during static export; rerunning outside that restriction generated all 14 pages successfully. Generated `next-env.d.ts` changes were returned to the preserved pre-task version. Regression tests cover cached evidence expiry, unchecked budgets, corrupt target state, alias matching, failed-feed persistence, requisition mismatches, authoritative board membership and job-detail fallback.

### Next approval

Step 6 is complete and remains uncommitted. Step 7 can review and commit the coherent implementation, tests, generated target registry, workflow persistence and relevant documentation while excluding unrelated existing work. Do not discard the recovery folder or stash. Push and deployment require separate approval; after any future release, verify the actual refresh and deployed snapshot before describing New Grad as live. Time-sensitive listing availability and source yield can change, so the two additions are not a permanent promise.

Local validation artifacts are under `.cache/keryx-step6/` (control, trial and fault copies/logs) and `.cache/keryx-2026-review/` (tests, lint, build logs and helper scripts). The focused JSON receipt preserves the release-review evidence without requiring a rerun.

## Step 7 local release checkpoint, October 28

The owner authorized continuing with step 7. Review confirmed all nine implementation/test/configuration hashes still match the passing step 6 receipt. No code change or repeated full refresh was needed for this checkpoint. The saved 118-test, lint, TypeScript, static-build and controlled/failure-run results remain the validation evidence; employer availability and live production yield were not rechecked on October 28.

The local milestone commit is titled `Activate Keryx 2026 new-grad feed with availability safeguards`. Its scope includes the source activation, destination registry, shared verification queue integration, recovery protection, workflow persistence, regression tests, and the associated review/reconciliation evidence and project status. It excludes unrelated source-exclusion notes, Jobbie review, and generated environment-type changes. Existing staging for excluded files, the recovery folder and the stash are retained.

No push, workflow dispatch, deployment or production snapshot change was performed. Local main also retains the earlier separator commit and reconciliation merge; they produced no file difference from the fetched remote before this milestone. Before any later push, fetch current remote main and safely reconcile new automation commits without discarding remaining edits. Publication still requires separate approval. After a future release, verify the actual workflow, generated snapshot commit and deployed JSON, including guarded destinations and source attribution; do not treat the frozen trial's two additions as a current production count.

## Production release and verification, October 28

The owner approved publication. Nine newer remote commits contained generated refresh data only; they were merged without conflicts while preserving the remaining staged source-exclusion/environment edits and untracked Jobbie review. All 118 post-merge tests passed. Release commit `acebabd2eb7cd8659305f43b847a07568fee6f67` includes implementation `1223956` and current remote data. The push deployed through the existing GitHub/Vercel integration.

[Manual refresh run 40650482708](https://github.com/nothenrynguyen/app-expo/actions/runs/40650482708) completed successfully, including its tests, and published snapshot commit `7711f2c683cc1203b85bcab45219febffa7e5c60`. Vercel deployment `dpl_8JuU8zkg76Uz7c9tBA2rxeQsJsSn` reached READY for that exact snapshot and assigned `empluzzed.fyi`. At 12:33 a.m. Pacific on October 28, the deployed `jobs.json` matched repository JSON exactly, and `summary.json` had the same generated timestamp (`2026-10-28T07:32:54.116Z`). The first download caught the previous snapshot during the deployment switch; a subsequent comparison passed.

The verified snapshot contains 5,800 jobs, compared with 5,798 in the preceding 07:21 UTC snapshot. The New Grad feed parsed 14 rows and is healthy. Eleven accepted jobs carry its attribution; NVIDIA `JR2010391` and GlobalFoundries `JR-2501678` are absent from that preceding snapshot. These are point-in-time measurements, not permanent source yield guarantees.

Fourteen guarded targets are remembered, 13 have positive evidence, and all 11 published guarded destinations have positive, unexpired evidence. No unverified guarded destination or shared-held destination appears in accepted jobs. Fall remains inactive, with trust and board-expansion restrictions unchanged. The refresh is degraded only by the existing WhatNot and Old Mission 404 board failures, also present before release; no source failed.

See the [machine-readable production receipt](keryx-2026-production-result.json) for timestamps, policy checks, source attribution, verification diagnostics, and deployment identity. The generated snapshot was fast-forwarded locally without disturbing unrelated edits. Both recovery stashes and the original recovery directory are retained. Future follow-up is optional Fall review and observation of normal refresh behavior; neither authorizes changing Fall activation or global degree/part-time policy.
