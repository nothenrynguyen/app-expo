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

Unknown companies are quarantined by default. A company is published only when it has a reviewed
registry entry or strong evidence of substantial U.S. employment. Explicitly unpaid, volunteer,
commission-only, equity-only, and fee-based postings are rejected. A U.S. job location or
`Remote US` label alone is not proof of company eligibility.

The source posting time is retained separately from first-seen time. Visible ages are rolling
24-hour buckets such as `0 days ago` and `1 days ago`.

## Source attribution

The initial source set includes maintained public GitHub job lists and the MIT-licensed
[Internship Engine](https://github.com/zshah101/Automated-List-Of-Summer-2027-and-Fall-2026-Tech-Internships).
Apply links are normalized to direct employer postings. Each listing retains source provenance.

## Hosting

The frontend is a static Next.js export intended for Vercel Hobby. GitHub Actions refreshes data
hourly from 5:00 a.m. through 5:00 p.m. America/New_York and commits only material changes.
