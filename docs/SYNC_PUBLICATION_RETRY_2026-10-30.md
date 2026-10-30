# Sync publication recovery, October 30

## Why failure emails continued

The earlier collection-starvation repair passed two production refreshes. Two
later failures occurred after collection and tests succeeded, during the Git
upload of the generated snapshot:

- [Run 41070476398](https://github.com/nothenrynguyen/app-expo/actions/runs/41070476398), 7:24 a.m. Pacific: GitHub rejected the push with `Internal Server Error`.
- [Run 41121995172](https://github.com/nothenrynguyen/app-expo/actions/runs/41121995172), 1:26 p.m. Pacific: push returned HTTP 408 and disconnected.

The workflow attempted publication only once, so a temporary transport error
failed the whole run and GitHub sent its normal failure notification. The later
runs 41124721486 and 41129932972 succeeded. Before this repair, live production
already showed 6,684 jobs generated at 2:24 p.m. Pacific. This is a publication
reliability issue, distinct from collection quality or evidence expiry.

## Approved implementation

`scripts/publish-refresh.mjs` publishes the existing validated commit, with at
most three attempts and 5/15 second pauses. Each Git command has a 45-second
timeout. Fetching remote state before each upload detects a previous upload
accepted despite a lost response. A final fetch checks the outcome after a third
transport error. Retries apply to known transport/server failures and concurrent
remote advancement, not authentication, permissions or unknown errors.

Independent remote commits are rebased without force pushing. Conflicts stop
and remain visible. Reconciliation stops if tracked uncommitted changes remain;
it never stashes or includes rejected files. With no remote divergence, a
retry-state-only commit can be pushed while rejected proposal files remain
uncommitted. Both publication paths use the helper. Collection is not repeated.

The job timeout is 15 minutes to reserve recovery time. No source or coverage
policy, notification setting, secret, scheduler, dependency or service changed.
Persistent failures still fail the job and can send email. This reduces transient
failure alerts; it cannot guarantee GitHub or providers never fail.

## Verification and release

Local validation: all 183 tests pass, including 12 publication recovery tests. TypeScript and ESLint pass. No UI or Next.js runtime code changed, so static export was not repeated. Production release verification is complete.
The retry tests use real temporary Git repositories with injected transport
failures. They cover server errors, timeouts before/after acceptance, exhaustion,
fetch outages, permissions, independent remote changes, conflicts and exclusion
of staged rejected snapshots. Production outages are not deliberately induced.

Next product priority remains defining and measuring an early-career experience
policy before enabling broader exclusions.

## Production completion

Implementation `a8e4755` is published. [Run 41138799216](https://github.com/nothenrynguyen/app-expo/actions/runs/41138799216)
passed a clean install, all 183 tests, collection, unchanged coverage safeguards
and publication through the new helper. Logs show `Publish attempt 1/3` followed
by `Publication succeeded`. Snapshot `e59eb91` contains 6,654 jobs, generated
October 30 at 3:38 p.m. Pacific. All four public JSON files byte-match production.
See [machine-readable receipt](sync-publication-production-result.json).

This live run verifies normal publication with the new helper. Temporary outage
recovery and conflict behavior are verified by local fault injection, not a
manufactured GitHub outage. No email subscription or failure alert was disabled.
