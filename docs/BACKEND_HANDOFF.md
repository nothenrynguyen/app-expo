# Backend milestone handoff

The frontend milestone is complete. Saved jobs support explicit statuses, filtering and retained details for missing listings. My applications supports manual records from any source, dates, notes, editing, saved-job import, and private JSON backup/recovery with preview and duplicate handling. All records remain in the current browser profile on this site origin. Backup files contain plaintext notes and links and must be kept private. They do not include board saves or analytics preferences. See APPLICATION_TRACKER.md for limits.

Static export and account-free browsing remain intact. Existing opt-in Vercel Hobby page views remain active when the owner enables the production switch and a visitor consents. The applications route is excluded. No backend, database, authentication or owned analytics intake exists yet.

## Proposed owned analytics contract

Use daily aggregate counters with fixed events: `page_view`, `collection_select`, `filter_use`, `apply_click`, `save_click`, `unsave_click`. Apply is only an outbound link click, never a completed application. Save/Unsave measure board controls, never changes to private tracker records.

Only allow public route identifiers and collection values `internships` and `jobs`. For filter usage, use an allowlisted filter category, never its entered text or selected employer/location value. Search can increment the `search` category without recording the query. Review the actual board controls before finalizing the category allowlist. Count actions, not users or sessions. Repeated actions can count repeatedly.

Do not transmit job IDs, company names, personal identifiers, application records, notes, search text, raw URLs, query strings or fragments. For referral reporting prefer a fixed source category such as direct/unknown, search, social, other. Do not store arbitrary referral paths or hosts. This sacrifices detailed referral reporting for bounded, safer data. Do not join analytics counters to accounts.

Proposed counter retention is 90 days, subject to the storage cost review. No visitor histories or persistent analytics IDs. Review unavoidable IP addresses, request headers, proxy and provider logs, retention, bots and rate limiting before describing collection as anonymous or deciding consent. No replacement activation until official privacy guidance and audience applicability are assessed. The owner is US-based with a mainly US audience. Cookie-free collection alone does not determine consent requirements.

Keep reporting private, initially through a local owner dashboard. Never put an owner credential in frontend code or a NEXT_PUBLIC variable. A local dashboard still requires a protected reporting API if it reads a hosted collector.

## Next chat prompt

Continue App Expo in C:\Users\Henry\Documents\Projects\app-expo at the backend boundary. Read AGENTS.md, COST_POLICY.md, ROADMAP.md, docs/BACKEND_HANDOFF.md, docs/APPLICATION_TRACKER.md, docs/ANALYTICS.md and relevant installed Next.js docs first. Explain progress in plain language and commit coherent verified milestones. Do not use em dashes in user-facing copy.

First assess Go hosting, persistent storage and optional authentication using current official documentation. No payment method, billable overages, automatic paid trial conversion or paid upgrades. Document included limits, retention, pauses and recovery. Unknown limit behavior disqualifies a service. Complete a concrete architecture and cost review for owner approval before adding hosted database/authentication resources, as COST_POLICY.md requires.

Then plan a Go backend with GraphQL for private application records and a separate small HTTP intake for daily aggregate counters under the proposed contract above. Preserve Next.js static export and account-free public browsing. Add optional profiles with ownership checks, deletion, local-record migration and backup recovery. Preserve manual applications from outside the aggregator and existing records during migration; do not invent applied dates. Local storage keys and backup format are documented in the tracker implementation. Analytics must never receive personal records or account IDs.

Build the owner dashboard locally with private reporting access. Verify isolation, deletion, migration, sensitive-data exclusion, consent/opt-out behavior and free-limit failure behavior. Keep the existing opt-in Vercel analytics until a replacement passes privacy and operational verification. Backend analytics is a separate decision from storing private application records. Do not contact external providers without explicit user instructions.
