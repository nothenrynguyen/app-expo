# Coverage iteration B, November 25, 2026

## Action list

1. Complete locally: verify Block, Okta and Qualtrics against exact official postings and existing direct ATS responses.
2. Complete locally: 20-opportunity bounded pilot; three productive pins; narrow Talent Operations scope correction.
3. Complete locally: per-board proposal counts that distinguish unique intake, current admissions and new admissions from prior current/held inventory.
4. In progress: full release gate, scoped publication and next normal hosted verification.
5. Open: coverage guard recovery, pilot-to-production reconciliation and wider evidence-backed expansion.

## Decisions and evidence

- Block's direct Greenhouse API emitted HTTP application links. A sampled link redirects 301 to the identical HTTPS employer posting path, which returns 200, matching title and ID, and embeds `boards.greenhouse.io/embed/job_board/js?for=block`. Upgrade only HTTP `block.xyz/careers/jobs/<numeric ID>` links with no credentials or custom port. HTTP links themselves grant no reviewed board evidence. Opportunity IDs remain unchanged by the HTTPS upgrade.
- Okta's exact API URL redirects to its matching titled employer posting and returns 200. Qualtrics' exact URL returns 200 with matching title/ID and employer page metadata identifying Greenhouse. Reviewed mapping is limited to their sampled route shapes and fixed boards, not whole shared hosting domains.
- Pin only these three productive direct boards. Keep qualification, employer, location, role, freshness, availability, deduplication and permission gates unchanged. Do not count candidate rows as published growth.
- The final local pilot is Block 17, Okta 1 and Qualtrics 2: 20 early-career roles, after the same existing eligibility and semantic/opportunity comparisons. Exact identities are in `COVERAGE_PILOT_2026-11-25_B.json`. This cohort is separate from the earlier unpublished 69-role November 25 pilot and the published November 22 cohort.
- GitLab's surveyed Junior Talent Operations Specialist is outside the established People/Legal scope. Add narrow `talent operations?` exclusions to business-operations classification and old-tag filtering. Zero current published titles match that phrase. Software engineers working on talent platforms and ordinary business operations remain supported. No GitLab pin was added.
- Coinbase remains deferred after its employer careers page returned 403. No access-control workaround is introduced. Other unproductive, overlapping or unavailable survey suggestions remain unpinned.

Primary employer evidence: `https://block.xyz/careers/jobs/5428321008`, `https://block.xyz/careers/jobs`, `https://www.okta.com/company/careers/opportunity/8404911`, `https://www.qualtrics.com/careers/us/en/job/8335545`. Exact titles and IDs match current direct Greenhouse APIs. No new community feed is imported; the existing source exclusion register remains unchanged.

## Lightweight reporting

A diagnostic-only direct-ATS table reports unique candidate identities, proposed current admissions and proposed new admissions per board. Duplicate source rows count once. Prior held jobs are not counted as new when restored. Counts are emitted before the coverage guard and retained in both accepted refresh reports and blocked artifacts. The table explicitly labels every number as proposed, never a realized published gain. Non-ATS discovery URLs are not represented as verified employer boards. Table cells are sanitized. No admission branch or guard is changed.

## Validation and release boundary

Focused classification/coverage/source-state checks pass. All 280 tests, clean types, lint and static export pass. Tests cover exact reviewed board routes, narrow HTTP upgrade and adversarial hosts/credentials/ports/landing pages, retained IDs, People/Legal scope and legacy tags, and duplicate/restored admissions. Existing persisted production target validation also passes. Read the installed Next.js project-structure guidance before changing the shared classification utility; no Next.js API or route is changed.

No spending, new automation, account, dependency, broader career scope or notification suppression. The existing scheduler's next normal check is approximately 04:37 Pacific. Its previous invocation and the persisted-state repair are hosted-verified, while the last proposed snapshot was still rejected by the unchanged coverage guard. Local work is not yet a published addition.

## Recommended next list

1. Finish the release gate and publish only this scoped iteration.
2. Inspect the next scheduled run's new per-board admissions and unresolved-removal groups.
3. Verify the first guard-passing publication against all pilot identities and the four deployed JSON files.
4. Continue independently reviewed, productive private-sector employers and exact-link recovery within existing budgets.
