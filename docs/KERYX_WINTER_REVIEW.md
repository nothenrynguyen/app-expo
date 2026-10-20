# Keryx Winter 2027 measurement

Measured October 20, 2026. Read-only review approved by the owner. The Winter collection is not activated.

## Result

The [Winter file](https://github.com/GodlyDonuts/keryx/blob/main/internships/winter-2027.md) contains 212 linked table rows. Our existing direct-ATS, early-career, non-software reader returns 53 candidates. Compared with the verified live Spring release after production refresh, containing 6,017 jobs:

| Outcome | Candidates |
| --- | ---: |
| Existing application destination | 20 |
| Duplicate same-semantic/Workday requisition alias within this sample | 2 |
| Possible existing Workday requisition | 1 |
| Remaining destinations needing employer and official-listing review | 30 |

The 30 remaining destinations belong to four employers: Gemini (2), Tevora (8), The Walt Disney Company (1), and RTX (19). Eighteen have Quebec location codes, so the feed is not uniformly US-only despite its collection description. Canada remains supported by our policy, but those rows should not be advertised as added US coverage. The other twelve are potential US leads, not approved additions.

All 30 lack direct approval under the current employer registries in this preliminary measurement. Nineteen share an exact source company label and employer ATS identity with an approved snapshot listing. Shared Greenhouse embed paths do not count as employer-specific identity evidence. This is a triage signal only, not new company approval or a guarantee that the live ingestion coverage rule will admit them. No company trust record was changed.

**Confirmed publication-ready additions: zero at this stage.** We have measured a possible expansion, not completed integration or live validation. See [the sanitized measurement](keryx-winter-measurement.json) for held links and exact counts.

## Boundaries and recommendation

Use this same existing integration if further review is approved. No new service, paid source, signup or broad employer-board crawling is needed. Keep direct ATS, employer, geography, freshness and duplicate rules unchanged. The existing repository license covers the collection under the same reviewed import boundaries; attribution remains required.

Recommended next batch: review these four employer groups and official posting availability, resolve the remaining requisition overlap, then run a local Winter-inclusive refresh and report actual additions before publication. Do not reactivate Jobr or weaken employer checks to turn the 30 leads into a promised count.

Limits: comparison baseline is the verified production Spring release generated at `2026-10-20T21:37:14.617Z`. It avoids counting newly added Spring jobs a second time. This measurement does not model an exact counterfactual refresh. Collection labels can be imprecise; for example, the Disney title omits Winter while its application URL references Spring/Summer. Confirm term details on official postings during admission review. A public source's availability and contents can change.
