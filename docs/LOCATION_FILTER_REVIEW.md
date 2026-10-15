# Location filter review

Reviewed October 15, 2026. Changes are local, with no publication or job refresh.

## Approved scope

Keep jobs nationwide in the United States, Canada, and United Kingdom. Metro selection is an optional search filter. No metro eligibility restriction or activation switch remains.

Country-wide remote jobs in supported countries remain eligible. Bare Remote records without country evidence cannot be confirmed from location text. A job with several stated locations remains eligible when at least one location is supported.

## Corrections

- Foreign cities cannot inherit US eligibility from a contradictory appended country label.
- Board results and metro options recompute location metadata instead of trusting stale snapshot tags.
- Country names remain visible and available during normalization, preserving national remote country evidence.
- Ingestion and last-known-good recovery use the same country rule. Recovery also skips confirmed-closed health records.
- The country filter and methodology now name United Kingdom rather than Europe. Other European countries are excluded.
- UK uses its own region identifier. New insight aggregates recompute country tags; historical aggregates are not rewritten.
- Common domestic name collisions, such as Paris TX, Berlin NJ, Melbourne FL and Vancouver WA, remain US locations. Canadian province abbreviations are recognized.

Text-based classification is not employer verification or geocoding. Unknown or contradictory locations may need additional source correction. Source disappearance alone is not treated as proof of closure.

## Read-only audit

Input: production jobs.json snapshot generated at 2026-10-15T20:41:42.823Z (1:41 PM Pacific), downloaded during the earlier investigation. These counts are from that snapshot, not a new source ingestion or availability check.

| Collection | Before | Country eligible | Excluded or unconfirmed |
| --- | ---: | ---: | ---: |
| Internships | 2,869 | 2,806 | 63 |
| Full-time | 2,762 | 2,690 | 72 |
| Total | 5,631 | 5,496 | 135 |

About 98% remain eligible. The earlier proposal to exclude jobs outside selected metros was removed. Both reported Apple locations fail the country eligibility rule, even if upstream continues to attach incorrect US labels.

Run the audit without contacting sources or publishing data:

```powershell
node --import tsx scripts/audit-job-locations.ts path/to/snapshot.json
```

With no path, the script uses local public/jobs.json, which may be older than production. It only prints a report.

## Validation

Regression coverage includes nationwide US locations, Canadian locations, all four UK nations through explicit country labels, national remote listings, country-name collisions, foreign country exclusions, stale tags, and recovery checks. Tests, lint, and static build are checked before delivery. No generated job snapshots have been changed.
