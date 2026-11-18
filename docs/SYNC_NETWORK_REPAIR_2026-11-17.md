# Intermittent collector crash and audited classification repair

Status: approved repair passes local verification, pending production run and deployment proof. No new source or service is added.

## Failure evidence

Post-outage-repair runs 44236311882 (November 17, 8:17 p.m. Pacific), 44243234806 (9:17 p.m.) and retry 44245551565 (9:37 p.m.) failed during collection. Logs from the first and third show an uncaught assertion in external Undici `Parser.finish`, called from `TLSSocket.onHttpSocketEnd`, on Node 22.23.4. Tests passed before collection. These are real post-repair runtime failures, separate from Workday throttling or coverage holds. The next two hourly runs succeeded, confirming intermittent behavior rather than a universally broken collector.

Cheerio's default module imports the external Undici client even though this project only needs HTML parsing. A shared `lib/html.ts` now uses Cheerio's parsing-only export and explicit parse5 with its existing tree adapter. This retains implicit body/tbody and malformed-HTML repair, while avoiding initialization of the unused network dispatcher. An initial slim-only trial failed the existing closure regression; it was corrected before release by preserving parse5 DOM construction. Existing hidden-content, closure and source-table tests pass. The already-installed parse5 versions are now direct dependencies; no package version upgrade is needed. Collector fetches still use their existing timeouts, budgets and source diagnostics. No global exception swallowing or blanket success is introduced.

A subprocess regression imports all runtime HTML consumers and asserts that no external Undici module initializes. This removes the specific dependency crash path observed in the logs. It is not a claim that all future network/code errors are impossible. Genuine failures still notify; degraded sources retain the single ongoing incident.

## Classification scope

The five official examples from FILTER_COVERAGE_AUDIT_2026-11-17.md replay into supported categories: Samsung architecture research, Samsung generative imaging, Sharp IT/AI, Raft AI/ML and Judi Health AI solutions. Narrow early-career title/description combinations establish AI engineering, data science, IT or business analysis. Bare AI titles and education, social-media, recruiting, sales and marketing contexts cannot gain technical tags through this rule. Seniority checks still run first. Employer, source-permission, location, freshness, closure, strict-source and coverage requirements remain intact.

## Verification and next step

All 214 tests, lint, TypeScript and static export pass locally. No unverified generated local snapshot is staged. Next: publish the scoped repair, run the production workflow, inspect admissions and unchanged guards, verify deployment and all four live data files, then record the actual added-job count. Broader verification backlog and new-source expansion remain separate follow-up work; the unique-intake doubling target stays open.
