# Refresh outage mode, November 17

Status: the owner approved the simplified public experience, outage handling, consolidated alerts and publication. Release checks are complete locally; production verification follows publication. Preview: http://127.0.0.1:3100/internships.

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

Next: publish only the scoped implementation and reconciled generated data, then verify a real scheduled run, generated-data commit, deployment and live public JSON before calling production recovered. Prior Workday 429 observations remain historical evidence of provider throttling, not proof of exhausted credits or storage. No paid tier or new service is proposed.
