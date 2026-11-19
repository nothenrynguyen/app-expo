# Cybersecurity source pilot, November 18, 2026

## Decision and scope

Within the owner's approved coverage-growth work, enable one MIT-licensed discovery feed: [HackedRico/2027-cyber-jobs](https://github.com/HackedRico/2027-cyber-jobs). Its README describes collection from employer boards; its repository license identifies Copyright (c) 2026 HackedRico. License attribution is recorded in the existing public source-license catalog.

The JSON adapter admits only HTTPS, credential-free, exact Greenhouse, Lever or Ashby listing URLs and explicitly early-career titles. It rejects closed records, invalid/future dates, generic seniority labels and unsupported application routes. The source is not trusted coverage and receives no Workday fallback. Mandatory live-listing verification, employer identity, location, experience, role, compensation and normal freshness checks remain in force. `date_added` is first-seen evidence, never an employer posting date. Existing ATS board selection/request caps are unchanged; discovery can add public employer boards within those caps. Maintenance counts use the same parser.

## Nonpublishing measurement

Measured against snapshot `4d000a2` and the live feed dated November 19 UTC (November 18 Pacific): 538 total records, 411 open, 32 supported explicit early-career candidates from 20 boards, including 21 internships. Of those 32, 19 already appear in the public board. Nineteen employer board requests succeeded; Palantir timed out. Twenty-seven candidates matched exact current employer-board identities. Eleven live candidates were absent from the public board, which is not proof of eleven additions.

All 19 pre-existing active source feeds were also fetched without failures, yielding 15,984 distinct opportunity identities before ATS expansion and other enrichment. Twelve pilot URLs were absent from those feed rows; ten matched live employer records. These are feed-level differences, not net-new final intake: existing direct ATS expansion can already discover them. Five boards are absent from the historical registry: Tines, ExtraHop, Delinea, Prophet Security and TRM Labs. Lever board IDs include their API host; Palantir and Saviynt are already known boards and are not counted as new.

GlobalFoundries research found a corporate-linked public Eightfold careers site, but requisition search was inconclusive. No GlobalFoundries verification change is included. ResuMax was not selected because its application routes pass through its own resume service. Existing exclusions remain unchanged.

## Validation and publication

The initial pilot passed all 239 tests, lint, production build and TypeScript checks. Three new regression tests cover provenance, title-based eligibility, closure precedence, exact direct routes, malformed records and dates. Starting public counts: 3,413 internships, 2,089 early-career jobs, 5,502 total, 622 internal holds. The doubling goal and broader Workday recovery remain open. Final publication evidence follows.

## First production result and classification follow-up

Pilot code `4144025` was published. Refresh [44473320508](https://github.com/nothenrynguyen/app-expo/actions/runs/44473320508) succeeded and published snapshot `01f6e39` at 06:38 UTC November 19 (10:38 p.m. November 18 Pacific). All five new boards returned successfully. Total current listings rose from 5,502 to 5,521: 20 additions and one verification-pending removal, with 622 holds unchanged. Nine additions came from the five newly discovered boards (two ExtraHop, three Delinea, one Tines, two Prophet Security, one TRM Labs); eleven were ongoing ByteDance recovery. Twenty-three current listings carry the cyber source attribution, mostly overlaps. Candidate intake rose from 23,882 rows / 18,907 unique opportunities to 23,927 / 18,921, a net +45 rows / +14 unique across the whole refresh. This is measured small growth, not doubling.

Final classification review found 131 current graduate-titled jobs labeled Internship by source tables. The existing reviewed-career-page enrichment replaced employer title/body but preserved that upstream collection label. A follow-up now derives explicit intern/co-op versus graduate classification from fresh or valid cached official employer titles; inconclusive evidence does not change classification. This corrects collection counts while preserving overall opportunities and IDs. All 240 tests, lint and production build pass.

## Final production verification

Classification code `e145474` was published. Refresh [44474063768](https://github.com/nothenrynguyen/app-expo/actions/runs/44474063768) succeeded and published `1229f49`, generated at 06:44:32 UTC November 19 (10:44 p.m. November 18 Pacific). Vercel reports success. All four public files (`jobs.json`, `internships.json`, `fulltime.json`, `summary.json`) exactly match this snapshot.

Final current counts are **3,300 internships and 2,240 early-career jobs, 5,540 total**. Total inventory is **+38** versus the batch's 5,502 starting snapshot. All 131 classification changes (92 TikTok and 39 ByteDance) retained their public IDs and remain current. The lower internship counter therefore includes corrected graduate labels, not 131 lost opportunities. The second run added 19 tracked opportunities without removals. The first run had one verification-pending removal, not a confirmed closure. Keep these per-run churn records distinct from net additions.

Nine pilot-board additions remain current. Other gains came from the existing reviewed-career-page lane. Final intake is 23,928 candidate rows / 18,921 unique opportunities, net +46 rows / +14 unique versus the batch baseline. Feed overlap counts and new board counts are not publication counts. This pilot does not achieve the 37,530 unique-intake target.

All 21 feed records are healthy. Employer diagnostics still include 58 Workday cooldowns, two partial records and an Iterable board 404. No new source bypasses them or increases their retry budget. Internal holds remain 622. No paid resources, storage settings or screen-control sessions were used in this batch.

## Next work

Continue exact official-employer evidence for high-impact Workday gaps, starting with the investigated GlobalFoundries public careers interface if exact requisition/application identity can be established. Measure another permitted source by new qualifying opportunities after existing ATS expansion, rather than its headline row count. Keep the corrected collection baseline in subsequent growth comparisons. The internship count gap should now be compared with classification-aware historical evidence, not assumed entirely to be availability loss.
