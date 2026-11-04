# Role navigation release, November 3, 2026

Owner-approved scope: audit, refreshed preview, measured verification, documentation/validation, commit and push to `main`. Save is unchanged. No new source, service, paid infrastructure, category or relaxed eligibility rule was introduced. Automatic deployment may follow the push; production verification is a separate step.

## Final behavior

- Keep All Roles, Software, Data, Engineering, Product / Program, Design, Business, Finance / Quant and IT / Security as the top-level navigation. Marketing / Sales stays under Business.
- Product / Program separates Product Management and Technical Program Management. Nontechnical program management remains under Business.
- Design separates Product / UX / UI Design, UX Research, Graphic / Visual Design and Industrial Design.
- Solutions / Customer Engineering is an Engineering specialty. Support specialists, help desk and internal IT remain under IT / Security. IT / Security has no specialty control.
- Desktop filters stay on one row, including at the narrower desktop breakpoint. Mobile retains its drawer. Existing company-tier behavior remains available.
- Homepage cards say total listings; the accompanying note explains that board counts reflect filters and hidden companies. Open-page snapshot timing can also differ. The exact difference in the supplied screenshots cannot be established without matching timestamps and the three hidden-company identities.

## Matching and compatibility audit

- Technical program titles, including Technical Project/Program Management, are supported without admitting senior titles or conflicting required experience. `You should have` is recognized as a required-qualification heading.
- Managers of internships or L&D programs are not treated as interns or early-career program applicants. Ordinary internship-program titles such as IT Procurement Intern remain eligible.
- Product Design Engineer does not imply UX/product design; ambiguous engineering titles retain General Engineering instead of an invented specialty. FPGA implementation stays hardware. Product-support data science and logistics keep their actual disciplines.
- Current descriptions identifying internal applications work override obsolete customer-engineering tags. Description-based evidence is retained when a public snapshot has no description.
- Keryx's allowed families now include Product / Program and Design. Existing source permission, direct ATS provenance, destination, date and pure-software exclusions remain in force.
- `role=product` remains valid. Former `role=solutions-support` links select the Engineering specialty. Former `role=business&specialty=design` and direct `role=design` links open the full Design family. Job IDs and saved-job storage contracts remain intact.

## Final collection and verification

A normal refresh using the final matching rules followed reconciliation with automated state at `07bee8f`. It completed at 7:41 p.m. Pacific and passed the existing coverage guard. This is a full collection, superseding the earlier isolated replay for release evidence.

| Opportunity movement | Count |
| --- | ---: |
| Reconciled baseline | 6,840 |
| Added | 35 |
| Removed | 15 |
| Final local snapshot | 6,860 |
| Net change | +20 |

Exact employer checks verify 15 newly admitted classification-enabled listings: 9 TPM, 1 combined product/program, 3 design and 2 general program roles under Business. Two ordinary product additions are verified separately. Four other category-related additions lacked positive second-check confirmation and are not included in verified counts; an inconclusive check does not establish closure. Fourteen of the original 15 measured additions remain in this collection; the earlier Northrop Grumman opportunity was not returned and is not counted as currently verified.

Removals are not all closures: zero confirmed closed, two scope exclusions, seven verification holds, one source-unavailable and five unresolved. The normal guards and provider request/cooldown limits were preserved. See [final per-listing results, coverage and file hashes](role-release-verification-2026-11-03.json).

| Final local category inventory | US internships | All-region internships | US early-career full-time | All-region early-career full-time |
| --- | ---: | ---: | ---: | ---: |
| Product / Program | 93 | 101 | 20 | 22 |
| Design | 74 | 79 | 21 | 24 |

These counts reflect current collected inventory, not exhaustive market coverage. Design totals are lower than the earlier preview because Product Design Engineer no longer implies UX/design. The refreshed snapshot is loaded into the local preview. The normal generated public files and operational state travel together in this release.

## Validation and release boundary

All 193 tests, ESLint, TypeScript and production static export pass. Desktop checks at 1,198px and 900px show one filter row without horizontal overflow. At 390px, the drawer opens/closes, UX Research selection updates the URL/count and closes the drawer, and IT / Security has no specialty. Both internship and early-career boards load. The fresh TPM specialty shows five US internships. Save survives reload and Saved-view filtering; the test save was removed and the original zero-saved state restored. Legacy Design and support links pass. Homepage total-count wording is verified in-browser.

Implementation was committed as `0fee320` after rebasing onto automated updates. The final verified snapshot, compatibility correction, release evidence and concise November Updates entry form the final release milestone. The owner authorized pushing this scope; production deployment and live-site verification are not claimed by these local checks. Unrelated November planning and interview notes are preserved separately and excluded from release commits.

Historical comparison: [earlier isolated measurement](role-expansion-measurement-2026-11-03.json) recorded 15 verified classification-enabled additions against two older baselines. Its negative net movement and counts are dated measurements, superseded by the final collection above.
