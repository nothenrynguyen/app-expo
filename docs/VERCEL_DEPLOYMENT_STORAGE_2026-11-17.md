# Vercel deployment-storage warning

Owner supplied the Vercel warning on November 17: free team henrys-projects-84715f33 reached 100% of its 10 GB Deployment Storage allowance. The message states older deployments will automatically be deleted, with Pro offered to preserve more history. This is retained build output across the team, separate from a database or Workday requests.

The current production alias is protected by Vercel retention exceptions. Exceeding the allowance can block new deployments if cleanup cannot make sufficient room; a successful GitHub data refresh alone does not prove that new data reached production. The 77ddbd6 code deployment succeeded after this warning was reported. The new generated-data deployment must be verified independently.

Local static export output contains 88 files totaling 13,596,584 bytes. Three public job JSON files account for about 10.7 MB, with deliberate collection/all-jobs duplication. Hourly data deployments produce many retained versions, a plausible contributor; exact team/project storage attribution is not verified. Other projects, retention exceptions and historical output also need review. Do not infer that the live site's current jobs occupy 10 GB.

The connected Vercel tools list the expected team but no projects and cannot retrieve app-expo. No authenticated per-project usage is available through that connection. CLI is not installed. User supplied the exact email; no deletion, retention setting, plan, source, refresh cadence or hosting architecture was changed.

Recommended no-cost next action: review Deployment Storage by project, then apply a project-only retention policy appropriate for hourly updates. Proposed starting point is seven-day production history and one-day preview/canceled/errored history, subject to the dashboard's supported choices and owner's approval. Preserve current production and recent rollback candidates. Do not apply team-wide changes or delete aliased deployments blindly. Keep hourly collection; inspect duplicate deploy triggers and unnecessary packaged assets before changing cadence. Review usage after automatic cleanup; escalation to Vercel support is preferable to a paid upgrade if usage remains inconsistent with retained deployments.

References: https://vercel.com/docs/deployment-storage ; https://vercel.com/docs/deployment-retention ; https://vercel.com/docs/deployment-storage/optimize ; https://vercel.com/changelog/hobby-projects-now-retain-fewer-deployments-to-free-up-storage .


## Approved retention change

The owner explicitly requested automatic deletion of deployments over a week old. In the signed-in Vercel dashboard, project `app-expo` (`prj_zCysmMFigU0TPLowTjUmJ7BSDVsf`) had 30-day retention for canceled, errored, pre-production and production deployments. All four were changed to 1 week and Save returned the success message “Deployment retention policy updated.” Screenshot: `.cache/vercel-seven-day-retention.png`.

This is a project-only policy, not a team-wide change. Current production aliases and Vercel's protected recent-deployment exceptions remain in force. No deployment was manually purged, paid plan enabled, or security setting changed. Retention processing and usage reporting are asynchronous; storage reduction itself has not yet been verified. The code and generated-data deployments both succeeded while the team storage warning was present.

The Vercel connection could list the team but not its projects; signed-in native Chrome supplied the verified project ID and controls. An optional 2FA setup prompt and an unverifiable coordinate action were rejected by automatic approval review. The prompt disappeared after user interaction; navigation continued through observed URLs and fresh semantic controls. Neither blocked action was performed by the assistant. The requested retention update was ultimately saved successfully.
