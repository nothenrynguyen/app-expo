# Site copy audit, October 29, 2026

Status: local and unpublished. Reviewed all 11 page routes, shared header/footer and analytics controls, job-board states, application controls, backups, and dashboard descriptions. Preserved existing unrelated edits. No ingestion or collection behavior changed in this audit.

## Findings and changes

| Pages | Finding and result | Evidence |
| --- | --- | --- |
| Home, boards, metadata | Apply opens an employer page rather than submitting an application. Replaced “one click to apply” and broad “verified jobs” labels. Counts describe board listings rather than guaranteed available openings. | `app/job-board/JobResults.tsx`, `app/LandingCollections.tsx` |
| About, boards, Methodology | Hourly scheduling is real, but successful hourly publication and individual link checks are not guaranteed. Copy now distinguishes schedule from freshness and mentions temporary data retention. Shortened the six methodology steps and limitations. | `.github/workflows/sync-jobs.yml`, `workers/refresh/wrangler.jsonc`, `lib/ingestion/workday-continuity.ts`, `lib/ingestion/employer-recovery.ts` |
| Methodology | Supported locations and career families match current policy. Screening is not personal employer endorsement or a guarantee of junior experience requirements. | `lib/job-locations.ts`, `lib/role-areas.ts`, `lib/company-quality.ts`, `app/JobBoard.tsx` |
| Sources | Catalog totals include inactive feeds. Added a separate active feed count and the recorded license-review date. Replaced the unconditional “checked every refresh” headline and shortened the introduction. Retained legal notices and attribution. | `data/sources.json`, `data/source-licenses.json`, `lib/ingestion/source-permissions.ts`, pinned board registries |
| Privacy, Applications | Imported saved-job records retain linked statuses, although deletion does not unsave a job. Downloaded backups leave browser storage for a user-selected destination. Corrected these explanations and added hidden-company storage. | `app/applications/ApplicationTracker.tsx`, `ApplicationBackups.tsx`, `lib/applications.ts`, `lib/application-backup.ts`, `lib/hidden-companies.ts` |
| Privacy, analytics | Page allowlist excludes Updates as well as Applications and the dashboard. Retention deletion relies on scheduled cleanup, so removed unconditional expiry wording. Kept identity, payload, withdrawal, provider-processing, and reporting limitations. Shortened the consent prompt. | `lib/activity-contract.ts`, `lib/activity-client.ts`, `lib/analytics.ts`, `workers/activity/src/index.ts`, `workers/activity/wrangler.jsonc` |
| Feedback, contact links | Shortened feedback invitation, linked directly to the supplied LinkedIn profile, removed the unverified Discord launch promise. | Owner-supplied LinkedIn URL; no shipped Discord integration |
| Updates | Retained August through October monthly summaries. History supports initial August launch, September saves/tracker, and October analytics and coverage work. | Git history: August 11 launch, August 12 filters, September 22 saves, September 30 tracker, October 22 activity analytics |
| Owner dashboard | Existing access-key, browser-count, and submission distinctions match implementation. Clarified that cleanup failures can delay removal of daily detail. | `app/analytics/AnalyticsDashboard.tsx`, collector reporting and pruning code |

## Provider verification

Checked official documentation October 29:

- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/): Free recovery history is seven days.
- [Vercel analytics privacy](https://vercel.com/docs/analytics/privacy-policy): request-derived visitor hash and 24-hour visitor session.
- [Vercel analytics pricing](https://vercel.com/docs/analytics/limits-and-pricing): Hobby reporting window is one month; the reporting window is not a deletion deadline. The page differs internally on collection resumption timing, so no exact resumption promise was added.

These checks support the retained provider descriptions, not a legal-compliance certification or a live account configuration audit. Source-license labels describe the recorded review, not a fresh review of every upstream repository.

## Validation and limits

- All 150 existing tests pass, including storage, analytics, classification, coverage and source-permission checks.
- Full ESLint, TypeScript, production static export, and diff whitespace checks pass.
- Checked exported HTML for all 11 page routes: headings exist and targeted stale claims are absent. Shared source-summary layout already supports an automatic grid and two columns on mobile.
- Live `https://empluzzed.fyi/summary.json` could not be reached: local DNS failed and the web tool also could not access it. No current deployment counts, scheduler execution, cleanup success, or live employer availability are certified here.
- Browser visual and interaction testing was not performed in this audit. Earlier analytics-dismissal changes remain local alongside this batch.
- No push or deployment was performed. Next step is owner review of the local copy, then separately authorized publication and live verification.
