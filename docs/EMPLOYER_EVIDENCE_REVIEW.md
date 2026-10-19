# Employer evidence review

Reviewed October 18, 2026. This batch resolves missing employer size and U.S. presence evidence for companies already discovered by Keryx. It adds no employer discovery crawlers or board expansion. All job-level eligibility, closure, risk and duplicate checks still apply. Approval concerns the employer admission standard, not an endorsement of the company or guarantee of an open position.

| Employer | Conservative employee floor | U.S. presence evidence | Official source |
| --- | ---: | --- | --- |
| DLR Group | 1,800 | Coast-to-coast U.S. offices | [Firm](https://www.dlrgroup.com/firm/) |
| Olsson | 2,000 | U.S. office directory and coast-to-coast operations | [Our roots](https://www.olsson.com/our-roots) |
| STV | 3,300 | New York flagship and multiple named U.S. offices | [February 2026 update](https://stvinc.com/insight/building-on-momentum-how-our-strategic-plan-positions-stv-for-whats-next/) |
| FOTH | 750 | Green Bay, Wisconsin headquarters | [Locations](https://www.foth.com/about-us/locations/) |

Employee floors reflect official statements checked during this review, not a live headcount. No LinkedIn URL or subsidiary alias is inferred. Existing blocked records are preserved. These four names accounted for 91 of the previous 300 Keryx employer holds; this is a candidate-row count, not a promise of 91 additional unique jobs.

## Next broad source

USAJOBS remains conditional. [Authentication](https://developer.usajobs.gov/guides/authentication) requires an owner-managed API key. The [rate-limit guide](https://developer.usajobs.gov/guides/rate-limiting) does not establish unlimited access. Before activation, verify registration requires no payment method, permitted republication/attribution, request caps and nonbilling behavior at limits. Then run a bounded finance/business pilot and compare unique eligible direct-application destinations with the existing snapshot. No account registration, credentials, service activation or production publication is included here.

## Validation and measured result

All 67 tests, lint and production static export passed. Refresh at 2026-10-19T06:59:44.913Z: 6,080 jobs (previously 6,012), 842 Keryx-linked listings (previously 751), and 209 Keryx employer holds (previously 300). The four reviewed employers have 137 published jobs across sources, previously 69; none remain in the Keryx hold queue. Changes elsewhere in the refresh explain why the total increase differs from the 91 Keryx-linked increase. All 23 feeds were healthy/nonempty; overall status remains degraded due to employer-board diagnostics. Summary totals, unique job IDs and the blocked-company exclusion were checked. See [measured result](employer-evidence-refresh-result.json).

The sandbox-only refresh failed to reach feeds; its generated output was restored before the successful network-enabled run. The static build initially encountered a filesystem permission error, then passed with the required permissions. No failed-refresh output is retained. No push or deployment.
