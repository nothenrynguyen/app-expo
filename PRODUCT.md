# empluzzed

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students and early-career job seekers looking for internships and full-time opportunities. They need to find and compare relevant jobs quickly, without creating another account.

## Product Purpose

Bring reviewed job sources into one always-free place to browse, filter, save roles, and track applications. The owner confirmed that faster discovery and comparison of relevant jobs is the first priority when product tradeoffs arise.

## Positioning

Account-free browsing combines maintained public job sources with employer career boards, duplicate cleanup, and preferred employer application links. Some links still go through a source board. Optional browser-local saves and application tracking keep the search together without requiring a hosted personal account.

## Operating Context

- Visitors browse Internship and Early Career collections, filter opportunities, inspect details, and open application links.
- Visitors can save roles and track applications from any source with dates, statuses, and notes.
- Personal records remain in the current browser profile. There is no cross-device sync; backups matter before clearing browser storage.
- The public app uses a Next.js static export with React and TypeScript. Development starts with `npm run dev`.

## Capabilities and Constraints

- Always free. Core browsing, filtering, and application links require no account.
- Supported locations are the United States, Canada, and United Kingdom; the board starts with U.S. roles selected.
- Career scope includes software, data, engineering, product and technical program management, design, business, finance, IT, and related technical roles. Legal, healthcare, education, and general science careers are outside scope.
- Refreshes are scheduled hourly. This is a schedule, not a guarantee of a successful hourly publication or a fresh check of every listing.
- Listings are leads, not endorsements. Employer pages remain authoritative for availability, compensation, location, and eligibility. Date precision does not prove an employer posting date.
- Preserve source permission reviews, admission rules, and coverage safeguards. Do not bypass access controls or imply exhaustive coverage.
- Preserve the zero-cost policy in `COST_POLICY.md`: no payment method, billable overages, paid-service upsells, or monetization. New hosted personal storage and authentication require separate review.
- Analytics are optional, and application records and notes are excluded. Owner reports remain private.
- Pushing and deployment require explicit approval; local design work does not authorize publication.

## Brand Commitments

- Name: empluzzed, styled lowercase in current product copy.
- Voice: direct, approachable, personal, and candid about limitations, consistent with the existing homepage and About page.
- Preserve the always-free and account-free commitments. Do not invent coverage, placement, customer, or outcome claims.
- Never use em dashes in user-facing copy.

## Evidence on Hand

- `README.md`: product summary and policy entry points.
- `app/page.tsx` and `app/about/page.tsx`: existing purpose, voice, and user workflows.
- `app/methodology/page.tsx`: supported scope, source checks, freshness, and limitations.
- `COST_POLICY.md`: operating costs and external-service constraints.
- `ROADMAP.md` and `docs/ACTIVE_TASKS.md`: priorities and historical release evidence. Verify current operational state before repeating status or counts.
- Existing application code and assets establish an incumbent interface. This product record does not authorize replacing its visual identity.
- Owner confirmation on November 21, 2026: product brief accepted; finding and comparing relevant jobs faster is the primary design priority.

## Product Principles

1. Reduce the time and effort needed to find and compare relevant opportunities.
2. Keep browsing and access to application links free and account-free.
3. Prefer employer evidence and direct links, with clear limits on freshness and coverage.
4. Keep personal search records under the visitor's control and explain browser-local storage honestly.
5. Preserve zero-cost operation and permission-conscious sourcing as the product grows.
