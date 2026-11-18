# Refresh and storage follow-up, November 18, 2026

## Verified current state

The latest 12 GitHub refresh runs all succeeded, including run [44333938681](https://github.com/nothenrynguyen/app-expo/actions/runs/44333938681), started at 7:17 a.m. Pacific. Snapshot `26806ae`, generated at 7:20 a.m. Pacific, is deployed successfully. All four public job JSON files match the generated-data commit byte-for-byte.

- Current published listings: **5,320**, up **55** from the last verified 5,265. Comparing application URLs gives 67 additions and 12 removals across that interval; this is publication churn, not a claim of 67 newly discovered unique opportunities.
- Reviewed official-page postings now published: **82 TikTok and 24 ByteDance**, up from 37 and 10.
- Latest official-page lane: 25 attempts, 50 requests, 15 fresh verified opportunities and 92 reused positives at their actual timestamps.
- Internal availability holds: **621**, unchanged. Intake: 23,864 candidate rows and 18,817 unique opportunities. Pending candidates: 7,687. The unique-intake doubling target remains open.

## Remaining source problems

All 58 failed source diagnostics are Workday: 36 actual 429 responses and 22 cooldowns with no requests. There are no failed non-Workday source diagnostics. The separate board inventory has 687 healthy records of 746; the additional failed board is `greenhouse:iterable`, returning 404. These provider/board problems did not crash the workflow or block the new snapshot.

The latest listing-change report includes six unresolved employer-board omissions: five New York Times internships and one Olsson internship. Their boards responded successfully but omitted those exact vacancies. That is evidence of absence from the board, not proof that the jobs closed. The coverage guard reports zero unexplained removals under its separate guard definition; do not describe the report's six unresolved omissions as confirmed closures or hide the distinction. Five other removals are verification-pending. Next targeted investigations are Iterable's current official destination and exact posting evidence for these omissions.

## Vercel dashboard check

Signed-in native Chrome confirms the team remains **Hobby**. The Last 30 Days view (October 19 to November 18) reports **10.03 GB Deployment Storage**, with **9.96 GB attributed to app-expo**. Functions Storage is 3.65 MB and Blob Storage is zero. The current app deployment is Ready and serves the verified snapshot.

Project configuration still shows **1 week for canceled, errored, pre-production and production deployments**, with Save disabled because there are no unsaved changes. No retention, billing, security or project setting was changed during this check, and no deployment was manually deleted.

The published Vercel storage documentation clarifies the earlier assumption about a falling usage number: it records daily project maxima over the reporting period. Deletion stops a deployment contributing to future usage, but does not erase earlier recorded days. Therefore the displayed period total can grow more slowly rather than drop after cleanup. The 10.03 GB figure alone does not establish whether the current retained footprint has fallen. Vercel says retention deletion normally runs within 48 hours after eligibility, with protected-deployment exceptions and potentially longer re-evaluation. Keep the one-week policy and compare subsequent daily usage; do not upgrade or blindly delete active deployments because the historical total remains high.

Sources: [Deployment Storage](https://vercel.com/docs/deployment-storage), [Deployment Retention](https://vercel.com/docs/deployment-retention), and the authenticated team usage/project configuration pages. Actual cleanup volume is not established by this check.
