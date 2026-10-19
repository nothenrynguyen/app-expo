# Screening metrics

## Contract

`screening.version = 1` measures normalized application destinations, using the existing `jobIdentity` function. It does not claim to count unique vacancies: distinct links or requisitions may refer to one opening.

- `accepted`: destinations accepted before cross-source semantic deduplication, including recovered jobs. Accepted aliases override all rejection or quarantine observations.
- `excluded`: destinations not accepted, with at least one confirmed policy exclusion. Each is counted once.
- `pendingVerification`: destinations only awaiting employer verification, never included in `excluded`.
- `reviewed`: accepted + excluded + pendingVerification. May exceed the published job count because accepted aliases are deduplicated later.
- `uncountedRecords`: observations without a valid normalized destination, omitted from unique totals.
- `reasons`: mutually exclusive exclusion buckets. When multiple source rows disagree, precedence is closed, expired, location, role, employer, then pending verification. Counts reflect the first failed rule per source row; they are not exhaustive findings about every excluded job.

An accepted destination always wins, regardless of observation order. If all sources fail or are empty, metrics are unavailable (`null`). Partial refreshes describe only available sources plus evaluated recovery jobs, not a complete upstream universe.

## Publication and compatibility

Metrics are attached to the job snapshot and included in the refresh report and public summary. A change to screening totals is a material snapshot change. The no-material-change branch still emits the current refresh timestamp in the summary. The existing workflow already tracks and stages all affected generated files.

`summary.screenedOut` now aliases `screening.excluded`; `summary.closedPostingsCaught` aliases `screening.reasons.closed`. They are `null` when unique metrics are unavailable. The UI checks for the new metric version and never relabels legacy quarantine-row totals as unique exclusions. No historical counts are reconstructed.

Legacy `snapshot.quarantinedCount`, quarantine rows, refresh-report raw rejected/quarantined counts, `refreshReport.listings.knownClosed`, and historical insights remain diagnostic fields with their existing meanings. In particular, `knownClosed` and historical `closedPostingsCaught` are retained generic-cache totals, not newly detected closures. They must not supply the homepage exclusion number. Historical insight counters are not migrated by this change.

## Validation

Regression coverage checks cross-source acceptance, canonical tracking-parameter variants, duplicate rows, recovered destinations, reason conflicts, pending verification, invalid links and legacy/null snapshots. Run `npm run verify` for tests, lint and static export. A normal source refresh generates the new metrics; until then, the homepage and Methodology show an honest fallback rather than a guessed count.
