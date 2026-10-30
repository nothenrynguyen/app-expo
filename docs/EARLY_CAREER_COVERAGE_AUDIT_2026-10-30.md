# Early-career coverage and eligibility, October 30

## Scope and baseline

The owner approved audit, a focused evidence-backed repair, tests, commit, push
and production verification as one milestone. Preserve zero-cost operation,
source permissions, current safeguards and unrelated work. No universal
experience ceiling, new infrastructure, unreviewed feed or employer expansion.

Frozen baseline: commit `67fe695`, generated October 30 at 4:22 p.m. Pacific.
There are 6,665 unique openings: 4,095 internships across 846 displayed employer
names and 2,570 early-career full-time roles across 442 displayed employer names.
Name variants are not proof of distinct legal employers. Source and role-tag
credits overlap and must not be summed as unique jobs. See the [controlled
measurement](early-career-coverage-controlled-result.json) for provenance.

The catalog has 19 active discovery feeds: 14 internship/seasonal and five
new-grad feeds, plus the separate federal lane and direct employer collection.
This is a discovery bias, not a market ratio. Early-career is a subset of full-time
employment; the current board is not a census of vacancies. We have no defensible
market-wide recall percentage or target internship-to-early-career ratio.

## Current implementation and evidence

A purposive sample attempted 24 existing employer boards: six Greenhouse, twelve
Lever and six Ashby. Twenty-two returned 9,822 records; the two failed Lever boards
returned 404. Those failures do not establish closure of individual jobs. The
sample covers software/data, physical engineering, IT/security, business, finance
and support employers, but is not random or representative of the whole market.
All original responses stay in the ignored local capture directory, not public
snapshots. Per-response hashes support repeated offline comparisons.

Actual bugs:

1. Lever parsing ignored structured `lists` sections containing requirements.
   Generic titles could miss qualifying evidence, including Veeva QA/product
   roles, Agile Defense software roles and Analytic Partners support analysis.
2. A minor low-experience skill requirement could admit a generic-title posting
   despite clearly higher mandatory qualifications. Reviewed examples include
   1Password enterprise sales, Ramp financial-crimes compliance, Accenture data
   engineering and Anduril/SpaceX technical roles. Requirements are factual
   paraphrases in this review; full employer descriptions are not republished.
3. The text `this is not an entry-level position` could itself supply an
   entry-level keyword. Two Veeva technical product-manager leads exposed this.

Operational limitations and coverage gaps:

- Employer/source holds, unsupported hiring systems, conservative role and
  location rules, and unresolved availability still limit coverage. Their absence
  is not evidence of closure or poor job quality. The frozen report's absent
  leads are not automatic additions: some were never eligible, some may have
  changed since the baseline, and full source/deduplication gates still apply.
- Current early-career title signals remain heuristic. Named junior/graduate/
  internship roles are preserved by this focused description-evidence repair.
  Unknown experience and ambiguous degree alternatives are not auto-excluded.
- Workday's bounded searches and title prefilter can miss generic titles whose
  eligibility is only in the detailed qualifications. Expanding those checks
  requires a measured request-budget and coverage review, not unbounded fetching.

## Focused implementation

- Read Lever's structured qualification lists and retain headings while decoding
  HTML and whitespace. No descriptions are added to public JSON or recovery state.
- For generic titles, prevent description-only early-career evidence from
  overriding explicit mandatory experience starting at four years. This follows
  the existing positive zero-to-three-year signals; it is not a universal cap.
  Explicitly non-entry-level statements also defeat the keyword signal.
- Keep preferred requirements separate. Preserve degree-or-experience alternatives,
  ranges beginning below four, and academic research credited toward experience.
  Independent mandatory requirements still apply even if another clause permits
  a degree substitution. Manual review caught and corrected degree/PhD false
  exclusions before release; both are regression cases.
- Carry current exact ATS experience conflicts across feed URL variants and
  last-known-good recovery. Match employer and board, retain live membership,
  explain exclusion as scope rather than falsely calling the vacancy closed.
- Update Methodology and add an offline repeatable audit command. No paid
  service, new source, ID migration, stored description, or relaxed publication
  safeguard is introduced.

## Validation and release

Final frozen adapter comparison: 1,727 accepted candidates before and 1,765 after,
with 65 additions and 27 removals across the successful boards. Nineteen newly
found candidates absent from the baseline pass preliminary location, role,
freshness and employer gates. Twelve removed candidates were previously
published; manual review confirms clear mandatory-experience conflicts for those
rows. All are early-career full-time roles, not internship removals. These counts
are not the complete board impact or guaranteed publication additions.

All 187 tests pass, including four new qualification/adapter/identity regressions.
Lint, TypeScript and static export pass. Production verification is pending.

Local replay: `npx tsx scripts/audit-early-career-coverage.ts .cache/early-career-audit .cache/control-ats-boards.ts`.
The control module is the baseline ATS adapter extracted from `67fe695`, with
relative imports adjusted. Both versions receive identical captured payloads and
clock values with network disabled by a local fetch replacement. The script
checks response hashes. Core-gate passes are preliminary leads, not a full
publication simulation. The real production refresh verifies final acceptance.

## Recommended follow-up

Next measure generic-title jobs skipped by Workday's title prefilter on a small
set of existing, healthy boards, using the current request/time caps. Count
additional eligible openings per extra request before changing collection. Keep
provider cooldowns and positive-evidence expiry intact. A consistent visible
experience label/filter is deferred until evidence quality supports one.
