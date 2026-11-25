# Coverage iteration C, November 25, 2026

## Current action list

- Complete locally: screen all 18 remaining untracked board suggestions in the previously reviewed discovery configuration.
- Complete locally: independently verify IMC careers and exact European Greenhouse postings, with nine eligible unique candidates.
- Complete locally: narrow IMC route mapping and pin, retaining European employer evidence identity and unchanged eligibility gates.
- Pending: scoped publication and hosted admission measurements for iterations B and C; fresh public snapshot remains blocked by the coverage guard.
- Next: inspect the next real collection, reconcile pilot identities after a guard-passing publication, and measure further employer discovery beyond the exhausted configuration.

## Evidence and decisions

The 18-board survey found nine qualifying missing IMC opportunities. Ten suggestions returned 404; the remaining successful boards overlapped or yielded no missing eligible opportunities. No unproductive or unavailable suggestion was enabled. This survey is independent direct-ATS collection, not import of the mixed upstream discovery feed. Existing exclusions and source permissions remain intact.

IMC's official `https://www.imc.com/us/careers` returns HTTP 200 with the matching Graduate Hardware Engineer title and Greenhouse data. Its exact `https://job-boards.eu.greenhouse.io/imc/jobs/4823805101` page returns HTTP 200 with the matching title and employer branding. The current `boards-api.greenhouse.io/v1/boards/imc/jobs?content=true` response supplies the exact European posting URLs. The existing collector had not discovered that application host. Map only HTTPS `job-boards.eu.greenhouse.io/imc/jobs/<numeric ID>` to the verified IMC board, then pin it. Do not trust other European board tokens or landing pages.

The nine-role local pilot spans graduate hardware, software, machine learning, quantitative research and systems roles in the supported United States/United Kingdom locations. Two are internships and seven are early-career roles. Exact identities and the full 18-board survey are retained in `COVERAGE_PILOT_2026-11-25_C.json`. These are potential additions, not published results. The separate November 25 cohorts now total 98 local candidates (69 + 20 + 9), before hosted reconciliation.

European employer evidence remains `greenhouse:eu:imc`, separate from `greenhouse:us:imc`. Existing opportunity identities and redundant-query handling are unchanged. No current persisted source-target record references IMC's European route, and actual production state passes the current validator. Newly discovered exact targets will use the normal source guard. This avoids repeating the earlier persisted-state compatibility failure.

## Hosted recovery observed during this iteration

The existing 04:37 Pacific scheduler retry is run 45615562613. Its checkout preceded iteration B's publication and loaded the preceding 277-test release, so it does not verify B's new boards or reporting. Types, all 277 tests and collection passed; the unchanged coverage guard rejected 150 unexplained internship removals and 74 early-career removals. Proposed current jobs: 5,810; holds: 648. These proposal counts were not published. Largest unresolved TikTok/ByteDance groups fell to 109/31, from 122/42 in the previous run. Hosted observation commit `675a08e5` is incorporated without discarding local edits.

A cache audit finds 293 positive career-page observations, 288 corresponding to the published inventory and five outside it. The existing renewal lane is already concentrated on recovery. Keep its 25-check cap, 12-hour renewal and 24-hour expiry, rather than changing policy to improve counts.

## Validation

All 281 tests, clean types, lint and static export pass before the final regional identity refinement; the 30 targeted coverage/source-state tests pass afterward, including the European-versus-U.S. identity assertions and current persisted-state validation. No Next.js API, request cap, evidence lifetime, quality gate, notification setting, dependency or automation changes. No publication is claimed until the scoped push and hosted verification are recorded.

## Recommended next list

1. Publish this small verified employer recovery batch, then inspect hosted admissions for B and C.
2. Keep normal verification progress and the coverage guard intact until fresh publication passes.
3. Reconcile all three local cohorts against the accepted snapshot, then compare four production JSON files to canonical Git bytes.
4. Expand independent private-sector employer discovery beyond the exhausted 43-board suggestion pool, measuring unique yield across supported fields.
