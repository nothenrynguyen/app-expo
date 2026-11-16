# Analytics daily charts, November 16, 2026

Owner approved publication after local review. Both charts use a rolling 30 UTC calendar days with full-height hover/focus/click targets, including missing days labeled No data. Visitors, stacked internship/fulltime employer-link openings and monthly totals share a desktop row. Monthly totals shows visitors and clicks only. The seven-day detail panel slides into the left margin without moving charts; limited-width screens use an overlay. Reduced-motion preferences disable the slide.

Openings count repeated employer-link clicks, not completed applications, and exclude private-tracker openings from the board split. The collector derives two daily board counts from existing counters. No schema migration, extra collection, service or billing changes. Development-only fictional preview remains disabled in production.

Validation: all 195 tests, full lint, TypeScript and static export pass. Local screenshots verified chart width/alignment; the owner reviewed the subsequent refinements. Publication and live verification are in progress. Preserve production database, secrets, collection flag, compatibility date and cleanup schedule.

## Frontend publication

Frontend commit `a601835` is pushed to main. Vercel deployment `4VxhF6DWUcbXpvh8wqwtqPXQXmur` succeeded. Public analytics HTML and JavaScript contain the rolling charts and seven-day paging; the development-only fictional preview text is absent. Existing collector health, authenticated all/month report schemas, no-store responses and unauthenticated denial pass without displaying private counts.

Collector publication remains pending. Wrangler has no active sign-in. Automatic approval review rejected creating a persistent Cloudflare OAuth session with Worker and D1 write permissions because that exact access was not explicitly approved. The owner has been asked for this approval; no workaround or collector change was attempted. Until collector publication, applications-opened daily board counts are unavailable rather than estimated. No migration is required. Preserve the existing active flag, database, secrets, runtime date and cleanup schedule when authorized.
