# Listing quality audit, October 18, 2026

## Scope and evidence

Read-only audit of the public production snapshot generated October 18 at 9:50 p.m. Pacific (2026-10-19T04:50:09.510Z): 5,757 listings, 2,879 internships and 2,878 full-time jobs. Also inspected the local October 15 snapshot and its quarantine, refresh report and generic link cache. Local diagnostics are older than production and must not be treated as current production diagnostics.

The repeatable tool is `scripts/audit-listing-quality.ts`. Run `npx tsx scripts/audit-listing-quality.ts` for the local snapshot, or pass a downloaded snapshot path. Append `--probe` after the snapshot path for a bounded public-link sample. No refresh or listing-data writes occur. Probe results and downloaded production data for this run were temporarily stored in ignored `.next/quality-audit/` files, which a subsequent production build cleared. The findings below retain the counts and employer evidence. The sample is deliberately diagnostic, not random or representative; it cannot estimate the percentage of all listings that are closed.

## Ranked findings

### 1. Fix false live classifications before expanding coverage

Nineteen employer links were fetched. All returned HTTP 200 and the existing heuristic classified all as live. However, the Apple listing below visibly contains: "Sorry, this role does not exist or is no longer available." The generic checker misses that wording. JavaScript-only Workday shells in the sample also return 200 without proving an open vacancy.

- Apple: Software Engineer, Xcode Intelligence Experience, https://jobs.apple.com/en-us/details/200626941-0836/software-engineer-xcode-intelligence-experience
- Relevant implementation: `lib/listing-health.ts`, `classifyListingResponse`.
- Next action: verify employer-specific closure signals, add focused regression cases, distinguish inconclusive pages from positive evidence of availability. Avoid broad text matching that can mistake navigation or another vacancy's text for closure.
- Do not remove a job based on an old generic cache entry alone. Space Dynamics Laboratory's FPGA internship is marked closed in the local cache, but its current employer page shows a description and application form: https://spacedynamicslaboratory.applytojob.com/apply/SznZA6uzbW/CVS-FPGA-Electrical-Engineer-Intern

### 2. Tighten role relevance and clarify early-career scope

The diagnostic sample includes Alo Yoga's "Seasonal Sales Associate (Part-Time) - City Creek Centre," a store retail role, despite the board's professional early-career positioning. Its current employer page describes store duties and customer service: https://job-boards.greenhouse.io/aloyoga/jobs/6153869004

Some sampled technical roles require prior experience. Amazon's Software Dev Engineer, AWS ECS asks for 1+ years of non-internship professional development and 2+ years building complex software systems: https://www.amazon.jobs/en/jobs/10568315/software-dev-engineer-aws-ecs

This does not establish that every experience requirement should disqualify an early-career job. Next action: exclude clear retail leakage, then define new-grad versus early-career experience boundaries before changing broad eligibility. Preserve valid engineering, business and support coverage.

### 3. Correct screening metrics before featuring a count

`lib/job-summary.ts` sets `screenedOut` to `snapshot.quarantinedCount`. It excludes the separate rejected count and counts candidate records, not unique excluded vacancies. A destination may be quarantined through one source and accepted through another.

In the matching local October 15 snapshot:

- 19,978 candidate records, 5,711 accepted jobs, 11,255 quarantine rows and 2,298 rejected records.
- The 11,255 quarantine rows represent 9,430 unique normalized destinations.
- 1,689 quarantine rows point to destinations also present in that same accepted snapshot.
- 6,271 rows await employer verification; 4,534 fail role classification. The remaining 450 have freshness/closed reasons.
- These numbers cannot be added or subtracted to reconstruct a unique-job funnel because accepted jobs are deduplicated and the earlier-stage counts are records.
- `closedPostingsCaught` counts closed entries across the retained generic cache, not closures newly detected this refresh. The refresh report's `knownClosed` uses the same aggregate.

The production summary reports 11,923 screened out, but production quarantine detail was not available from the public summary. Do not apply the local breakdown to that production number.

