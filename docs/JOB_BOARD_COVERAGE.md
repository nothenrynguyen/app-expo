# Job board coverage report

Updated September 27, 2026 after the role-taxonomy, early-career detection, and reviewed-source expansion work.

## Outcome

The published snapshot increased from 4,298 to 5,183 listings. Full-time coverage increased from 1,294 to 2,131 listings, while internships remained broadly stable at 3,048 listings.

The largest category improvements were:

| Category tag | Before | After | Change |
| --- | ---: | ---: | ---: |
| Software engineering | 2,033 | 2,262 | +229 |
| Operations / supply chain | 153 | 277 | +124 |
| Marketing / sales | 60 | 184 | +124 |
| Mechanical | 72 | 162 | +90 |
| Systems / test | 158 | 236 | +78 |
| Solutions / support | 0 | 73 | +73 |
| Civil / infrastructure | 1 | 69 | +68 |
| Hardware / electrical | 190 | 256 | +66 |
| Process / manufacturing | 61 | 108 | +47 |

Materials / chemical increased from 9 to 16 and quality / reliability increased from 7 to 19. These remain the two clearest engineering coverage gaps.

## Reviewed official boards

Ten official boards were added to the pinned registry:

- Bandwidth, Iterable, SmartBear, and Twilio for Solutions / Support stability
- Sila and Twelve for process, battery, materials, and chemical engineering coverage
- Olsson and BGE for civil and infrastructure coverage
- Robinhood and ID.me for product coverage

Every board returned a healthy response during the refresh. Some currently publish no qualifying early-career roles, but keeping the reviewed board pinned lets future qualifying postings enter without relying on an upstream aggregator.

Olsson produced the largest immediate gain, with 17 full-time listings and 59 internships. Iterable added a qualifying Technical Support Engineer listing. Robinhood and ID.me provide stable direct coverage for early-career product roles.

## Quality controls added

- Greenhouse, Lever, and Ashby descriptions can qualify titles that explicitly ask for 0 to 3 or 1 to 3 years of experience.
- Senior, staff, principal, director, head, lead, and ordinary management roles remain excluded.
- Product Manager can qualify when the listing is explicitly early-career.
- Generic Applications Engineer and prefixed Solutions Engineer titles require customer-facing context.
- Internal recruiting and talent-acquisition Solutions titles are excluded from Solutions / Support.
- Customer-service titles containing “Active Trader” no longer enter Quant.
- Structural engineering roles with bridge, rail, facilities, construction, civil, infrastructure, or industrial context enter Civil / Infrastructure instead of Mechanical.

## Source-expansion consequences

Pinned boards are fetched directly every refresh and their employers are treated as reviewed companies. This improves stability and freshness, but each addition must therefore be checked before it is trusted. The ten additions use public employer ATS endpoints and do not require credentials, paid access, or changes to the rest of the application.

The main ongoing cost is additional network work during the hourly sync. Ten boards are small relative to the existing discovered-board set, so the operational effect is limited. The board architecture, filters, and routes remain unchanged.

## Verification

- All configured upstream sources were healthy during the final refresh.
- The full automated test suite, lint, type checks, and production build pass.
- Desktop checks covered Solutions / Support, Civil / Infrastructure, and Product internships.
- Search empty states, saved-job toggling, pagination, long locations, filter substitution, and horizontal overflow were checked.
- Responsive styles keep role categories horizontally scrollable and move filters into the mobile filter panel below 620 pixels.

## Remaining opportunity

Materials / Chemical and Quality / Reliability still have fewer than 20 listings each. Future expansion should target a small reviewed set of battery, semiconductor materials, chemicals, biotech manufacturing, and quality-engineering employers rather than adding broad aggregators.
