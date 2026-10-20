# Keryx Spring 2027 release review

Prepared October 20, 2026 after owner approval to measure the collection, add it locally if useful, and review the additions. Publication was subsequently approved and verified as follows.

Publication follow-up: release 0c3af79 was pushed and deployed successfully. Production refresh [39501464029](https://github.com/nothenrynguyen/app-expo/actions/runs/39501464029) passed, published snapshot 57629bd, and that snapshot's Vercel deployment succeeded. Live generatedAt advanced to `2026-10-20T21:37:14.617Z`: **6,017 jobs and 107 Spring-credited listings**. Sources-page attribution is present. Spring parsed 170 rows successfully during the fresh run. Medtronic returned HTTP 429; 24 of 25 feeds succeeded, with three existing employer-board 404s plus that rate-limited board. No immediate rate-limit retry or policy change was made. See [production receipt](keryx-spring-production-result.json). The original local review follows.

## Result

The existing Keryx reader parsed 169 direct-ATS, early-career, non-software candidates from the Spring file. The refreshed local snapshot admits **107 listings with Spring-source credit**. Of those, **48 are new** compared with the captured production baseline after destination, semantic identity and Workday requisition comparisons. Another 58 already match baseline destinations, and one absent destination has possible semantic/requisition overlap and is excluded from the new count.

New coverage includes mechanical/electrical/civil engineering, manufacturing, supply chain, IT support and finance. Role tags overlap and must not be added together as job counts. Fifty-seven Spring rows remain quarantined for missing employer evidence. No company approvals, source trust or full employer-board expansion were added.

The complete board changes from **5,990 to 6,008 jobs**, a net gain of 18 after ordinary refresh churn. The removal report records 71 added destinations and 53 removed destinations. Do not describe the whole-board difference as the Spring collection's contribution. Twelve federal listings are present after this refresh; that change belongs to the existing USAJOBS integration.

Evidence: [measurement and admitted new jobs](keryx-spring-release-result.json). Baseline generatedAt: `2026-10-20T18:32:42.461Z`. Local generatedAt: `2026-10-20T21:23:59.697Z`.

## Source and cost boundaries

- Added `internships/spring-2027.md` to the existing `GodlyDonuts/keryx` integration, with its existing parser and unchanged eligibility rules.
- Rechecked the repository-wide [MIT license](https://github.com/GodlyDonuts/keryx/blob/main/LICENSE). Existing attribution and license text remain included. The source requires one public feed request, no account, key, payment or new infrastructure.
- Only explicit direct ATS provenance and allowlisted employer application URLs are imported. Aggregator fallback and paid application pages remain excluded.
- Added the owner's paid-service exclusion to COST_POLICY.md and [the exclusion register](SOURCE_EXCLUSIONS.md). Jobr is excluded and must not be reconsidered unless the owner explicitly requests it.

## Future seasons and renamed repositories

Keryx is a [GitHub repository](https://github.com/GodlyDonuts/keryx) with separate season files. Existing weekly maintenance already discovers year-named repositories among configured trusted owners. This local release fills the Keryx-specific gap:

1. Discover dated season/new-grad files within an already configured Keryx repository, from the current year through two years ahead.
2. Check for at least five parseable rows and add new files as **inactive, pending review**, without source trust or employer-board expansion.
3. Follow GitHub-reported repository renames and default branches for raw URLs. Preserve internal source IDs and health history; update ordinary year-based source labels and existing license references when the repository is renamed.
4. Match canonical repository/path pairs to avoid rediscovering the same file after a rename. Refresh the pending-source report during weekly maintenance.

GitHub documents that [repository renames retain stars and redirect repository references](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository). Our maintenance follows repository metadata, not stars. This is bounded discovery within configured owners and repositories, not a search of all GitHub. Unknown file layouts, deleted repositories or reused old names may still need review. Discovery never automatically approves a new collection. Scheduled behavior changes only after publication.

## Validation and limits

- All **80 tests**, lint, TypeScript and static export pass. New tests cover future files, inactive discovery, repository renames, license-reference continuity, repeated discovery without duplicates, and failed/truncated tree responses.
- Snapshot audits: zero invalid URLs, location failures, freshness failures, duplicate IDs or duplicate destinations. Existing ambiguous semantic groups are not automatically removed.
- Exported internship JSON contains all 107 Spring-credited records, with matching snapshot timestamp. Exported Sources HTML includes the collection attribution.
- All **25 feed diagnostics succeeded**. Three existing employer-board 404s remain: Interaction, WhatNot and Atomic Semi. The overall refresh is degraded for those boards. Existing outage/closure handling remains unchanged.
- Interactive browser verification was blocked by the app browser URL policy. An independent local HTTP preview attempt timed out. No interactive rendering or console pass is claimed. The temporary preview helper was stopped. This release changes ingestion and maintenance, with no frontend component edits.
- The jobs passed current pipeline policy. This is not a claim that every posting was independently checked by a person. Current source and board contents can change before production refresh.

## Next actions

1. Complete: owner approved publication and release 0c3af79 deployed.
2. Complete: successful production refresh 39501464029 published snapshot 57629bd; its deployment and advanced live timestamp were verified.
3. Winter measurement complete without activation. Recommended next approval: review its four employer groups and official postings before a local integration refresh. Keep employer holds and the existing duplicate-review queue separate from publication of a new collection.
