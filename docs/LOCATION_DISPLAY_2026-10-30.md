# Location display, October 30, 2026

Owner requested implementation and push. Compact board rows, expanded location tooltips and cards omit redundant United States/USA/US country suffixes and standalone country entries when more specific locations exist. State names normalize through the existing location formatter. Remote jobs retain country restrictions, country-only locations remain visible, and Canadian/UK labels remain intact.

The change is presentation-only in `app/job-board/job-board-utils.ts` and `JobResults.tsx`. Source locations, region filters, ingestion and private application records are unchanged.

Validation: 161 tests pass, including the existing display test extended for multi-city lists, country suffixes, hybrid labels, remote/country-only cases and foreign locations. Full lint, TypeScript and static production export pass. The initial export hit a Windows directory permission error; a rerun with filesystem access succeeded.

Published implementation `767d815e685cd6f9cb7ccd8ed64bb910a30ad914`. GitHub's Vercel status reports success for [the deployment](https://vercel.com/henrys-projects-84715f33/app-expo/EGhGZmagkscasRwenfSRds5bkwKN). Live browser verification on the internship board confirmed Astera Labs locations show `San Jose, CA` in compact and card layouts, while the remote C3integratedsolutions opening retains `Remote (United States)`. No console errors were observed. Search and layout were restored after testing; no saved jobs or application records were edited. See [production screenshot](location-display-production-2026-10-30.jpg).

The separately saved [disappearance-reporting plan](LISTING_DISAPPEARANCE_PLAN.md) remains deferred and unimplemented. Its next step is an evidence-based gap review of the existing change report, followed by improvements to unresolved reasons, opportunity totals and tests across every refresh.
