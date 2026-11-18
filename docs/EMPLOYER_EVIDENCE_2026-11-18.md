# Employer evidence and backlog visibility

Owner authorized autonomous evidence-backed implementation and publication, with clear explanations and existing quality, zero-cost and permission boundaries. Implementation b638a2c is published and production-verified with snapshot 3bb0cb5.

## Decisions

1. Correct the exact `usinternshipspubliccareerssite` Greenhouse board's display label to PlayStation (Sony Interactive Entertainment). The official Machine Learning Intern posting explicitly identifies the PlayStation/SIE team and links to PlayStation privacy information: https://job-boards.greenhouse.io/usinternshipspubliccareerssite/jobs/6221769004 . The baseline has 23 current jobs on this board. Match only the exact HTTPS board path on reviewed U.S. Greenhouse hosts, not every Greenhouse job or arbitrary source name. This is a display correction only: candidate names, public-ID generation, source attribution, employer trust and admission stay unchanged, preserving existing saved IDs.

2. Add a narrow Martin Marietta employer approval. The employer's own U.S. careers page links directly to `martinmarietta.wd5.myworkdayjobs.com/Martin_Marietta_Careers`: https://www.martinmarietta.com/careers . Accept only the reviewed host/site job paths, including the known en-US locale form, and explicit early-career titles. Listing availability is still required. All unpaid, location, role, closure, strict-source and fallback-deadline checks stay in place. No unsupported employee count is invented. Five unique held feed URLs were identified before approval; that is a review lead count, not a promised admission count.

3. Add a verification-backlog report grouped by source-supplied employer label. Count exact unique opportunities present in the candidate batch with final pending-verification disposition. Acceptance through any candidate lane wins; confirmed exclusions are omitted. Repeated feed copies do not inflate the report. Store the top 30 employers with explicit units in `data/refresh-report.json`. This is not identical to the screening ledger, which counts application destinations and can include pre-screened rows absent from the candidate batch.

## Decisions to defer

ASML and CACI are legitimate employers, and their own websites establish U.S./early-career activity. The read-only handoff review did not confirm the exact Workday destinations from those primary pages, so no scoped approvals were granted. The known Workday seeds and third-party search results are not sufficient new evidence by themselves. An ASML search result also returned 404 on direct retrieval, reinforcing why stale search snippets cannot establish live vacancies.

No new source, service, paid tier, larger request cap or relaxed quality threshold is introduced. The existing 150 scoped-check and generic-check budgets remain. Snapshot and provider verification are separate from employer identity. Source permissions and strict live-listing policies remain intact.

## Verification

Tests cover reviewed-board scope and hostile lookalikes, display corrections granting no trust, exact employer application scope, early-career and unpaid rejection, and duplicate/accepted/terminal precedence in backlog counts. Full test, lint, TypeScript and static-export results and actual admissions are recorded in the production receipt after release. The overall target of doubling unique intake remains open; this batch improves attribution and evidence gaps within existing intake.


## Production receipt and limits

[Run 44264861485](https://github.com/nothenrynguyen/app-expo/actions/runs/44264861485) passed all 217 tests, collection, publication and the existing incident update. Lint, TypeScript and production static export pass locally. Snapshot `3bb0cb5`, generated `2026-11-18T08:13:34.081Z` (November 18, 12:13 a.m. Pacific), has 5,213 current listings and 620 internal holds. Both collection guards pass unchanged. Deployment status is successful and all four public JSON files match the generated-data commit byte-for-byte.

All 23 current jobs on the reviewed Sony internship board now display PlayStation (Sony Interactive Entertainment), and all 23 retain the exact previous IDs for their application URLs. No Sony employer-trust record was added.

No Martin Marietta job was admitted. Its former company-identity reason is now a listing-availability hold for otherwise eligible candidates. The host's current observation is HTTP 429 with a cooldown until `2026-11-18T20:13:26.682Z`. Further requests were not forced, and strict-source rules were not bypassed. A separate source title contains an invisible character in Infrastructure; it remains a classification review lead rather than being automatically re-admitted. This approval is an evidence correction, not a claim that current availability is verified.

The new backlog reports 7,711 unique pending opportunities present in the candidate batch. Largest source-supplied employer labels: TikTok 127, Booz Allen Hamilton 95, ByteDance 89, Northrop Grumman 87, RTX 72, CACI 70, General Dynamics Mission Systems 69 and Software Technology 66. These are pending leads, not confirmed valid vacancies. Scope and identity review must precede admission. Totals differ from the application-destination ledger by design and should not be combined.

Current job count is unchanged by this batch. Next priorities are targeted evidence reviews for the largest pending groups, exact employer/site aliases and review of the invisible-character title example. Broader new-source expansion and the 37,530-unique-intake target remain open. Normal request budgets, source rights, zero-cost architecture and the seven-day project retention policy remain unchanged.
