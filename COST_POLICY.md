# empluzzed Zero-Cost Policy

empluzzed is intentionally operated without a billing account or payment method. Product and infrastructure decisions must preserve that constraint.

## Hard requirements

- Do not add a service that requires a credit card or other payment method.
- Do not enable usage-based billing, automatic overages, paid add-ons, trials that convert to paid service, or resources that continue accruing charges.
- Prefer static generation, browser-local storage, committed aggregate data, and free public-repository automation.
- A free-tier limit must stop, pause, or degrade gracefully. It must never create a charge.
- Core browsing, filtering, and direct application links remain free and do not require an account.
- Monetization is out of scope for empluzzed.
- Do not integrate paid job-source products or application services. Do not route applicants through a paid-service upsell to reach a free employer application. Record rejected candidates in [the source exclusion register](docs/SOURCE_EXCLUSIONS.md) and do not reconsider them unless the owner explicitly requests it.

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
- Email, SMS, push-notification, AI, r�sum�-processing, or payment APIs
- Paid analytics, monitoring, queues, storage, or background workers
- Any monetization feature, including employer payments, advertisements, subscriptions, affiliate revenue, or sponsored listings
- Any hosting change that could introduce charges

## Dependency checklist

Before adding an external service, verify and document:

1. No payment method is required.
2. The free tier does not permit billable overages.
3. The behavior at the limit is known and acceptable.
4. Data collection and retention are appropriate for a job-search product.
5. The service's terms permit empluzzed's current use.

If any answer is unknown, do not add the service.

## Reviewed analytics decision (September 30, 2026)

Vercel Hobby Web Analytics is approved for this personal, non-commercial project with affirmative visitor consent. It requires no payment method or paid trial. The allowance is 50,000 events/month shared across team projects; extra events cannot be purchased or billed on Hobby and collection pauses at the limit. The reporting window is one month, not a guaranteed deletion deadline. Custom click events and UTM reporting are not included. Scripts and intake requests also consume included hosting resources. Keep the project on Hobby, do not enable upgrades/add-ons, and leave analytics disabled in preview/development. Detailed official evidence, cap/resumption documentation differences, privacy safeguards, and owner activation steps are in [docs/ANALYTICS.md](docs/ANALYTICS.md).

## Owner-approved activity milestone (October 22, 2026)

The owner explicitly approved implementing and deploying free activity analytics and protected reports while preserving account-free browsing. The scoped design permits one Cloudflare Workers Free collector and one D1 Free database for analytics only, subject to verifying the actual account is Free with no payment method. Paid Workers, paid storage, visitor authentication and personal-record hosting remain excluded. Official limits, no-card evidence, cap behavior, privacy changes and production activation requirements are documented in [owned analytics](docs/OWNED_ANALYTICS.md).

The public app remains a static export. The new collector stays disabled until provisioned and verified, and Vercel page views remain the fallback. No owner key or reporting data may be placed in frontend builds or public repository snapshots. The application safety limits supplement provider caps; neither is an authorization to upgrade.
