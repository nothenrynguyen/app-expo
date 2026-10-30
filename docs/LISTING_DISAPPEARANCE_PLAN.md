# Listing disappearance explanations

Saved October 30, 2026 at the owner's request. Deferred while the location display improvement ships. This is a proposed permanent pipeline upgrade, not a one-time audit or implementation authorization.

## Outcome

Every refresh should explain missing opportunities in terms an owner can investigate: URL replacement, confirmed closure, intentional scope exclusion, unreliable source check, or unresolved omission. Do not turn an absence into closure evidence or automatically restore old listings.

## Existing foundation and remaining work

`lib/ingestion/listing-changes.ts` already records per-removal reasons and same-opportunity URL replacements. Build on this rather than replacing it. Improve ambiguous cases with the actual source/board evidence and a clear investigation trail. Reconcile unique opportunity totals separately from legacy URL-row counts so duplicate compaction cannot be mistaken for lost coverage.

Use the existing report and refresh infrastructure. Preserve exact Workday employer/site/requisition identity, source-permission gates, freshness limits and conservative publication guards. No new service or public page is required.

## Verification and value

Test representative URL replacements, explicit closures, policy exclusions, source failures and uncertain omissions. Require consistent opportunity totals and useful evidence for unresolved cases. Then inspect one real refresh without treating that single run as the feature itself.

Expected effort: roughly one focused development day, subject to the unresolved cases found. The result should reduce manual refresh investigations and misleading closure claims, while providing an interview-defensible example of handling uncertain external data. This improves diagnosis; it does not promise that all missing listings will be recovered.
