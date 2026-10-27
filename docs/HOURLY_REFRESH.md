# Hourly job refreshes

The site keeps its hourly-update wording. The collection pipeline still runs on
standard GitHub-hosted Ubuntu runners in the public `nothenrynguyen/app-expo`
repository. Cloudflare supplies the primary clock, not job collection or storage.

## Schedule and duplicate protection

- Worker: `empluzzed-refresh`, source `workers/refresh/`.
- Cron: `17,37,57 * * * *` in UTC. Minute offsets remain the same in all timezones.
- At :17, check the repository snapshot and start `sync-jobs.yml` if this hour's
  snapshot is missing. At :37 and :57, check again. Allow at most two Cloudflare
  dispatches for the same hourly slot, providing one retry.
- A queued/running workflow suppresses another dispatch. Existing workflow
  concurrency serializes source-maintenance and job-refresh writes.
- `refresh_slot` identifies the target UTC hour in the workflow's run name.
  Checkout uses the current `main` when the job starts. A freshness guard then
  skips a queued duplicate whose target snapshot has already been generated.
- GitHub's existing hourly :17 schedule remains as a fallback. Its freshness guard
  skips ingestion if a snapshot was generated within the preceding 45 minutes.
  Manual dispatch with an empty slot remains an unconditional refresh.
- When GitHub already has a new snapshot but production does not, the checker
  reports a publication failure instead of repeatedly calling employer sources.
  Inspect the deployment before rerunning ingestion.
- An unsuccessful Cron invocation is visible in Cloudflare's Cron event history.
  No email, SMS, external notification service, database, or persistent log store
  is provisioned by this change.

Hourly triggering improves reliability but cannot guarantee exact execution or
publication time. GitHub queues, source outages, deployment failures, credential
expiry, provider outages and exhausted free quotas can still delay updates.

## Open tabs

The board checks `/summary.json` every five minutes while visible and immediately
when a hidden tab becomes visible. It only downloads its collection when the
summary timestamp advances. It preserves the last loaded jobs on errors, avoids
overlapping requests, and aborts outstanding work on unmount. Saved jobs, filters
and application records remain in the browser.

## Cost and access review (October 26, 2026)

The owner requested this deployment and explicitly required no payments.

- Workers Free includes 100,000 requests per day and 5 Cron Trigger definitions
  per account. One Cron expression here generates 72 scheduled checks per day,
  with at most four small outbound requests per invocation. No KV, D1, Durable
  Objects, queue, paid plan, domain or payment method is needed for this Worker.
  The existing analytics Worker is separate.
- Keep the account on Workers Free. Its request and CPU limits fail with errors
  instead of buying extra usage. Shared account quotas still apply. The Worker
  does not attempt automatic upgrades or use any paid API.
- Standard GitHub-hosted runners are free for this public repository. Retain
  the existing 10-minute job timeout. Do not switch to a private repository or
  paid runner without reviewing the cost policy.
- Vercel Hobby documents 100 deployments/day and 6,000 build minutes/month.
  Normally there is one data publication per hour (24/day, 720 to 744/month).
  Other project/account activity shares those allowances. Retry and fallback
  guards reduce duplicate source work; this is not a reservation of deployment
  capacity. Keep Hobby and do not enable paid overages or upgrades.
- Only public snapshot timestamps and workflow status are read. No visitor or
  application information is sent to Cloudflare by the scheduler.
- Use a dedicated fine-grained GitHub token restricted to `app-expo`, with only
  Actions read/write and GitHub's required Metadata read permission. Store it as
  the Worker secret `GITHUB_ACTIONS_TOKEN`. It can start workflows but cannot
  modify repository source directly. Never reuse the owner's general Git login
  credential, put a token in a URL, or put it in frontend configuration.
- The Worker has no public HTTP route, workers.dev endpoint or preview URL.
  Its code only contacts fixed GitHub and production snapshot URLs. Credentials
  are sent only to `api.github.com`, with redirects refused.

Official references:

- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Workers limits and cap behavior](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Free entry, no card required](https://www.cloudflare.com/plans/developer-platform/)
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [GitHub scheduler limitations](https://docs.github.com/en/actions/how-tos/troubleshoot-workflows)
- [Workflow dispatch permission](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event)
- [Vercel Hobby limits](https://vercel.com/docs/plans/hobby)

## Deployment and recovery

1. Verify the intended Cloudflare account is Workers Free with no payment method.
   Do not treat successful Wrangler login as proof of billing configuration.
2. Publish the workflow input/guard changes on `main` before enabling the Worker.
3. With pinned Wrangler `4.151.3`, deploy `workers/refresh/wrangler.jsonc` disabled.
4. Upload `GITHUB_ACTIONS_TOKEN` through Wrangler's stdin secret upload. Read it
   from an ignored local file, never from a literal shell argument or chat. Local
   `.cache/` and `workers/refresh/.dev.vars*` are ignored.
5. Set `SCHEDULER_ENABLED` to `true`, redeploy, and verify the remote schedule.
   Cloudflare documents up to 15 minutes for Cron changes to propagate.
6. Test one real dispatch with the slot input, inspect the Actions run, check the
   generated data commit, and verify both `/summary.json` and `/internships.json`
   on production advance. Verify a second check skips the fresh snapshot. Then
   observe a real scheduled Cloudflare invocation and its GitHub run.
7. Record activation receipts below. Code/tests alone do not prove live activation.

If a replacement token has an expiration, replace it before expiry through the
same secret upload; revoke superseded tokens after testing. The owner selected
a non-expiring token for this activation, so no monthly renewal is required.
Never add broader permissions
to work around an authentication error. To stop external dispatches, change
`SCHEDULER_ENABLED` to `false` and redeploy. GitHub's backup schedule continues.

## Activation receipt

- October 26, 2026: implementation commit `bf10067` published on `main`. All 107
  tests, ESLint, the production static-export build, and Wrangler's dry run passed.
- Vercel reported deployment success for `bf10067`. The production internship
  page serves the bundle containing summary polling, tab-visibility handling,
  request cleanup, and the corrected separator.
- Worker `empluzzed-refresh` uploaded with version
  `6878f67e-4919-4ec3-b594-e74e97cd9432`; remote Cron is
  `17,37,57 * * * *`. `SCHEDULER_ENABLED=false` keeps dispatches disabled pending
  the dedicated GitHub Actions secret.
- The owner confirmed that no credit card was added. Wrangler authenticated to
  the intended personal Cloudflare account. Its OAuth token cannot inspect
  billing subscriptions (403); no billing change, paid plan, or payment method
  was enabled by this implementation.
- The owner supplied a non-expiring, dedicated fine-grained token. The GitHub
  API reported no expiration and accepted a real workflow dispatch (204).
  `GITHUB_ACTIONS_TOKEN` was uploaded directly to Cloudflare's Worker secret
  storage without appearing in source, command arguments, or output.
- The scheduler is now enabled. Active Worker version:
  `cfc9a2a0-ca58-4d41-8b03-96fe9abf1752`. A local Cloudflare scheduled-handler
  invocation completed with HTTP 200 against the live freshness dependencies.
  This runtime check caught and corrected Workers' unsupported `redirect:error`
  mode; manual redirects plus explicit non-2xx rejection preserve the credential
  boundary. All 108 tests and the production build pass after the correction.
- Verification dispatch [40431166860](https://github.com/nothenrynguyen/app-expo/actions/runs/40431166860)
  completed successfully with an already-generated slot, testing the workflow
  input and duplicate-suppression path without repeating employer ingestion.
- Cloudflare's automatic :17 invocation on October 26 at approximately 6:17 p.m.
  Pacific completed with `outcome=ok`, no exceptions, and 3 ms CPU time. It
  dispatched [40431713022](https://github.com/nothenrynguyen/app-expo/actions/runs/40431713022)
  for slot `2026-10-27T01:17:00.000Z`; GitHub created the run at 01:17:40 UTC.
  The run completed successfully at 01:20:50 UTC and published data commit
  `ebd10248ca150f0bdd749cc3d0e28d3a5322e545`.
- Both production `/summary.json` and `/internships.json` advanced to
  `generatedAt=2026-10-27T01:20:43.398Z` (October 26, 6:20 p.m. Pacific).
  A subsequent local scheduled-handler check returned 200 without creating
  another workflow run, confirming fresh-hour suppression against live data.
- Activation is verified from Cloudflare Cron through GitHub ingestion and
  publication to the production snapshots. Provider outages and free caps can
  still delay future runs; no exact hourly completion SLA is implied.
