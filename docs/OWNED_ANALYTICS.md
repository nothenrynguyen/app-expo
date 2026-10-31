# Owned activity analytics

Status: live collector and Production frontend integration verified October 23, 2026. Private API reports, consent, filtering, withdrawal and replay protection passed. See ANALYTICS_ACTION_LOG.md for release receipts, test-traffic baseline and remaining owner walkthrough/cron observations.

## Approved scope and architecture

The owner explicitly approved implementing and deploying the analytics milestone, making routine adjustments, keeping it free, keeping browsing account-free and protecting reports. This review narrows the database exception to analytics only. It does not authorize a personal application-record backend, visitor accounts, paid plans, or monetization.

The public Next.js app keeps `output: "export"`. A separate Cloudflare Worker receives allowlisted activity events and stores aggregate data in D1. The public `/analytics` route is a dashboard shell with `noindex`; no reports or credentials are embedded in HTML, JavaScript or public JSON. The Worker authenticates every `/report` request using a SHA-256 digest of a random 256-bit owner key. Opening an unlisted route does not grant reporting access. The owner enters the key locally; it lives only in that dashboard tab's memory.

There is no third-party authentication subscription. No visitor account is created. Reporting and data entry have distinct routes and permissions. The public intake is intentionally unauthenticated and must not be mistaken for a reporting endpoint.

Keep the existing Vercel analytics as the fallback while `NEXT_PUBLIC_ACTIVITY_ENDPOINT` is empty. A valid configured endpoint selects only the owned collector and suppresses Vercel collection. Preview/development must leave the endpoint unset. Activation switches to consent key v2; an old v1 Allow does not authorize persistent identification. Unexpired v1 declines remain honored.

## Zero-cost review

Official documentation checked October 22, 2026:

| Resource | Free allowance | Limit behavior |
| --- | --- | --- |
| Workers Free | 100,000 requests/day per account; 10ms CPU/invocation | Request allowance resets at midnight UTC; excess requests fail with error 1027. CPU excess fails the invocation. No paid upgrade is enabled. |
| D1 Free | 5 million rows read/day; 100,000 rows written/day; 5GB account storage | Reads/writes fail when allowances are exhausted. Storage must be cleaned before further inserts at its limit. No automatic paid overages on Free. |
| Individual D1 Free database | 500MB; 10 databases/account | This collector uses one database. Capacity exhaustion stops analytics; it does not require changing frontend hosting. |
| D1 Free recovery | Seven-day Time Travel window | Expired visitor-day/receipt data can remain in recovery history temporarily. Recovery is not a separate paid add-on. |

Cloudflare's official D1 product page explicitly says no credit card is required to start free. Verify the actual account is on Workers Free with no payment method before provisioning; do not select a trial, paid Workers plan, R2 or another resource that asks for billing details. The initial implementation had no account access; subsequent provisioning verified Workers Free and no payment method. See the action log for the actual resource receipt.

There are additional application safeguards: at most 4,000 accepted events/day, 120 events/browser/day, and 250,000 stored browser hashes. The database enforces these inside the same transaction as counting. These caps are deliberately below platform maxima but do not reserve quotas: shared account usage, reads, pruning, failed requests and abuse can still exhaust free allowances. Daily write estimates are not guarantees. Reports fail closed when unavailable; normal job browsing and local records are independent.

Per-isolate throttling allows up to 60 intake events/browser/minute. It is bounded and best effort, not a distributed bot-defense system. Known bot/headless user agents are excluded, but public intake can still be spoofed. CORS blocks unintended browser origins, not scripts or determined attackers. Never call these numbers verified people or fraud-proof counts.

Sources:

- https://www.cloudflare.com/products/d1/ (no-card Free entry)
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers/platform/limits/#daily-requests
- https://developers.cloudflare.com/d1/platform/pricing/#frequently-asked-questions
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/d1/worker-api/d1-database/#batch (transactional batches)
- https://developers.cloudflare.com/d1/reference/time-travel/
- https://developers.cloudflare.com/workers/wrangler/configuration/

## Collection contract

Every payload has exactly version, eventId, visitorId, name, page, board, filter, results, source and device. Unknown fields, unknown strings and invalid combinations are rejected. Body size is limited to 1KB before JSON parsing. Server time determines the UTC day; clients cannot backdate activity.

