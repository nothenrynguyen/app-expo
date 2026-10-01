# Aggregate analytics reassessment

Reviewed September 30, 2026. Research only: the deployed opt-in Vercel integration has not been replaced.

The goal is counts of site use for improving App Expo, without identifying people, joining their actions, or making browsing conditional on agreement. Being non-commercial does not itself exempt analytics from privacy requirements.

## Recommendation

GoatCounter is the strongest technical candidate for free aggregate page views, referral origins, collection choices, filter usage, Apply clicks, and Save/Unsave clicks. Recommend a deliberately restricted integration, rather than its default tracking settings. Approval under COST_POLICY.md remains pending: its official fair-use terms do not specify a numerical allowance or exact behavior when usage becomes excessive.

Default-on measurement with a clear notice and immediate opt-out is a possible outcome of a documented audience-measurement exemption assessment. It is not a blanket legal conclusion for every country. Do not remove the present opt-in simply because a provider advertises cookie-free analytics.

## Comparison

| Setup | Free support and limits | Assessment |
| --- | --- | --- |
| Vercel Hobby | 50,000 events/month shared across team; no custom events; one month guaranteed reporting, not guaranteed deletion; collection pauses, with inconsistent official resumption descriptions | Existing approved fallback. Cannot answer action-count questions. See [current integration](ANALYTICS.md). |
| GoatCounter hosted | Free for reasonable public usage, including personal sites and small-to-medium businesses; custom events supported; no numerical included allowance or precise excessive-use procedure published | Best candidate, subject to provider clarification and privacy configuration. Signup asks for account name, email and password, not payment details. No paid subscription or automatic trial conversion is presented. |
| Cloudflare Web Analytics | Free, six months history; sampling after seven days; no custom events; can work on a Vercel site without moving hosting | Good traffic-only alternative, misses the requested actions. |
| Simple Analytics Free | No-card 14-day trial, then explicitly select free plan; five sites, one user, required badge, 30-day history with older data deleted; unlimited page views subject to fair use and email notice | Not selected. Current official pricing does not establish free custom-event entitlement or exact enforcement after a fair-use notice. General event documentation is not proof of free-plan access. |

Do not treat old third-party claims of a GoatCounter 100,000-view monthly limit as current official pricing. Its published terms describe reasonable usage and say millions of views per day are unsuitable.

## Proposed GoatCounter configuration

