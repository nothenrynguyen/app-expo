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

Monitor token expiration in GitHub. Replace it before expiry through the same
secret upload; revoke the old token after testing. Never add broader permissions
to work around an authentication error. To stop external dispatches, change
`SCHEDULER_ENABLED` to `false` and redeploy. GitHub's backup schedule continues.

## Activation receipt

Implementation and local verification are in progress. Account billing, credential
installation, production deployment and a live Cron invocation must be verified
before this section can report activation.
