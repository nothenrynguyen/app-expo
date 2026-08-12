# App Expo Public Job Aggregator Milestone

## Goal

Launch App Expo as a standalone public job aggregator that presents fresh, deduplicated, verified U.S.
early-career roles with direct employer application links and no account gate.

## Non-goals

- No auto-application, applicant profiles, resume storage, application packets, or runner.
- No user accounts or hosted relational database.
- No scraping of LinkedIn, Jobright, ApplyBolt, or other gated aggregators.
- No paid infrastructure or APIs.

## Safety and quality constraints

- App Expo has its own folder, Git repository, GitHub repository, and Vercel project.
- The existing local ApplyOS auto-applier remains separate and unchanged.
- Unknown companies are quarantined by default.
- Explicitly unpaid, volunteer, commission-only, fee-based, or equity-only roles are rejected.
- A claimed U.S. or remote location does not establish a credible U.S. company presence.
- Failed or anomalous source refreshes preserve the last known-good snapshot.
- Posting age uses the source posting date and displays rolling 24-hour buckets, including
  `0 days ago`.

## Acceptance criteria

- The site is a static Next.js export with no runtime database or user-specific data.
- Listings expose company, title, term, location/work mode, posting age, LinkedIn, Info, and Apply.
- Apply opens the direct employer posting in a new tab.
- Filters cover search, location, work mode, term, category, and posting age.
- Source ingestion merges exact duplicates and retains provenance.
- Company eligibility decisions are deterministic and explainable.
- Tests, lint, and production build pass.
- Vercel Hobby hosts the project independently with no paid resources.
