# App Expo analytics

Reviewed against official sources on September 30, 2026. Implementation is complete; production activation is an owner step.

## Decision and audit

The app exports static HTML, uses client-side collection JSON and filters, and stores saved job IDs in browser localStorage. It has no visitor account or application submission flow. Analytics must not ingest those IDs, search strings, notes, or employer URLs. The existing approved Vercel Hobby hosting account is the smallest dependency change.

Use Vercel Web Analytics on Hobby, through pinned `@vercel/analytics` 2.0.1. No account, authentication, database, Go, or GraphQL is added to App Expo. Owner access uses the existing hosting dashboard.

| Requirement | Verified behavior |
| --- | --- |
| Cost / payment method | Hobby is free; Vercel says free plans need no payment method. Enable only the included analytics, never a Pro trial or add-on. |
| Free allowance | 50,000 events per month, shared across the team's projects. Here each transmitted page view uses one event. |
| At the cap | Hobby cannot buy additional events and cannot be charged for extra events. Collection pauses. The official pricing page's summary says until the next cycle, while its billing section and Hobby page describe a three-day grace period and resumption after seven days. Treat reporting as incomplete during pauses; consult the dashboard for actual reset time. Never upgrade to resolve a pause. |
| Retention | One month of guaranteed reporting history. This is not a deletion guarantee: Vercel says it may retain data longer to support a later upgrade. |
| Interaction events | Custom events are unavailable on Hobby. Collection-selection clicks, filter changes, Apply clicks, and Save/Unsave clicks are deliberately not instrumented or billed. |
| Traffic sources | Available initial referrer information, subject to browser/referring-site restrictions and the safety exclusions below. UTM reporting is unavailable on Hobby and all query strings are removed anyway. |
| Permitted use | Hobby is for personal, non-commercial projects. App Expo's non-monetized personal job board matches that scope. Any future monetization needs a new policy review. |

Umami Cloud was considered because its official FAQ confirms a free Hobby plan and custom event metering. However, its pricing page could not be extracted during review and its official usage/subscription pages did not establish the required Hobby cap behavior and no-payment-method guarantee. Its paid trials explicitly become paid. It was not added; third-party pricing claims were not accepted as policy evidence. Self-hosting would also introduce infrastructure outside this milestone.

## Owner activation and private dashboard