| Event | Trigger and interpretation |
| --- | --- |
| page_view | A consenting visit or route transition to an approved public page. `/applications` and `/analytics` are excluded. |
| filter_use | A changed filter category after 800ms settling, with result bucket zero, 1-10, 11-50 or 51+. Changes are counted per category, not as unique searches. Initial explicit role navigation is included. |
| apply_click | Opening a board or saved-job employer link. Not an application submission. |
| save_click / unsave_click | A successful local saved-job write. Failed writes are not counted. |
| application_add | Successful local change adding one or more new tracker records, including imports. One action per bulk change, no record contents or count. Editing existing records does not count as an add. |

Page events include a coarse referral category and estimated desktop/mobile/tablet category. Referrer URLs and raw user agents are never included in the payload. Actions carry neither a referrer category nor a device dimension. Filter values never leave browser memory. There are no job IDs, employer names, selected locations, search strings, notes, statuses, employer URLs or page query strings.

The browser creates a random UUID only after consent. It expires after 180 days without extending on each visit. Storage failure uses a page-memory identity. The Worker HMACs the UUID before storage with a secret never sent to the frontend. Neither ID nor hash is a verified human identity. Cross-device use, clearing storage and expiry can create duplicates. There is no fingerprinting or account join.

Withdrawal stops new sends, removes the local browser ID and aborts outstanding requests when possible. It cannot undo a request already received or erase old aggregates. Privacy signals are checked on every send. The owner dashboard sets a local browser exclusion by default, with a visible control to reverse it; blocked storage cannot persist that preference.

## Storage and metrics

- `visitors`: keyed browser hash, first/last UTC day and cumulative feature bits. Retained for deduplicated lifetime counts until reset/removal or storage exhaustion, capped at 250,000 identities.
- `visitor_days`: one row per browser per UTC day with feature bits and event count. Pruned after 90 days by a daily Worker cron.
- `daily_stats`: daily visitors, active visitors, returning visitors, event counts, last receipt and recorded safeguard-limit status. Retained as bounded-dimensional history.
- `counters`: daily event/page/board/category counts, without browser IDs. Retained as bounded-dimensional history.
- `receipts`: random event ID, UTC day and random transaction nonce. Seven-day replay protection only, without event contents or visitor IDs.
- `metadata`: collection start and identity-count metadata.

There is no raw action history, IP, raw user agent, arbitrary URL or application data in the schema. Worker observability is explicitly disabled and handlers never log requests, secrets or database errors. Cloudflare still processes ordinary network/security data as the hosting provider. This is pseudonymous, optional measurement, not a claim of universal anonymity or a consent exemption.

Visitors are distinct observed identities in the selected period. Active means at least one filter, save, unsave, employer-link or application-add action. Returning means that identity was seen on an earlier UTC day. Monthly/7-day/30-day counts deduplicate across days using feature-bit unions. All-time totals use cumulative flags. The dashboard's stage counts are overlapping feature reach, not an ordered conversion funnel. Zero-result rate is zero-result filter-category events / all filter-category events.

The all-time chart shows the last 90 days, while all-time totals and aggregate action counts cover collection since start. The dashboard does not invent zeros for missing days. Data-health numbers come from the current public snapshot and are not historical audience metrics. Historical Vercel totals are not merged into the new identity counts.

## Provisioning and activation

Use a terminal with normal network access, Node 22, and the intended personal Cloudflare account on Workers Free. Local implementation could not download Wrangler because registry.npmjs.org DNS was unavailable. The connected Vercel account returned no projects, and the in-app browser could not open a usable tab. No live collector, database or secret was created during that attempt.

