# Analytics daily charts, November 16, 2026

Owner approved publication after local review. Both charts use a rolling 30 UTC calendar days with full-height hover/focus/click targets, including missing days labeled No data. Visitors, stacked internship/fulltime employer-link openings and monthly totals share a desktop row. Monthly totals shows visitors and clicks only. The seven-day detail panel slides into the left margin without moving charts; limited-width screens use an overlay. Reduced-motion preferences disable the slide.

Openings count repeated employer-link clicks, not completed applications, and exclude private-tracker openings from the board split. The collector derives two daily board counts from existing counters. No schema migration, extra collection, service or billing changes. Development-only fictional preview remains disabled in production.

Validation: all 195 tests, full lint, TypeScript and static export pass. Local screenshots verified chart width/alignment; the owner reviewed the subsequent refinements. Publication and live verification are in progress. Preserve production database, secrets, collection flag, compatibility date and cleanup schedule.

## Frontend publication

Frontend commit `a601835` is pushed to main. Vercel deployment `4VxhF6DWUcbXpvh8wqwtqPXQXmur` succeeded. Public analytics HTML and JavaScript contain the rolling charts and seven-day paging; the development-only fictional preview text is absent. Existing collector health, authenticated all/month report schemas, no-store responses and unauthenticated denial pass without displaying private counts.

## Collector publication completed

The owner explicitly approved reconnecting Cloudflare with persistent Worker and D1 write access. Scoped Wrangler OAuth sign-in succeeded. Uploaded and activated collector version `0cd957d0-242c-4811-976b-2bdaff577b20` at 100% traffic. Compared the previous and new version metadata before activation: every production binding and runtime setting matches, including active collection, DB, secret references and October 22 compatibility date. Trigger deployment was not run, preserving the cleanup schedule; logpush remains false, observability and tail-consumer changes were skipped. No database migration or new service was required.

Authenticated production 30-day reports contain nonnegative integer internship/fulltime daily counts. Their sums exactly reconcile to the existing apply-click board breakdown; the split excludes private-tracker openings. Collection-enabled health, authenticated all/month reports, no-store responses and unauthenticated 401 denial pass. No private analytics values or credentials were displayed. Public dashboard assets still contain rolling-chart and seven-day paging code, with fictional preview text absent. Frontend and collector release are complete; authenticated dashboard rendering was not separately exercised by browser in this release.
