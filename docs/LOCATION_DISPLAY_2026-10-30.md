# Location display, October 30, 2026

Owner requested implementation and push. Compact board rows, expanded location tooltips and cards omit redundant United States/USA/US country suffixes and standalone country entries when more specific locations exist. State names normalize through the existing location formatter. Remote jobs retain country restrictions, country-only locations remain visible, and Canadian/UK labels remain intact.

The change is presentation-only in `app/job-board/job-board-utils.ts` and `JobResults.tsx`. Source locations, region filters, ingestion and private application records are unchanged.

Validation: 161 tests pass, including the existing display test extended for multi-city lists, country suffixes, hybrid labels, remote/country-only cases and foreign locations. Full lint, TypeScript and static production export pass. The initial export hit a Windows directory permission error; a rerun with filesystem access succeeded.

Publication and live browser evidence will be recorded after deployment. The separately saved [disappearance-reporting plan](LISTING_DISAPPEARANCE_PLAN.md) remains deferred and unimplemented.
