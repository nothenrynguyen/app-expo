# Sync recovery repair, October 30, 2026

Owner authorized fixing the sync failure through release and production verification. Existing work and the zero-cost policy are preserved. Implementation is local until the release evidence below is completed.

## Reproduction and cause

Scheduled run 41032364314 failed like the two earlier manual runs: 57 unexplained full-time removals exceeded the unchanged coverage guard. The prior 6,781-listing snapshot remained published. See the [archived blocked diagnostics](listing-report-blocked-production-2026-10-30.json).

- Recovery selects from up to 500 due targets, sorted oldest first. A backlog of unknown/unattempted targets can outrank already-published postings whose positive evidence expires after 24 hours. All 57 missing full-time opportunities in the archived case have recovery seeds; their old positive records share the October 29 `08:27:31.143Z` initialization time. That time aged past publication validity shortly after the last successful snapshot.
- Current, explicitly live Workday posting checks were not used by the employer-verification evidence path. That path recognized recovery observations and Greenhouse/Lever/Ashby board results, but not the Workday equivalent. A healthy board by itself is still insufficient; the fix uses only exact posting-level positive checks and the matching employer.
- Usable Workday boards with degraded outcomes could miss recent-evidence recovery because the recovery policy checked only `status: failed`, even where `outcome` was rate-limited or partial.
- Coverage rejection occurred before retry schedules/recovery attempts were written, and the workflow skipped publishing all state on failure. Repeated runs could therefore reuse the same pre-failure retry state instead of making progress or respecting newly observed cooldowns.

These are identified implementation defects, not evidence that every proposed removal is erroneous or that every provider problem is fixed.

## Repair

- Prioritize published recovery targets, especially those absent from current candidate inputs, within the existing 500-target and 120-second recovery budgets. Reserve 20% for other due targets when available, and reuse spare capacity. No request cap increase.
- Reuse already-fetched, explicit live Workday postings for exact employer/site/requisition matches, avoiding duplicate recovery requests. Bind employer verification to the same positive evidence. Closed/ineligible observations override reuse, and unknown observations cannot create trust.
- Key recovery state by exact opportunity identity. Import a legacy positive only when its candidate proves the same opportunity and employer; preserve host denial cooldowns without granting cross-site trust. Persist factual metadata only, excluding employer descriptions.
- Treat degraded Workday outcomes as affected for continuity, retaining only positive evidence younger than the existing 24-hour expiry. Do not renew its timestamp from an unknown response and never override a terminal observation.
- Retain retry schedules and recovery attempts when coverage blocks publication. The failure path commits only those two operational files, even if unrelated snapshot files were already staged. Accepted continuity and all public snapshots remain behind the coverage gate.
- Use current exact Workday terminal observations in removal reporting even when the closed posting no longer produces a candidate. Board absence and generic recovery HTTP failures still do not establish closure.

## Verification

Regression scenarios cover queue starvation/discovery fairness, exact posting/employer evidence, duplicate-request avoidance, cross-site legacy migration, host denial cooldowns, terminal invalidation, partial board continuity and failure-path commit isolation. Full validation and production results will be recorded here.

Local validation: all 171 tests, full lint, TypeScript and static export pass. A real temporary Git repository test stages a rejected public snapshot, runs the failure-path commit with only the two allowed retry files, and verifies the snapshot is excluded from that commit.

The [frozen queue reproduction](sync-recovery-reproduction.json) selects zero of the 57 affected full-time targets under the old 500-target ordering, versus all 57 with the repair and the same budget. This uses stubbed responses and recorded/approximated candidate presence; it proves queue selection, not present-day posting availability. Production verification must supply fresh evidence rather than treating this simulation as recovered listings.
