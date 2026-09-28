# Backend foundations

Updated September 28, 2026 after the ingestion modularization milestone.

## What is reusable

The job-source work is not coupled to static export. Connectors, parsing, normalization, company validation, role classification, freshness rules, deduplication, and last-known-good recovery are plain TypeScript modules. A scheduled script uses them today. A server route, background worker, or queue consumer can use the same modules later.

| Current responsibility | Server-runtime transition | Database transition |
| --- | --- | --- |
| Fetch source and employer-board records | Keep the connector modules | Keep the connector modules |
| Normalize and validate jobs | Keep the validation modules | Keep the validation modules |
| Publish JSON snapshots | Continue during migration | Replace or supplement file writes with repository writes |
| Read public job listings | Continue reading JSON initially | Move the reader to database queries when useful |
| Saved jobs in browser storage | Keep for anonymous visitors | Add an optional account-backed store |
| Hourly workflow | Keep the existing schedule | Point the schedule at the server or worker entry point |

The main migration is at the edges: the command that starts a refresh and the destination that stores its results. The business rules in the middle should remain unchanged.

## Current ingestion boundary

- `lib/ingestion/load-candidates.ts` coordinates community sources, discovered ATS boards, reviewed Workday boards, and employer-record verification.
- `lib/ingestion/refresh-report.ts` produces a typed operational report.
- `lib/ingestion/last-known-good.ts` owns recovery of missing jobs during a source outage.
- `scripts/sync-jobs.ts` validates candidates and publishes the current static snapshots.
- `data/refresh-report.json` records the latest source and board health, request volume, timing, validation outcomes, and recovery counts.

## Safe migration sequence

1. Keep static export while backend modules and tests mature.
2. Choose a feature that truly needs server state.
3. Remove `output: "export"` and deploy with the default Next.js Node runtime.
4. Add a database behind a small repository interface rather than calling it throughout the application.
5. Run JSON publishing and database persistence in parallel until their counts and filters agree.
6. Move reads to the database gradually while retaining the no-sign-up public board.

No UI rewrite is required for this sequence. The existing pages can keep their current props and job shapes while the data reader changes underneath them.