Next action: count unique destinations by final disposition, exclude destinations ultimately accepted, distinguish rejection from pending verification, expose reason buckets and a timestamp from the same refresh, and define whether closure counts are current-refresh or retained-cache totals.

### 4. Review duplicates using requisition evidence

No duplicate IDs or normalized application destinations were found in production. Company/title/location matching flags 164 groups with 190 excess rows. This is a review queue, not 190 confirmed duplicates. Separate requisitions can share those fields.

Ryan's Software Development Intern in Plano appears through two Workday boards with requisition variants `R0020822` and `R0020822-1`. BGE has matching roles across `bgeinc` and `bgeinccampus` Greenhouse boards with different IDs. Northrop Grumman examples also have matching titles and locations but distinct requisitions.

Next action: compare requisition identifiers and employer descriptions for a small set before adjusting deduplication. Preserve legitimate openings and keep existing saved-job IDs recoverable.

### 5. Review employer verification false negatives

The older local quarantine contains recognizable employers such as RTX and Northrop Grumman under the unverified-company reason. This indicates a review opportunity, not proof those companies or roles should be automatically admitted. Trusted-source exceptions and naming aliases can create different dispositions across sources.

Next action: rank unique, otherwise eligible destinations not already accepted, review employer aliases and official evidence, then promote only verified employers. Raw quarantine company totals overstate potential new coverage.

## Checks that passed and their limits

Across all 5,757 production rows: zero malformed/non-HTTP application URLs, duplicate IDs, duplicate normalized destinations, current country-policy failures or current freshness-rule failures. This checks consistency with existing rules, not complete accuracy of those rules or live availability of every posting.

Date provenance: 3,001 relative-derived dates, 1,639 first-seen dates, 786 exact dates and 331 date-only values. First seen must not be described as the employer's original posting date. Generic cache coverage is incomplete and older than this production snapshot; authoritative ATS verification may supersede that cache. No full source refresh was performed.

## Homepage recommendation

Add a modest explanation near the listing total, linking to Methodology. Suggested initial wording:

> Focused on early-career roles. Filtered for relevance, location, and employer checks.

After the relevance issue is addressed and metric semantics are repaired, a numeric companion could say "X unique listings excluded in the latest refresh," with a visible date and a breakdown separating out-of-scope, closed and pending verification. Do not call pending verification bad jobs, imply every exclusion is a scam, claim all listings are live-verified, or compare with other boards without evidence. No homepage UI change is part of this audit.

## Recommended sequence

1. Correct closure detection and clear role leakage with focused regression coverage.
2. Repair screening metrics and add the homepage explanation as a locally reviewable UI change.
3. Review duplicate candidates and employer-verification opportunities.
4. Add browser-local hide-reviewed jobs.
5. Complete the backend cost and architecture review before adding resources.

This audit does not change public listings, personal browser records, source restrictions, hosting or analytics. The audit and first remediation tasks are recorded in local commits; nothing has been pushed or deployed.

## First remediation batch, ready for review

Closure detection now reads visible main content, excludes scripts/hidden templates and shared chrome, recognizes the Apple closure wording and treats inconclusive shells/access blocks as unknown. A public Apple-page replay confirmed HTTP 200 now classifies closed. Availability remains heuristic; this does not prove that every listing has been individually verified.

Explicit store-floor titles now return no role tags during ingestion or discovery, including when an older snapshot already carries sales tags. The local October 15 snapshot contains 248 matching retail rows: Alo Yoga 190 and CSC Generation 58. These are local impact counts, not a production removal count. Professional sales, retail analytics and retail software cases remain supported. Records and saved-job identifiers are not rewritten.

Validation: all 64 tests, project lint and production static build passed. Local commits: `420abbd` (closure detection), `f7783ea` (retail filtering). No source refresh, publication or personal-data migration was performed. See [active tasks](ACTIVE_TASKS.md) for approval status and the next batch.