1. Sign in at [Vercel dashboard](https://vercel.com/dashboard), select the existing personal **Hobby** team, and open the project serving `app-expo-one.vercel.app`. Confirm the plan is Hobby and there is no payment method. Keep the existing non-commercial hosting arrangement.
2. Open the project's **Analytics** tab, then enable **Web Analytics** (the included feature). Do not choose Pro, a trial, Web Analytics Plus, or Speed Insights. If the interface asks for a payment method or upgrade, stop and leave analytics disabled.
3. Under project **Settings > Environment Variables**, set `NEXT_PUBLIC_ANALYTICS_ENABLED=true` for **Production only**. Keep it absent or `false` for Preview and Development. This public build-time switch is not a secret. No API key is needed.
4. Deploy this change through the normal static-export deployment flow. Redeploy after changing the variable, because public environment variables are compiled at build time.
5. Open the production site, scroll to **Optional analytics**, choose **Allow analytics**, and visit `/`, `/internships`, and `/jobs`. Allow a few minutes, then return to **Project > Analytics > Web Analytics**. Use **Pages** for collection visits and **Referrers** for available sources. Use the team's **Usage > Observability** to monitor the shared allowance. If you decline again, future analytics sends stop immediately.
6. Keep report access inside your personal Vercel account. Do not publish a dashboard, create a sharing link, grant report access to others, or expose an analytics API/token in the site. The site has only a privacy page and preference controls, no report endpoint or embedded dashboard.

Owner activation and live dashboard receipt have not been performed from this workspace. Local tests can verify gating and payloads, but the production intake is supplied by Vercel after dashboard activation. On another static host, leave the switch false; no analytics backend is bundled into the export.

## What the reports mean

- Page views and approximate visitors for the known public pages only. `/internships` and `/jobs` measure collection visits, not collection button clicks. Query-only role/specialty changes are not separately counted, and the controls do not subscribe to search parameters.
- Available referral origins, plus provider-derived browser, OS, device and approximate geography information. Browser settings and `noreferrer` links can remove the source, so missing source information is not proof of a direct visit.
- No event totals for filters, Apply, Save or Unsave. An Apply click would only mean opening an employer link, never a completed application. App Expo cannot observe employer-side submission or hiring outcomes.
- No raw search, role/filter values, job IDs, employers, employer destinations, application notes, identity traits, or campaign parameters. No historical backfill, cross-device saved jobs, or cross-site visitor tracking.
- Opt-in visitors are a biased subset, not total traffic. Blockers, privacy signals, blocked scripts, rejected initial referrers, and cap pauses also undercount. Vercel's visitor hash/session is temporary, not a count of distinct people over long periods.

## Tracking and consent review

Reviewed the installed SDK's injection/queue and React pageview effects, plus the official production tracker from `https://va.vercel-scripts.com/v1/script.js`. The SDK injects a deferred script and queues the privacy hook before pageviews. The tracker uses POST fetch requests, derives the current URL, reads `document.referrer` for the initial view, and has optional attribution localStorage and identity/cookie commands. This integration never calls identity, group, cookie-enable, custom event, or flag APIs. Vercel's official guidance describes a request-derived hash and a visitor session discarded after 24 hours. Network processing still involves request metadata such as IP and browser headers.

Cookie-free alone does not determine consent requirements. CNIL's audience-measurement exemption has purpose, data-use, and configuration conditions. The ICO's current statistical-purpose exception also has conditions, aggregation requirements, and an objection requirement, and is not a universal exemption. Rather than asserting this deployment satisfies every jurisdiction's exemption, App Expo requires affirmative consent everywhere. No analytics script or event is loaded/sent before permission. A compact, non-blocking first-visit panel presents Allow and Decline choices. Continue without analytics also records a decline. The panel closes after a choice; Analytics preferences at the bottom of every page reopens the controls for withdrawal or a changed choice. Existing choices remain valid until their existing expiry. The privacy notice explains the provider and processing before consent. DNT=1 and GPC=true override permission.

The sole preference record contains choice and expiry, lasts 180 days, and is separate from saved jobs. Expired/malformed/missing consent fails closed. Blocked storage uses page-lifetime memory. Withdrawal and changes in another tab are checked at every send, even if the provider script is already loaded. Withdrawal cannot undo previously sent aggregate data. The script can remain in memory after withdrawal, but the hook rejects subsequent sends. Clearing storage removes permission. No preference is transmitted to a server or used for another purpose.

The hook strips every page query and fragment, rejects credentials and unknown paths, and rejects custom events. Only explicitly known public paths can be transmitted. The SDK exposes URL/type, not an editable referrer, so the first pageview is suppressed when the incoming referrer contains any non-root path, parameters, fragment or credentials. Later manual pageviews do not include referrer data in the reviewed tracker. This intentionally loses entry pageviews from many links, including deep LinkedIn/social links, to avoid leaking private referrers. Root-origin referrers remain available. The site's `strict-origin` referrer metadata also prevents outgoing requests from carrying its full URL. Re-review the provider mechanism when updating the pinned SDK, because the hosted script can change independently.

## Verification

Run `npm run verify`. Analytics tests cover URL leakage, unsupported event rejection, malformed/expired consent, privacy signals, unsafe referrers, pre-consent blocking, withdrawal, and storage removal by another tab. Static output must include `/privacy` and preserve account-free job routes. See the task completion report for browser/payload verification and remaining production activation.

Local browser verification used the exported production build with analytics enabled, the reviewed official tracker served locally, and a local capture endpoint (no data sent to Vercel). Confirmed zero script requests/events before consent, one script after permission, one pageview per pathname transition, removal of `?role=software`, no events after Search or Save/Unsave interactions, and no new pageview after withdrawal and navigation. The internship board remained usable. Both disabled and enabled static builds passed. Production dashboard receipt remains an owner check.

## Official sources

- [Analytics pricing, features, cap behavior, and reporting window](https://vercel.com/docs/analytics/limits-and-pricing)
- [Hobby terms, usage and resumption behavior](https://vercel.com/docs/plans/hobby)
- [Free plans need no payment method](https://vercel.com/blog/improved-infrastructure-pricing)
- [Analytics privacy, collected data and visitor session](https://vercel.com/docs/analytics/privacy-policy)
- [SDK configuration and beforeSend](https://vercel.com/docs/analytics/package)
- [Dashboard metrics and referrer restrictions](https://vercel.com/docs/analytics/using-web-analytics)
- [Vercel privacy policy](https://vercel.com/legal/privacy-policy)
- [CNIL official audience measurement guidance](https://www.cnil.fr/en/sheet-ndeg16-use-analytics-your-websites-and-applications)
- [ICO official exceptions guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)
- [Umami Cloud FAQ](https://docs.umami.is/docs/cloud/faq), [usage](https://docs.umami.is/docs/cloud/usage), and [subscription/trial terms](https://docs.umami.is/docs/cloud/subscription)
