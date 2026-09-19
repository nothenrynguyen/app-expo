# App Expo Roadmap

This is the living list of ideas and future work for App Expo. Update it whenever priorities change, an idea comes up, or a feature ships.

## Current focus

App Expo currently focuses on software and technical early-career jobs, split between internships and full-time roles.

The immediate goal is to make this software job board comprehensive, current, easy to filter, and free of sign-up friction before expanding into additional job families.

## Future job categories

Use role buttons that open the shared job board with the matching role filter already applied. This keeps one consistent list, filter system, and pagination experience.

- [x] Software
- [x] Product management
- [x] Quant
- [x] Finance
- [x] Business analyst

Continue expanding and refining the source coverage behind each role filter while keeping the same direct-application experience.

## Data quality improvements

- [ ] Expand verified company information, including employee-count ranges and direct LinkedIn company profiles
- [ ] Review quarantined companies and promote valid employers into the verified registry
- [x] Expand finance, business analyst, and IT/networking classification for broader business feeds
- [x] Remove internships from completed seasonal terms while preserving graduation-date mentions on full-time roles
- [x] Prefer direct employer applications when the same role also appears through an aggregator
- [ ] Add stronger detection for expired or removed employer listings beyond the current ATS and rotating link checks
- [ ] Continue improving duplicate detection across sources

## Source coverage plan

- [x] Add Dreamwork's daily Business Internships feed for finance, accounting, and analytics coverage
- [x] Add ApplyGuy's Product internships feed using direct employer `listingUrl` values and no full-board ATS expansion
- [x] Add Dreamwork's U.S. new-grad feed without allowing it to expand into unrelated employer-board roles
- [x] Add a curated Hardware role filter for electrical, silicon, FPGA/ASIC, board, and embedded-systems positions
- [ ] Add USAJOBS student and recent-graduate searches for federal finance, analysis, data, and IT roles
- [ ] Enumerate full SmartRecruiters company boards instead of verifying only individual postings
- [ ] Pilot curated Workable employer boards
- [ ] Evaluate CareerOneStop after measuring duplicate rate and destination-link quality

## Job board improvements

- [x] Add role buttons that open prefiltered job-board views
- [ ] Consider state and metro-area location filters
- [ ] Consider role-area filters within software, such as software engineering, data, product design, and security
- [ ] Consider a way to hide jobs a visitor has already reviewed on their current device

## Completed

- [x] Publish source credits, license status, third-party notices, and a zero-cost operating policy
- [x] Separate internship and full-time boards
- [x] Direct employer application links without sign-up gates
- [x] Hourly job refreshes
- [x] Chronological ordering and 100-job pagination
- [x] Multi-select filters for term, workplace, and company tier
- [x] FAANG+ and Fortune 500 company filters
- [x] Responsive job rows and compact filter layouts
- [x] Company screening, unpaid-role rejection, and quarantine workflow
