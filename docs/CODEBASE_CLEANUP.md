# Codebase cleanup review

Reviewed October 20, 2026. The owner reviewed the local cleanup and approved commit and push after validation.

## Scope and decisions

Reviewed `app/`, `data/`, `lib/`, and `scripts/`, including their consumers in tests, documentation, package commands and workflows. `CLAUDE.md` delegates to `AGENTS.md`. The installed Next.js static-export and TypeScript guides were consulted. There is no database initialization routine or API route handler in this checkout.

The cleanup removes `matchesRoleArea`, which has no callers, and narrows nine module-local exports. It preserves `classifyRoleArea`, which is used by insights and regression tests. Framework page and layout exports remain entry points even without ordinary imports.

ESLint now excludes ignored research output in `.cache/`, alongside existing build-output exclusions. Tracked scripts remain linted. Strict TypeScript and additional unused-local/parameter checks pass. No compiler strictness relaxation is needed.

## Script lifecycle inventory

All paths below are relative to `scripts/`. Preserve these paths because documentation, workflows or package commands use them. Run commands from the repository root.

| Script | Lifecycle | Inputs and effects |
| --- | --- | --- |
| `sync-jobs.ts` | Recurring operation | `sync:jobs` and hourly workflow; reads catalog, employer registries, previous snapshot and health; makes network requests and writes public snapshots and diagnostics. |
| `maintain-sources.ts` | Recurring operation | `maintain:sources` and daily/weekly/monthly workflow; repository API requests; updates catalog, source health, report and license metadata. |
| `audit-job-locations.ts` | Reusable offline audit | Optional snapshot path, default `public/jobs.json`; prints location-policy results. |
| `audit-listing-quality.ts` | Reusable quality audit | Snapshot, listing health and quarantine; default mode prints cached evidence; inspect optional flags before live verification. |
| `audit-refresh-changes.ts` | Reusable historical comparison | Git refs and current snapshots/diagnostics; default baseline is historical `7ab69a1`; writes `.cache/refresh-audit/comparison.json`. Pass an explicit baseline for new comparisons. |
| `review-requisition-groups.ts` | Reusable duplicate review | Current snapshot; writes `.cache/refresh-audit/`; `--verify` makes official-page requests. |
| `measure-usajobs.ts` | Reusable discovery measurement | `measure:usajobs`; current configuration, credentials and documented cost/access review; network discovery; writes `.cache/usajobs-release/`. |
| `audit-usajobs.ts` | Historical pilot, reproducible | Fixed bounded queries; `--plan` prints requests without fetching; live mode requires USAJOBS credentials and cost-review switch; writes `.next/usajobs-pilot/`. |
| `review-usajobs.ts` | Historical pilot evidence review | `docs/usajobs-expanded-pilot-result.json` and current board; default uses official pages, `--cached` uses ignored page fixtures; writes `.cache/usajobs-pilot/`. |
| `audit-source-candidates.ts` | Historical source research | Fetches production baseline and upstream repositories; local employer registries; writes `.next/source-audit/`. Builds can erase this research output. |
| `measure-self-service-sources.ts` | Historical offline measurement | Requires captured `.cache/batch1/baseline.json` and provider samples; uses current employer registries and policy; writes measurement into the same cache. A fresh checkout cannot reproduce the original sample without those inputs. |

Historical scripts remain useful for evidence reproduction. Their absence from frontend imports does not establish that they are obsolete. No source was enabled and no excluded provider was reconsidered.

## Data file producer/consumer inventory

| `data/` file | Producer or owner | Current consumers |
| --- | --- | --- |
| `sources.json` | Reviewed configuration and source maintenance | Refresh, source parsers, Sources page, research, tests |
| `source-health.json` | Source maintenance | Subsequent maintenance and reporting |
| `source-report.md` | Source maintenance | Human operational report |
| `source-licenses.json` | Reviewed permission evidence and maintenance | Sources page, notices, tests, maintenance |
| `verified-companies.json`, `company-trust.json` | Reviewed employer decisions | Refresh, reviewed-employer coverage, research |
| `pinned-boards.json`, `workday-boards.json` | Reviewed ATS configuration | Candidate loading, Sources page; pinned-board tests |
| `usajobs-config.json` | Reviewed federal discovery configuration | Federal ingestion |
| `company-boards.json` | Job refresh | Operational board diagnostics; intentionally an output, not a frontend dependency |
| `listing-health.json` | Job refresh | Subsequent availability checks/recovery and quality audits |
| `quarantine.json` | Job refresh | Listing-quality and refresh-change audits |
| `refresh-report.json`, `listing-changes.json` | Job refresh | Refresh comparison and operational evidence |

