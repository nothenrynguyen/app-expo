# Failure email check, November 20, 2026

The owner reported new sync-failure emails after the retention-fix push. Mailbox review found two new app-expo failure notices in the last-day search: both are **Vercel production deployment** failures, received at 12:46 a.m. and 12:51 a.m. Pacific. They concern commits `1458363` and `7409242`, respectively. The second commit changed refresh data but inherited the same broken test fixture; it did not introduce a separate sync failure. The second email arrived after a corrected deployment had already completed.

Cause: the agent's new `PublicJob` test fixture omitted required `verifiedCompany` and `linkedInUrl` fields. Transpiled tests passed, but Vercel's production TypeScript check rejected the build. Local command-output review failed to preserve/check the final verification exit code. This was an introduced validation error, not a storage, billing or provider-rate-limit failure. The fixture was corrected in `59f3758`; that deployment and the following `d0eb5ae` deployment report success. The current website remained on its prior successful deployment during the failed builds and then received the corrected version.

The latest fifteen GitHub refresh/maintenance runs checked here all succeeded, including retention verification run `44704857132`. Earlier GitHub failure emails returned by the broader search are dated November 17 Pacific and concern the prior collector incident. Do not confuse email arrival/unread state with a new failure of the latest hourly refresh.

## Prevention change

Added `npm run typecheck` (`tsc --noEmit --incremental false`) to the front of `npm run verify`, and added the same explicit type check to the refresh workflow before tests and ingestion/publication. This makes missing-type errors visible to the standard release command and stops automated data publication when the committed code fails type checking. It does not suppress genuine errors or guarantee that every future deployment succeeds. Existing notification preferences are unchanged.

Prevention gate `5037442` is published. Local `npm run verify` completed successfully with explicit exit-status handling: clean nonincremental types, all 254 tests, lint and production build. Hosted refresh [44708324464](https://github.com/nothenrynguyen/app-expo/actions/runs/44708324464) succeeded, including the new “Check types before refresh publication” step and tests, then published snapshot `81cd520`. Vercel reports successful deployments for the gate commit and resulting snapshot. All four live JSON files exactly match `81cd520`. This verifies the specific defect is resolved and the guard works in the clean hosted environment. No email labels or notification settings were changed, and no browser control was used for this follow-up.

## Recommended next steps

1. Confirm the next scheduled refresh remains green with the new gate; investigate any genuinely newer failure by its commit/run and timestamp.
2. Keep genuine failure notifications enabled. These two older deployment notices do not establish a current refresh outage.
3. Resume the approved November 21 retention/coverage checkpoint and subsequent high-yield employer/source expansion. No provider retry limit, quality gate or paid setting changes are needed.
