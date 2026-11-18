# Refresh outage mode, November 17

Status: the owner approved the simplified public experience, outage handling, consolidated alerts and publication. Published implementation `c4877a6` and snapshot `3b8e9a3` are production-verified. Preview: http://127.0.0.1:3100/internships.

## Behavior

- Previously published jobs with specific current outage evidence are held internally. Their details and saved IDs remain available, while current results and current totals exclude them. The public board has no availability tabs; saved affected jobs show a small availability note.
- Held jobs show an actual last positive verification time, or explicitly say it is unavailable. A snapshot refresh never invents a verification date or declares a job closed.
- Healthy sources can update independently. Existing inventory guard thresholds still apply to the combined current and evidence-validated held inventory. Policy exclusions, closures, healthy-board absences, conflicting positive evidence and unexplained losses cannot become outage holds.
- Restoration requires positive verification newer than the most recent outage check and less than 24 hours old. Established ID aliases cannot bypass that requirement or count one job in both states.
- The private reconciliation retains the evidence for each held job. Existing provider request budgets, cooldowns and zero-cost architecture remain in place.

## Local measurements

The first real local refresh produced 5,198 current jobs and 617 held jobs, 5,815 tracked altogether. Reconciliation against 5,982 prior jobs: 149 additions and 316 normal removals. Those removals include 34 scope exclusions, 136 pending verification, 16 source unavailable, 129 unresolved and one deduplication, with no confirmed closures. Existing guard thresholds allow some below-threshold unexplained losses; the repair does not claim every omission is resolved.

Of the 617 held jobs, 96 have usable recorded positive verification dates and 521 explicitly have unknown dates. Collection holds are 316 internships and 300 early-career jobs, plus one pre-existing uncategorized job.

A second real local refresh retained all 617 holds and produced 5,200 current jobs, 5,817 tracked. It added four and removed two tracked rows (one unresolved, one deduplicated). Both local refreshes completed without changing guard thresholds. They used existing provider credentials and normal request limits. Generated files are local preview artifacts, not production proof.

## Verification and next step

All 208 tests, lint and the production TypeScript/static export build pass, including outage evidence rejection, timestamp provenance, restoration, saved-job compatibility and alias separation. Desktop and narrow mobile previews pass; mobile has no document overflow. Saved held details and a manually selected application status survive navigation to Applications. Preview test data was removed afterward. No browser warnings or errors were recorded.

The simplified preview shows current results directly with no Current/Awaiting tabs or outage counters on the homepage. Existing saved jobs can still show held details with “Couldn’t recheck availability.” Desktop and 390px mobile checks pass, with no document overflow. Screenshot: `.cache/simple-board-desktop.jpg`.

Expected source degradation is logged as a warning after validated holds and unchanged coverage checks pass. All-source failure, unsafe inventory losses, code errors and publication errors still fail the workflow. The workflow maintains one bot-owned marked incident issue, edits its body without retry comments, and closes it after a fully healthy refresh with no held jobs. Skipped refreshes cannot close the incident using stale diagnostics. Alert creation, repeated update, failure, recovery and missing-report behavior are tested. A degraded but successfully published refresh can remain green while that issue stays open. This does not claim Workday itself has recovered.

The production receipt below supersedes the earlier preview stopping point. Prior Workday 429 observations remain historical evidence of provider throttling, not proof of exhausted credits or storage. No paid tier or new service is proposed.


## Production receipt

- [Run 44215167290](https://github.com/nothenrynguyen/app-expo/actions/runs/44215167290) passed all 208 tests, collection, publication and the incident update. It was a real manual dispatch using the same production workflow as scheduled runs.
- Snapshot `3b8e9a3`, generated `2026-11-18T01:24:12.578Z` (November 17, 5:24 p.m. Pacific), has 5,193 current jobs and 617 internal holds, 5,810 tracked. Both collection guards pass without threshold changes. Sources remain degraded; provider recovery is not asserted.
- Reconciliation from 5,982 prior rows: 152 additions and 324 removals. Diagnoses: zero confirmed closed, 34 scope exclusions, 139 pending verification, 18 source unavailable, 132 unresolved and one deduplication. These omissions are recorded, not declared closed.
- The Vercel commit status confirms deployment success. All four deployed public JSON files match the generated-data commit byte-for-byte. The live browser shows the fresh timestamp and no availability tabs. Screenshot: `.cache/live-refresh-repaired.jpg`.
- [Issue 3](https://github.com/nothenrynguyen/app-expo/issues/3) is the single bot-owned ongoing source-warning incident. Its creation is verified live; retry edits and healthy recovery closure are covered by tests. Genuine failures retain failed-run notifications. Existing historical failure emails remain historical.
- Earlier local generated snapshots are preserved in the named Git stash and `.cache/outage-first`, rather than overwriting newer production observations. Unrelated root-checkout analytics edits remain untouched.

Next: normal hourly refreshes use this behavior automatically. Expected source throttling no longer fails otherwise safe refreshes. Follow the single incident for provider recovery; investigate any new genuine failed run independently.
