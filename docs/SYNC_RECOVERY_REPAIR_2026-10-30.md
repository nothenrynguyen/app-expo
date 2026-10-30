# Sync recovery repair, October 30, 2026

Owner-authorized repair is implemented, pushed and production-verified. Two consecutive repaired refreshes passed the unchanged coverage guard and published byte-matched production snapshots. Existing work and the zero-cost policy are preserved. Earlier local/in-progress notes below record prior stages.

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

## Production completion

Implementation [a07a54b](https://github.com/nothenrynguyen/app-expo/commit/a07a54b44f25d42fc5bc783b2cbd6370b19b8a48) deployed successfully. The [machine-readable receipt](sync-recovery-production-result.json) preserves counts, coverage decisions, hashes and validation scopes for both successful refreshes.

| Evidence | First repaired refresh | Persistent-state verification |
| --- | --- | --- |
| Workflow | [41035629566](https://github.com/nothenrynguyen/app-expo/actions/runs/41035629566) | [41036939685](https://github.com/nothenrynguyen/app-expo/actions/runs/41036939685) |
| Generated snapshot | `274c02c` | `f70e90b` |
| Generated UTC | October 30, `09:51:56.861Z` | October 30, `10:03:00.000Z` |
| Published listings | 6,562 | 6,576 |
| Internships / full-time | 4,018 / 2,544 | 4,028 / 2,548 |
| Recovery requests, cap 500 | 358 | 439 |
| Reused current Workday postings | 291 | 287 |
| Unexplained internship / full-time removals | 5 / 18 | 0 / 0 |

Both workflows passed clean dependency installation and all 171 tests. Both collection and snapshot publication steps succeeded. Vercel reported deployment success for the implementation and both data snapshots. All four deployed public JSON files matched each generated snapshot byte for byte when checked.

The first successful refresh proposed/published 32 additions and 251 removals: 20 scope exclusions, 208 pending verification, 22 cases with relevant unreliable-source evidence and one unresolved case. None was classified as confirmed closure. The repair did not restore every previously published opening or waive verification: unverified and stale material could still leave publication within the existing guard limits.

The second refresh loaded the new cache keys and persisted cooldowns. It published 16 additions and two pending-verification removals (General Motors and Flex), with zero new unexplained removals. This does not retroactively resolve every uncertain omission from the first refresh. Latest health: all 20 discovery feeds healthy; 665 employers, 658 healthy, six cooling down and one unavailable. Recovery remains partial. No access controls or cooldowns were bypassed.

Published-data invariants passed for both snapshots: unique public IDs/opportunities, supported role classifications, deterministic recognized Workday IDs and same-opportunity URL replacements. Compatibility checks cover the retained Workday IDs from each immediate baseline: 2,370 in the first snapshot and 2,398 in the second. The latest exact-key recovery-cache check covered 1,267 Workday positive records; cache presence alone is not a claim that all are publishable or still within their freshness window.

The blocked-run retry-state branch is covered by the real temporary-Git isolation test. It did not need to run in these two successful production workflows, and is not presented as a live failure-path observation. No new infrastructure, dependency, account, billing setting or scheduler change was introduced.

The sync incident is resolved. Continue ordinary scheduled refreshes and use the existing report to investigate remaining holds/provider limitations as evidence becomes available. Do not restore them wholesale or describe them as closed without evidence.
