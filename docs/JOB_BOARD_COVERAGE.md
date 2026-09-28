# Job board coverage report

Updated September 28, 2026 after the role-taxonomy, early-career detection, reviewed-source expansion, and four-employer Workday milestone.

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

## Workday pilot

A reusable Workday connector now fetches reviewed employer boards through their public career-site endpoints. Applied Materials and Micron are the initial pilot employers. The connector searches a bounded set of early-career terms, retrieves current posting details, excludes closed and explicitly part-time roles, and sends accepted records through the existing region, role, freshness, company-quality, and deduplication checks.

The first live refresh produced 67 approved Workday listings, including 62 full-time roles. After cross-source deduplication, the published snapshot grew from 5,183 to 5,239 jobs and full-time coverage grew from 2,131 to 2,199. The Workday listings included 27 full-time Process / Manufacturing matches, 9 Operations / Supply Chain matches, 9 Systems / Test matches, 5 Hardware / Electrical matches, 5 Mechanical matches, and 3 Quality / Reliability matches. Some jobs carry more than one tag.

Both pilot employers returned healthy responses. Workday requests run with lower concurrency and without reused connections because the provider can terminate persistent connections during larger refreshes. This makes the source slower than the existing ATS connectors, but it remains suitable for the hourly background sync and does not affect page-load performance.

## Medical-device expansion

Medtronic and Abbott were added as reviewed Workday employers using targeted quality, reliability, and manufacturing searches. A title-level early-career prefilter reduces their combined detail requests from 225 search matches to 27 likely early-career postings. The final connector results published six jobs from these two boards, including Quality Engineer I roles from both employers, and recorded zero detail failures.

The refreshed snapshot contains 5,249 jobs and 2,209 full-time roles. Materials / Chemical increased from 16 to 24 total listings, including 20 full-time roles. Quality / Reliability increased from 24 to 30 total listings, including 22 full-time roles. Software quality titles remain excluded from physical Quality / Reliability, and software or analytics titles cannot retain a conflicting Materials / Chemical tag after cross-source merging.

Each Workday board now records searched rows, list requests, detail requests, detail failures, retry requests, and duration. Transient timeouts, rate limits, and server failures receive bounded retries, while configuration and permanent client errors still fail immediately. The final validation returned 21 of 21 healthy sources.

## Reviewed official boards

Ten official boards were added to the pinned registry:

- Bandwidth, Iterable, SmartBear, and Twilio for Solutions / Support stability
- Sila and Twelve for process, battery, materials, and chemical engineering coverage
- Olsson and BGE for civil and infrastructure coverage
- Robinhood and ID.me for product coverage

Every board returned a healthy response during the refresh. Some currently publish no qualifying early-career roles, but keeping the reviewed board pinned lets future qualifying postings enter without relying on an upstream aggregator.

Olsson produced the largest immediate gain, with 17 full-time listings and 59 internships. Iterable added a qualifying Technical Support Engineer listing. Robinhood and ID.me provide stable direct coverage for early-career product roles.

## Quality controls added

- Greenhouse, Lever, Ashby, and reviewed Workday descriptions can qualify titles that explicitly ask for 0 to 3 or 1 to 3 years of experience.
- Senior, staff, principal, director, head, lead, and ordinary management roles remain excluded.
- Product Manager can qualify when the listing is explicitly early-career.
- Generic Applications Engineer and prefixed Solutions Engineer titles require customer-facing context.
- Internal recruiting and talent-acquisition Solutions titles are excluded from Solutions / Support.
- Customer-service titles containing “Active Trader” no longer enter Quant.
- Structural engineering roles with bridge, rail, facilities, construction, civil, infrastructure, or industrial context enter Civil / Infrastructure instead of Mechanical.
- Medical-device Quality Engineer titles require physical product, manufacturing, supplier, regulatory, or quality-system context.
- Thin-film, deposition, etch, CMP, metrology, and electrochemistry titles can enter Materials / Chemical, while software and analytics titles are explicitly excluded.
- Stored role tags are sanitized after source merging so a stale or contradictory tag cannot survive deduplication.

## Source-expansion consequences

Pinned boards are fetched directly every refresh and their employers are treated as reviewed companies. This improves stability and freshness, but each addition must therefore be checked before it is trusted. The ten additions use public employer ATS endpoints and do not require credentials, paid access, or changes to the rest of the application.

The main ongoing cost is additional network work during the hourly sync. The Workday pilot adds more requests than the original direct boards because posting descriptions are retrieved individually. The work remains in the background sync, so the board architecture, filters, routes, and page-load performance remain unchanged.

## Verification

- All configured upstream sources were healthy during the final refresh.
- The full automated test suite, lint, type checks, and production build pass.
- Desktop checks covered Solutions / Support, Civil / Infrastructure, and Product internships.
- Search empty states, saved-job toggling, pagination, long locations, filter substitution, and horizontal overflow were checked.
- Responsive styles keep role categories horizontally scrollable and move filters into the mobile filter panel below 620 pixels.

## Next phase

The source-expansion milestone is complete. Further employers should be added only in small reviewed batches supported by the connector diagnostics. The next engineering phase should focus on backend foundations: modular provider orchestration, mocked connector integration tests, a typed refresh report, and an explicit decision about the first server-backed user feature.
