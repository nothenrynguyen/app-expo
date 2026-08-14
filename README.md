# App Expo

A standalone public product for fresh, verified U.S. early-career jobs with direct employer
application links. It contains no applicant profiles, resumes, application automation, or user
accounts, and it has no dependency on the ApplyOS auto-applier.

## Local development

```bash
npm install
npm run sync:jobs
npm run dev
```

## Data policy

Simplify's maintained public internship lists and SpeedyApply's maintained U.S. new-grad list are
the coverage baselines and are published with their direct employer links, after hard exclusions
for explicit unpaid, volunteer, commission-only, equity-only, fee-based, and clearly non-U.S.
postings. For all other aggregator sources, unknown companies are quarantined until a reviewed
registry entry or strong evidence of substantial U.S. employment is available.

Public listings must also match one of App Expo's supported role areas through explicit title
evidence. Unmatched roles are quarantined rather than being treated as software by default.

App Expo also discovers Greenhouse, Lever, and Ashby company boards from those curated listings.
It refreshes the public board inventories directly, adds relevant early-career roles, and removes
jobs that no longer appear on a successfully refreshed company board. Other employer links are
checked in rotating daily batches. Confirmed 404, 410, expired, filled, and no-longer-accepting
responses are excluded, while temporary blocks and outages retain the last known listing.

SmartRecruiters links are checked against SmartRecruiters' public employer records on every sync.
The employer's active status and original release date override the age shown by a source list.
Internships with an exact employer posting date older than 180 days are excluded, even if a source
list recently added them.

Reviewed company decisions live in `data/company-trust.json`. A blocked company and its aliases are
excluded from every source, including trusted coverage sources. Approved and pending records provide
the foundation for a growing company trust registry without requiring special-case code changes.

The source posting time is retained separately from first-seen time. Visible ages are rolling
24-hour buckets such as `0 days ago` and `1 days ago`.

## Source attribution

The initial source set includes maintained public GitHub job lists and the MIT-licensed
[Internship Engine](https://github.com/zshah101/Automated-List-Of-Summer-2027-and-Fall-2026-Tech-Internships).
Apply links are normalized to direct employer postings. Each listing retains source provenance.

## Hosting

The frontend is a static Next.js export intended for Vercel Hobby. It publishes separate full-time
and internship datasets so each collection only downloads the listings it needs. GitHub Actions
refreshes data hourly from 5:00 a.m. through 5:00 p.m. America/New_York and commits only material changes.
The homepage reads counts and source health from a small `public/summary.json` file instead of downloading
both complete job collections.

## Automatic source maintenance

The job-source catalog lives in `data/sources.json`, so yearly repository URLs are not embedded in
the sync program. Scheduled GitHub Actions check every active source daily, search trusted GitHub
owners weekly for new internship cycles and replacement lists, and create a monthly health report.
Sources are retired only after sustained failures, repeated empty results, or replacement by a
newer maintained cycle. Temporary failures never cause immediate removal.
