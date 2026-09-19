# App Expo Zero-Cost Policy

App Expo is intentionally operated without a billing account or payment method. Product and infrastructure decisions must preserve that constraint.

## Hard requirements

- Do not add a service that requires a credit card or other payment method.
- Do not enable usage-based billing, automatic overages, paid add-ons, trials that convert to paid service, or resources that continue accruing charges.
- Prefer static generation, browser-local storage, committed aggregate data, and free public-repository automation.
- A free-tier limit must stop, pause, or degrade gracefully. It must never create a charge.
- Core browsing, filtering, and direct application links remain free and do not require an account.
- Monetization is out of scope for App Expo.

## Approved architecture

- Next.js static export
- Vercel Hobby for this personal project
- Standard GitHub-hosted Actions for a public repository
- Browser `localStorage` for optional personal state
- Small generated JSON snapshots and bounded aggregate history committed to the repository
- Optional free analytics only when they can be enabled without a payment method and stop at their included cap

## Requires a new review

Do not add any of the following without revisiting this policy and obtaining the project owner's explicit approval:

- Hosted databases or authentication
- Email, SMS, push-notification, AI, résumé-processing, or payment APIs
- Paid analytics, monitoring, queues, storage, or background workers
- Any monetization feature, including employer payments, advertisements, subscriptions, affiliate revenue, or sponsored listings
- Any hosting change that could introduce charges

## Dependency checklist

Before adding an external service, verify and document:

1. No payment method is required.
2. The free tier does not permit billable overages.
3. The behavior at the limit is known and acceptable.
4. Data collection and retention are appropriate for a job-search product.
5. The service's terms permit App Expo's current use.

If any answer is unknown, do not add the service.
