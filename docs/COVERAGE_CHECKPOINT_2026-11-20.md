# Coverage checkpoint and targeted recovery, November 20

Status: owner-authorized coverage batch `6fa4658` is published to main after all 265 tests, clean types, lint and static export passed. Post-change hosted refresh and resulting live inventory verification remain pending. This is the current checkpoint, not a claim that the November 21 observation date has elapsed.

## Current evidence

- Latest checked snapshot `289d37a`, generated November 20 at 07:20 Pacific: 3,438 internships / 2,362 early-career jobs / 5,800 current unique opportunity identities, plus 621 internal holds. All four live files were verified against that commit in the preceding release.
- Compared with first recovery release `66acfd5` (November 18 23:28 Pacific), current inventory is +201: 353 identities added and 152 absent. Seven absent baseline identities are internally held. Absence is not a confirmed closure diagnosis. The largest addition group is Langan (135), followed by SpaceX (17) and Amazon (10); this is total feed movement, not causal attribution to one adapter.
- All 39 refresh/maintenance workflow attempts checked since the first recovery snapshot succeeded, including short redundant-refresh skips. This supports operational stability, not full Workday recovery.
- Intake: 24,463 candidate rows / 18,886 normalized opportunity identities. Pending backlog: 7,018, including 6,431 employer-identity, 402 availability, 119 application-destination, 54 early-career-evidence and 12 career-page-evidence blockers. These are not counts of jobs safe to publish.
- Twenty-two non-Workday source records are healthy; 58 Workday cooldown records remain. Board diagnostics: 774 healthy / 59 failed, including the obsolete Iterable endpoint and Workday degradation. Existing hourly resolver continues through the licensed Vansh/Dreamwork queue within its unchanged 100-request cap. Do not bypass cooldowns or bulk restore old rows.

## Selected fixes

1. **Iterable migration:** [official careers page](https://iterable.com/careers/) embeds `https://jobs.ashbyhq.com/iterable/embed?version=2`. Current public Ashby board succeeds with 19 listed jobs; old Greenhouse API returns 404. Pin Ashby and retire only `greenhouse:iterable`, using the existing reviewed retirement mechanism. Do not rewrite old job URLs or transfer live evidence across systems. Its one pilot early-career candidate is in Australia, so this fix does not promise eligible additions; it removes a verified stale source failure and keeps future supported roles discoverable.
2. **Narrow role classification:** recognize explicit student compiler functions, HBM architecture, LLM inference architecture/acceleration, robot perception and corporate strategy, plus inverted data-analyst titles such as "Analyst, Data and Insights." These map to existing categories. No bare-AI admission, seniority waiver or location change.
3. **Evidence-based pilot:** seven existing employer boards plus Iterable's official careers page were fetched read-only, without changing ingestion state. Six current employer postings, absent from current inventory and previously unclassified, now match supported roles and location: three Samsung internships, Arcesium Corporate Strategy Intern, NYT Analyst/Data and Insights, and Lila Robot Perception co-op. Current board evidence satisfies the unchanged employer-evidence path. Full hosted screening still decides publication.
4. **Keep stale and unrelated leads excluded:** the old NYT ML Scientist URL redirects to an error board; a Judi feed internship is currently titled AI Solutions Contractor. Clinical, editorial-content, kitchen and ambiguous AI roles are not swept in. Source titles alone do not establish current role or availability.

## Validation and boundaries

- `npm run verify` passes all 265 tests, clean nonincremental types, lint and static export. Four new regression groups cover positive functions, title order, unrelated AI/marketing/legal work and seniority boundaries.
- No public snapshot, quality policy, source license, employer trust registry, cooldown, request cap, paid service or notification setting was changed by this batch. Broader source activation remains subject to existing permission decisions.
- Root analytics edits and old worktree Cloudflare review notes are preserved. Local evidence: `.cache/coverage-checkpoint.json`, `.cache/coverage-role-pilot.json`, `.cache/coverage-release-validation.log`. Employer descriptions are confined to ignored pilot artifacts, not new committed data.
- This batch expands discovery through the current official Iterable board and recovers missed functions from existing sources. It does not double intake. The historical 37,530 unique-intake target remains unmet; normalized identity churn must be accounted for in comparisons.

## Recommended next steps

1. Check the next normal hosted refresh, expected November 20 around 08:17 Pacific, and verify exact recovered identities and all live snapshot files after it completes. The native browser-control attempt stopped before input because it could not reliably determine Chrome's current URL; the session was ended/reset. No manual refresh was dispatched, so pilot leads are not yet claimed as published additions.
2. At the November 21 checkpoint, measure retention of recovered jobs and continued queue progress.
3. Scope the next shared official-employer adapter around the largest unresolved Workday groups, starting with Booz Allen / RTX after exact employer-site and application identity review. Add permitted sources only with measured net unique coverage and unchanged quality checks.
