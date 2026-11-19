# Cybersecurity source pilot, November 18, 2026

## Decision and scope

Within the owner's approved coverage-growth work, enable one MIT-licensed discovery feed: [HackedRico/2027-cyber-jobs](https://github.com/HackedRico/2027-cyber-jobs). Its README describes collection from employer boards; its repository license identifies Copyright (c) 2026 HackedRico. License attribution is recorded in the existing public source-license catalog.

The JSON adapter admits only HTTPS, credential-free, exact Greenhouse, Lever or Ashby listing URLs and explicitly early-career titles. It rejects closed records, invalid/future dates, generic seniority labels and unsupported application routes. The source is not trusted coverage and receives no Workday fallback. Mandatory live-listing verification, employer identity, location, experience, role, compensation and normal freshness checks remain in force. `date_added` is first-seen evidence, never an employer posting date. Existing ATS board selection/request caps are unchanged; discovery can add public employer boards within those caps. Maintenance counts use the same parser.

## Nonpublishing measurement

Measured against snapshot `4d000a2` and the live feed dated November 19 UTC (November 18 Pacific): 538 total records, 411 open, 32 supported explicit early-career candidates from 20 boards, including 21 internships. Of those 32, 19 already appear in the public board. Nineteen employer board requests succeeded; Palantir timed out. Twenty-seven candidates matched exact current employer-board identities. Eleven live candidates were absent from the public board, which is not proof of eleven additions.

All 19 pre-existing active source feeds were also fetched without failures, yielding 15,984 distinct opportunity identities before ATS expansion and other enrichment. Twelve pilot URLs were absent from those feed rows; ten matched live employer records. These are feed-level differences, not net-new final intake: existing direct ATS expansion can already discover them. Five boards are absent from the historical registry: Tines, ExtraHop, Delinea, Prophet Security and TRM Labs. Lever board IDs include their API host; Palantir and Saviynt are already known boards and are not counted as new.

GlobalFoundries research found a corporate-linked public Eightfold careers site, but requisition search was inconclusive. No GlobalFoundries verification change is included. ResuMax was not selected because its application routes pass through its own resume service. Existing exclusions remain unchanged.

## Validation and publication

All 239 tests, lint, production build and TypeScript checks pass locally. Three new regression tests cover provenance, title-based eligibility, closure precedence, exact direct routes, malformed records and dates. Publication and a guard-passing production refresh are pending. Starting public counts: 3,413 internships, 2,089 early-career jobs, 5,502 total, 622 internal holds. Record actual additions and source attribution after the refresh; do not attribute ordinary turnover to this pilot. The doubling goal and broader Workday recovery remain open.
