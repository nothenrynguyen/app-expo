# Remembered filters and calendar discovery preview

Status: owner approved publication after reviewing the local preview on November 20. Feature `d5277fd` is published to main and production-verified. All 261 tests, clean types, lint and static export pass. First post-release hosted refresh verification remains pending.

## Decisions

- Keep a single board with All, New today and New this week controls. Pacific calendar days (`America/Los_Angeles`), with Monday starting the week, include daylight saving changes. These are not rolling 24-hour/seven-day windows.
- New means first appearing in a main-branch current Empluzzed snapshot. Keep this separate from employer/source `postedAt`. All retains the existing posting-date order; calendar windows order by first publication. The visible Date column retains its existing source-date meaning.
- Reconstructed first publication from 980 first-parent snapshots, producing 45,369 identity keys. All 5,798 current jobs have historical dates. Git snapshot time is an approximation of publication, not proof of the exact minute a deployment became accessible. A date is never reset by rechecking, temporary holds, duplicate feeds or known ID aliases. Legacy unknown dates are excluded from date windows instead of invented. Holds do not create fresh dates.
- The compact date registry uses IDs and hashed opportunity identities, with timestamps. Refreshes save it only after the unchanged coverage guard passes, alongside the published snapshot. Blocked-run progress does not commit the proposed registry. No source requests, quality rules or request caps changed.
- Remember role/specialty, region, metro, workplace, term, company tier and calendar window separately for Internships and Early Career in this browser. Explicit role links override remembered roles. Search text, saved-only mode, application-status filter, layout and pagination remain transient. Storage failure keeps filtering usable in memory with a visible notice.
- Reset restores board defaults and clears transient search/status filters. It preserves saves, application records/statuses and hidden companies. Preferences do not sync across devices. Privacy copy explains this.
- Focused cleanup is limited to date/filter handling and navigation pagination. No broad rewrite, new account service or paid dependency.

## Validation

- `npm run verify`: 261 tests pass, including seven new calendar, storage parsing, identity continuity, blocked-plan isolation and composed-filter regressions; clean type checking, lint and static production export pass.
- First restricted run could not access temporary local Git test repositories. Complete rerun with required local access passed. Initial build could not resolve dependencies through a cross-worktree junction; an isolated local dependency copy fixed the environment, without product configuration changes.
- Local metadata migration leaves 3,434 internships and 2,364 early-career jobs unchanged. Deep comparison against HEAD after removing only `firstPublishedAt` verifies no other snapshot changes. No network ingestion was run.
- Browser: date window and Engineering role survive reload/bare board navigation; All Roles explicitly overrides the saved role; boards keep separate windows. Reset preserves a test save, which was then removed. Existing mobile filter dialog opens/closes. Desktop 1440x900 has no horizontal page overflow; mobile 390x844 controls fit. Browser control ended and viewport override reset.
- At the saved Nov 20 06:20 Pacific snapshot and default US filter: 5 internships new today, 433 this week; 325 early-career jobs this week. These are preview observations, not current production metrics or claims of new coverage gained by this feature.
- Preview: http://localhost:3002/internships. Screenshots and verification log are local ignored artifacts under `.cache/`.

## Recommended next steps

1. Verify the first normal hosted refresh preserves historical dates and passes the publication guard.
2. Confirm its resulting snapshot and deployment match production.
3. Verify live UI and the first normal refresh preserve dates/IDs; continue the November 21 coverage checkpoint. This feature improves discovery and does not resolve remaining Workday cooldowns, Iterable failures or the unmet intake-doubling goal.

## Published release evidence

- Approved commit [d5277fd](https://github.com/nothenrynguyen/app-expo/commit/d5277fd) was pushed over unchanged main `8a79737`. No unrelated root analytics or old worktree Cloudflare edits were included.
- GitHub's Vercel status reports success: [production deployment](https://vercel.com/henrys-projects-84715f33/app-expo/7vRYWHx53fL6QpxEMiP21q4fxXKj), project app-expo, team henrys-projects-84715f33.
- Production domain is [empluzzed.fyi](https://empluzzed.fyi/internships). All four public JSON files byte-match committed `d5277fd`. Comparison uses committed blobs, avoiding Windows checkout CRLF differences.
- Live Internships: New today selects 5 US roles and survives reload; New this week selects 433. Live Early Career starts independently at All and selects 325 US roles this week. Test preferences were reset afterwards. Production desktop/mobile screenshots are retained locally; browser control ended and viewport override was reset.
- November release description names the new controls and remembered filters, and measures exactly two desktop lines (51px at 25.5px line height).
- The connected Vercel account did not list this project, so deployment verification used GitHub's Vercel status plus the actual production domain. A credential-helper API status script was rejected by automatic approval review and never executed; verification continued through connected tools. GitHub browser was signed out, so no manual dispatch was attempted. The normal hourly refresh remains scheduled.
