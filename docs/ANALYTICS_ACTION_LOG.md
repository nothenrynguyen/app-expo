# Analytics milestone action log

Updated October 23, 2026. Credentials and private audience reports do not belong in this file.

## Scope

Account-free public browsing, explicit optional analytics, private owner reporting and free services only. Application records remain browser-local. No paid plan, payment method, visitor accounts, session replay or advertising was added.

## Completed

- Implemented consent v2, bounded events, pseudonymous browser deduplication, Cloudflare Worker/D1 storage, quotas, retention, privacy notice and private /analytics dashboard.
- All 92 tests, lint, TypeScript and static export passed during implementation. PR #2 merged as 4d15801b6cf6c305ba38e5d779a284e67b9f278c.
- Verified Workers Free and no payment method in Cloudflare billing.
- Created D1 empluzzed-activity (c55f1e3b-eedd-48f5-ad75-c7ce27f9daa5), applied schema successfully and bound DB to Production without preview inheritance.
- Deployed the reviewed collector bundle, verified by copying editor source back and comparing after newline normalization. Initial bundle version ea13d35f; subsequent configuration deployments followed.
- Disabled persistent invocation logs, traces and issues. Saved daily retention cron 43 6 * * *.
- Owner entered both encrypted Production secrets. Never published the owner key or HMAC secret.
- Set Production-only NEXT_PUBLIC_ACTIVITY_ENDPOINT=https://empluzzed-activity.nothenrynguyen.workers.dev/collect. Automatic main deployments picked it up before this session. Verified the actual live JavaScript contains that URL.
- Activated COLLECTION_ENABLED=true after report authentication checks passed.
- Verified /report: 401 without key, 403 with an untrusted origin, 200 with the correct key and production origin, no-store headers. All 7d/30d/month/all report schemas passed.
- Verified /collect rejects invalid fields with 400. Replayed a received event: 204, with totals and daily event count unchanged.
- Browser verification: declined consent sent zero events; explicit Allow produced accepted page and filter events (204); search text was absent from payloads; withdrawal stopped subsequent collection requests.
- Verified live /analytics is a noindex shell with an owner key form and no embedded owner key. Owner exclusion is enabled by default on that browser.

## Verification traffic

One test browser generated four events on UTC day 2026-10-23: three page views (About, Home, Internships) and one zero-result search-category action. These are verification traffic, not organic adoption. Baseline was zero visitors. Keep this baseline in mind when using early metrics on a resume. Duplicate replay added nothing. Test traffic was retained rather than silently deleting audit evidence.

## Operational follow-up and limits

- Cron is configured, but its first successful scheduled execution has not been observed. The dashboard event history was empty at verification time. Recheck after its next 06:43 UTC run (11:43 PM Pacific on the previous local date while daylight time applies).
- API report authentication and dashboard shell were verified. Unlocking the browser dashboard with the owner key remains an owner walkthrough; the key was not moved into chat or browser automation.
- Browser end-to-end exercised page/filter/withdrawal and API replay. Save/apply/tracker instrumentation has implementation-test coverage, but was not individually exercised against production in this receipt.
- No new Vercel build was manually requested; deployment AA2HKCUNXUAmqdxoAi5LQuXMBgdy, commit e1eafbd9a3a352e6d28314e0dfa50ed40a02f91a, was Ready and its live assets had the endpoint.
- Free limits can stop analytics while browsing remains usable. Counts represent consenting observed browsers, not verified people; all-time means since collection started.

## Owner access and rollback

Open https://empluzzed.fyi/analytics and enter the locally retained .cache/activity-owner-key.txt value. It stays in tab memory. Keep a private password-manager copy. To stop intake, set COLLECTION_ENABLED=false in Cloudflare and deploy. Future Worker deployments should preserve the live flag deliberately; wrangler.jsonc keeps false as the safe default.

Implementation, definitions and maintenance: [OWNED_ANALYTICS.md](OWNED_ANALYTICS.md).

## Report credential rotation required

- A final runtime-import error included an encoded owner report key in this conversation tool output. No key was committed or published to the site. Treat the old report key as exposed within the transcript.
- Generated a replacement owner key in ignored .cache/activity-owner-key.txt and its digest in ignored .cache/activity-report-digest.txt; updated REPORT_TOKEN_SHA256 in ignored workers/activity/.dev.vars. VISITOR_HMAC_KEY was unchanged.
- Owner must replace Cloudflare Production REPORT_TOKEN_SHA256 with the new digest and deploy. Until then the old remote key remains valid and the new local key will not authenticate. Afterward verify the new key succeeds and old key is rejected. Do not claim credential rotation is deployed yet.