1. Sign in personally to Cloudflare. Confirm Workers Free, no payment method and no trial. No account creation, contractual acceptance or security challenge is automated.
2. Use pinned Wrangler 4.151.3 (official npm version observed during this review). Run `npx --yes wrangler@4.151.3 login`, then select the intended account. Do not paste Cloudflare API credentials into chat or commit them.
3. From `workers/activity`, run `npx --yes wrangler@4.151.3 d1 create empluzzed-activity`. Put the returned database UUID into `wrangler.jsonc`, replacing the zero placeholder. The placeholder is not a live binding.
4. Still in `workers/activity`, run `npx --yes wrangler@4.151.3 d1 migrations apply empluzzed-activity --remote`. Keep collection disabled.
5. Local owner credentials were already prepared during implementation. Keep ignored `.cache/activity-owner-key.txt` and `workers/activity/.dev.vars` private. For a fresh checkout without those files, run `npm run activity:credentials` from the root. It refuses existing keys and prints no secrets. Store the owner key in your password manager. The .dev.vars file contains the HMAC secret and only the owner-key digest, not the owner key.
6. From `workers/activity`, run `npx --yes wrangler@4.151.3 deploy`. Then `npx --yes wrangler@4.151.3 secret bulk .dev.vars` to upload the two Worker secrets through the existing authenticated CLI. Never put them in NEXT_PUBLIC variables, GitHub files or build artifacts.
7. Confirm D1 binding/migration, private `/report` receipt, 401 without a key, 403 for a wrong origin, no-store response headers and no invocation logging. Verify scheduled pruning is configured for 06:43 UTC. The collector accepts only origins explicitly in ALLOWED_ORIGINS, currently the apex and www production domains. Verify which production hostname actually serves the app before activation and add only a required alias if necessary.
8. Change COLLECTION_ENABLED to `true` in the Worker configuration and redeploy. Configure `NEXT_PUBLIC_ACTIVITY_ENDPOINT=https://ACTUAL-WORKER-HOST/collect` for the intended Vercel project's Production environment only, then redeploy the frontend. Do not set it for Preview or Development. The two providers are mutually exclusive once the new frontend loads.
9. Run `npm run activity:verify -- https://ACTUAL-WORKER-HOST/collect https://empluzzed.fyi`. This reads the private owner key file locally, verifies report access and schema, origin denial, rejection of invalid events and the production dashboard shell. It deliberately does not manufacture visitor counts.
10. In a test browser without owner exclusion, verify zero sends before choice, a fresh consent prompt for an old v1 Allow, then one page view, a filter action, a save and an employer-link click. Confirm the private dashboard receives those actions, reload keeps the same observed identity, and withdrawal blocks further requests. Do not submit an employer application. Record this small verification session separately from organic use and do not present it as user adoption.
11. Record actual deployed Worker URL/version, D1 migration receipt, frontend deployment/commit, browser checks, verification-session counts and activation date in this document. Only then mark production complete. Do not publish report contents or credentials in a public production receipt.

## Rollback, maintenance and access

To stop intake immediately set COLLECTION_ENABLED=false and redeploy the Worker. To restore the original page-view provider, remove the Production activity endpoint and redeploy the frontend; existing v1 choices still govern the fallback. Neither step changes browser-local records. A rollback does not erase stored analytics.

Keep owner keys outside screenshots, shell command arguments, logs and repository files. Rotate the owner key by generating a new random 32-byte base64url value locally and updating REPORT_TOKEN_SHA256 through authenticated Worker secret management. Existing keys immediately stop opening reports. Keep VISITOR_HMAC_KEY stable to preserve identity deduplication; changing it starts new pseudonymous identities and must be annotated as a continuity break.

Check D1 metrics and cron execution periodically. Pruning can be delayed by quota exhaustion; recovery history can retain deleted detail for seven additional days. Do not raise free limits by upgrading. If intake pauses, preserve the gap in reporting and review abusive traffic or lower usage. Free resources have no uptime guarantee.

## Validation evidence

Local validation uses the actual migration and collector SQL against Node 22's real SQLite engine through a transactional D1-compatible adapter, not mocked counter results. It tests monthly deduplication, bit unions, concurrent duplicate delivery, retention, UTC boundaries, schema rejection, report authentication, CORS, privacy signals, quotas and database failures. Browser-sender tests exercise consent v2, payload stripping, owner exclusion, identity lifetime and failure isolation.

The suite passed all 92 tests, ESLint and TypeScript checks. Static production export passed with the activity endpoint empty and with a non-live example collector URL. The configured export contains the expanded notice, owner-key form and noindex metadata. A browser-targeted bundled Worker build also passed. A scan of the configured static output found none of the generated local analytics credentials.

These tests do not substitute for actual Cloudflare binding/runtime verification or a browser network trace. Static production builds are checked with the endpoint absent and with a non-live example HTTPS endpoint, without enabling collection on a real service. No new runtime dependency is added to the public app.


## Monthly reporting update, October 31

The owner dashboard now selects a UTC month or all time. Monthly unique browsers are deduplicated over retained visitor-day detail; closed-month aggregate rows are archived before daily detail expires. No additional browser identities or raw events are retained. If the collector misses archival before detail expiry, a complete historical month is unavailable rather than estimated from daily totals. All-time uniques still come from the lifetime browser table and are not the sum of monthly uniques.

The existing production database was initialized manually. Apply only the idempotent `0002_monthly_reports.sql` for this upgrade; do not run the untracked original schema against the live database. Deploy the new collector before publishing the frontend and explicitly preserve active collection (`--var COLLECTION_ENABLED:true`); source defaults to disabled. See the [release receipt and configuration follow-up](ANALYTICS_UX_AUDIT_2026-10-31.md#collector-release-receipt).
