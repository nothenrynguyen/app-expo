# Environment and checkout reconciliation, October 27, 2026

## Access checks

- Local repository files and project documentation were readable. The recovery copy and isolated research artifacts confirmed local writes.
- The restricted execution environment could not resolve `empluzzed.fyi` and could not contact GitHub through Git. Execution outside that network restriction retrieved `https://empluzzed.fyi/jobs.json` with HTTP 200 (4,661,518 bytes) and read GitHub successfully with `git ls-remote`.
- The connected GitHub tool independently read remote main at `bf91d9a2e8cb1f1d2cfa8230005571a40f1767a8`. This verifies repository read access, not push permission.

## Preservation and reconciliation

Before mutation, main was one commit ahead and 38 behind the cached remote reference. After fetching, it was one ahead and 66 behind. The local commit `90e6350` changed the refresh separator; the remote included a separate separator fix plus newer analytics, scheduler, employer verification, Updates page, documentation, and snapshot work.

A recovery directory at `C:\Users\Henry\AppData\Local\Temp\app-expo-preserve-20261027-163725` contains the original tracked and non-ignored untracked files, initial status, and an all-reference Git bundle. Ignored local caches and credentials were left in place and were not printed or added to Git. The retained stash is identified by message `preserve-before-2026-10-27-reconciliation`.

The existing local commit was retained and remote main merged into local main as `21cf7862ab8f08487f2d2ca55467c4d7c157d851`. The preserved working changes were reapplied without dropping the stash. Eight overlapping files required resolution: `.gitignore`, `AGENTS.md`, `COST_POLICY.md`, `app/JobBoard.tsx`, `app/SiteHeader.tsx`, `app/globals.css`, `docs/ACTIVE_TASKS.md`, and `package.json`. Resolutions retained newer remote behavior, scheduler restrictions, and tests, plus local Keryx review tracking.

Most formerly uncommitted code already existed in the published remote and consequently no longer appears as a local diff. Five formerly untracked files differed from their new tracked versions: the Updates page, analytics action log, and Worker configuration differed only in trailing blank lines; scoped listing health had newer production data; the employer review had newer release wording and evidence. The newer remote versions were retained, and their original local versions remain in the recovery folder and stash. Unique local source-exclusion and environment-type edits and the Jobbie and Keryx review documents were retained.

No reset, discarded recovery copy, push, deployment, source activation, or trust-policy change was performed. Local main is two commits ahead of the fetched remote because the original local commit and merge commit were retained. Review those commits before any future publication.

## Validation and follow-up

All 112 tests, full ESLint, and the production static-export build passed after reconciliation. The first build hit an EPERM creating a generated output directory under restricted execution; rerunning outside that restriction completed all 14 static pages. The build's generated `next-env.d.ts` change was returned to its preserved pre-review contents. No unresolved Git merge entries remained after resolution. The Keryx scoped review continued against a newly downloaded production baseline, which matched the checked-out remote snapshot after JSON parsing; see [review](KERYX_PENDING_2026_REVIEW.md). Both pending 2026 feeds remain inactive. This local reconciliation and research have not been pushed or deployed.