1. Owner manually registers at [GoatCounter signup](https://www.goatcounter.com/signup). Automated initial registration is prohibited by its terms.
2. Dashboard access remains restricted to logged-in users. No public dashboard, share link, visitor counter or embedded report. Owner dashboard would be `https://YOURCODE.goatcounter.com/`.
3. Disable Sessions and Individual pageviews. Also disable screen size, browser/OS, location and language collection. Retain only aggregate page/event counts and sanitized referral origins. Default sessions otherwise use site + IP + User-Agent in memory for up to eight hours.
4. Set a proposed 90-day retention period and verify the hosted setting and deletion behavior before activation. Current upstream settings code accepts positive retention values from 31 days to five years; this is evidence of capability, not confirmation of the deployed service configuration. Account deletion can leave backups for up to 30 days.
5. Use a small browser sender to the documented `/count` endpoint, with sessions disabled on every request. The inspected official `count.js` independently sends `location.search` as `q`, even when a custom path is supplied. Merely stripping the page path is insufficient. Do not install the stock script unchanged.
6. Send only fixed known page paths and bounded event names, such as `collection-internships`, `filter-workplace`, `apply-click`, `save-click`, and `unsave-click`. No job IDs, employer application URLs, raw search text, company names from free text, notes, device identifiers, query strings or fragments. Count use of search, if wanted, without its contents. Referral information should be origin-only, omitted when unsafe, and not attached to action events.
7. Honor existing declines plus DNT/GPC. Show a short visible explanation and a free, one-click opt-out. Store only the preference locally. Any default-on change requires updating the privacy notice to describe actual collection and retention.
8. Verify real network payloads, server settings, private dashboard receipt, repeat-click counts, opt-out, navigation and sensitive-URL exclusion before production activation. Remove Vercel tracking if switching to avoid duplicate providers.

The provider still receives ordinary network information needed to accept requests, including IP and browser headers. Disabling analytics dimensions is not a promise that networking never processes them. Official privacy documentation says stored statistics are separate hourly/daily aggregates; disabling sessions avoids their normal visitor deduplication, and disabling individual pageviews avoids stored per-request rows.

## What the results would mean

Counts can show which collections and controls are used and how often Apply/Save/Unsave are clicked. Apply counts mean outbound clicks, never completed applications. Without visitor linking there are no unique-person totals, repeat-visitor metrics, individual journeys or person-level conversion funnels. Reloads and repeat clicks count again. Ad blockers, disabled JavaScript, missing referrals and opt-outs leave gaps. Aggregate ratios are descriptive, not probabilities that a person applied or saved.

## Consent assessment and remaining evidence

The [ICO statistical-purpose guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/) permits a narrowly defined statistical-use exception with information and a simple free objection mechanism. It concerns improving the service using aggregates, not profiling visitors. Its detailed requirements must be checked against actual processing and third-party arrangements.

The [CNIL audience-measurement guidance](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience) also describes a conditional exemption: limited audience measurement for the publisher, anonymous statistics, no cross-site tracking or combining datasets, and appropriate retention. It directs publishers to obtain provider evidence. Vendor self-assessment is not regulator certification. National rules and territorial applicability still matter.

GoatCounter's [own consent discussion](https://www.goatcounter.com/help/gdpr) is qualified, not an unconditional legal guarantee. Before activating default-on internationally, document the audience/jurisdictions served and obtain provider clarification about acting only for the publisher, any independent data reuse, and any required processing agreement. The minimalist configuration is designed to support that assessment; it cannot prove exemption by itself.

Two concrete questions for `support@goatcounter.com` (no message has been sent):

- For this free public non-commercial job board, what usage is acceptable, and what exactly happens above it? Confirm that no payment method, automatic upgrade, invoice or billable overage is involved and that excessive usage can only stop or restrict collection.
- With sessions and individual pageviews disabled, minimal collection and 90-day retention, confirm aggregate-only retention/deletion, any operational logs/backups, publisher-only processing/no independent reuse, and available contractual evidence for audience-measurement exemptions.

Until those answers close the cost-policy and privacy gaps, keep the approved opt-in integration. No backend, authentication, database or hosting migration is needed for the proposed integration.

## Follow-up review

The official FAQ adds that the operator prefers contacting users sending millions of page views before shutting down an account. This narrows the likely operational response but does not establish an enforceable cap or guarantee the exact excessive-use procedure. No replacement is activated under the cost policy.

The upstream changelog also documents a 30-day bot-record table. Confirm its hosted behavior and fields before describing all provider storage as aggregate-only. Disabled individual visitor records do not establish that operational or bot logs are absent. See the [official changelog](https://github.com/arp242/goatcounter/blob/main/CHANGELOG.md).

The [ICO territorial guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-pecr-rules/) distinguishes a service merely accessible in the UK from offering services to, or monitoring people in, the UK. The previous exemption discussion is conditional, not a finding that UK rules necessarily govern App Expo. Owner location and intended audience still need confirmation; neither visitor citizenship nor a public URL alone settles applicability.

The owner subsequently confirmed operating from the US and promoting App Expo mainly to US job seekers. Assess it as US-focused; do not assume UK/EU requirements apply merely because the site is accessible there. This does not itself decide every applicable US rule or establish that particular tracking never constitutes monitoring abroad. Reassess if audience targeting or personal tracking changes. A default-on, minimal aggregate setup remains the proposed direction, pending provider evidence and final implementation review.

A [ready-to-send provider inquiry](GOATCOUNTER_PROVIDER_QUESTIONS.md) captures the unresolved questions. No email or support form has been submitted. Provider answers are necessary to close the unknown-limit condition in COST_POLICY.md, which says: "If any answer is unknown, do not add the service."

Implementation can preserve static export and existing account-free browsing. Collection links, filter handlers, job-row Apply links and saved-job toggles would receive fixed event labels. Sending job objects, saved IDs or destination URLs is unnecessary. No application-tracker backend is introduced in this analytics change.

## Source links

- [GoatCounter terms and current free usage scope](https://www.goatcounter.com/help/terms)
- [GoatCounter events](https://www.goatcounter.com/help/events), [sessions](https://www.goatcounter.com/help/sessions), [privacy](https://www.goatcounter.com/help/privacy), [JavaScript API](https://www.goatcounter.com/help/js), [custom browser integration](https://www.goatcounter.com/help/pixel)
- Inspected [official client script](https://gc.zgo.at/count.js), [upstream settings](https://github.com/arp242/goatcounter/blob/main/settings.go), and [aggregation/session implementation](https://github.com/arp242/goatcounter/blob/main/memstore.go). Upstream source can differ from the hosted release.
- [Vercel analytics limits](https://vercel.com/docs/analytics/limits-and-pricing)
- [Cloudflare FAQ, events and retention](https://developers.cloudflare.com/web-analytics/faq/), [free service](https://www.cloudflare.com/web-analytics/)
- [Simple Analytics pricing and free-plan behavior](https://www.simpleanalytics.com/pricing), [collected metrics](https://docs.simpleanalytics.com/what-we-collect)
