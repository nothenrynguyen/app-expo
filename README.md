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