No file is proven orphaned. Generated reports and human review artifacts are retained even when they have no runtime reader.

## Field-level contract review

| Fields | Producer and consumer | Decision |
| --- | --- | --- |
| Public job `id`, `company`, `title`, `term`, `location`, `workMode`, `postedAt`, `postedAtSource`, `applyUrl`, `category` | Normalization/refresh to board, filters, freshness, identity and tracker imports | Preserve |
| `regions`, `metros`, `roleTags` | Location/role policy to board filtering and insights | Preserve; recompute policy from current text where required |
| `linkedInUrl`, `employeeCount`, `salary` | Employer/feed enrichment to job display and links | Preserve |
| `sources` | Refresh and deduplication to provenance, coverage and recovery | Preserve |
| `verifiedCompany` | Refresh marks admitted jobs; persisted public contract | Preserve even without a display predicate; removal requires a snapshot contract decision |
| `federal.retrievedAt`, `closes`, `citizenshipRequired`, `eligibility`, `qualifications` | Fresh federal verification to admission, freshness and eligibility display | Preserve |
| Snapshot `generatedAt`, `jobs`, `quarantinedCount`, `sourceHealth`, `screening` | Refresh to board/summary/insights, diagnostics and recovery | Preserve |
| Candidate `source`, `companyLinkedInUrl`, `h1bApprovals`, `rawText`, `sourceActive` | Adapters to provenance, enrichment, employer review, classification and closure checks | Preserve |
| Catalog `id`, `name`, `kind`, `url`, `repository` | Reviewed configuration to fetching, parser selection, provenance and maintenance | Preserve |
| Catalog `path`, `branch`, `cycle` | Reviewed configuration/maintenance to upstream repository and season tracking | Preserve |
| Catalog `categories`, `expandAtsBoards`, `active`, `trustedCoverage`, `reviewHolds` | Reviewed configuration to parser restrictions, expansion, admission and unresolved-destination holds | Preserve |
| Catalog `trustedOwners` | Reviewed configuration to repository discovery | Preserve |
| Engine input `source` | Previously declared but never read; configured source name supplies provenance | Removed only from internal input type; upstream extra properties remain accepted |

Nested diagnostic records are retained with their typed contracts in `lib/ingestion/types.ts`. Health, license and employer registry fields remain operational evidence. No persisted schema field or browser storage key is removed by this pass.

## Runtime validation boundary

The engine feed previously relied on a type assertion and converted rows outside the timed source failure handler. Malformed rows or invalid dates could abort a refresh instead of producing source diagnostics. `parseEngineJobs` now checks the consumed input shape and conversion happens inside that handler. A malformed feed fails as a unit, allowing existing source failure/recovery rules to run. Unknown upstream fields are accepted. Empty URLs or dates retain the existing candidate-skip behavior.

Regression coverage checks valid and empty feeds, malformed envelopes/rows, invalid dates, wrong optional-field types and invalid timestamp provenance. This is a bounded first validation step. It does not claim runtime validation of every external provider or local JSON file. Future validation work should retain provider-specific failure/recovery semantics and test compatibility against representative input before expanding strict rejection.

## Review boundaries

No public snapshots, data configuration, local storage contracts, backups, source activation, scheduled workflows or dependencies changed. No live refresh was run. Verification uses the existing test suite, whole-repository lint, TypeScript with unused checks, static export and the offline location audit. The owner subsequently approved publication.


## Validation result

- All 83 tests pass, including engine-feed validation regression coverage.
- Whole-repository ESLint passes; `.cache/` evidence remains untouched.
- TypeScript passes with `--noEmit --incremental false --noUnusedLocals --noUnusedParameters`.
- Production static export passes for all routes. Sandboxed attempts encountered Windows `EPERM` creating generated segment directories; the same build passed outside the sandbox.
- Offline location audit accepts all 6,091 jobs with zero unsupported-country jobs and zero unconfirmed US tags.
- Final diff review confirms no changes to `data/`, `public/`, browser storage or backup contracts, package dependencies, or workflows.

The owner approved commit and push after the checks passed. No live refresh or data/configuration change is part of this release.
