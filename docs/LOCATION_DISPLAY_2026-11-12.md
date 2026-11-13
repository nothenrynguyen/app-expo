# Location display cleanup, November 12

Implemented locally in the shared board display path, used by compact results and cards. Source location strings, filtering, eligibility, IDs and saved records remain unchanged.

- Normalize comma spacing and country/state/city ordering.
- Render recognized US state and Canadian province site codes as city/state or city/province/country, omitting street/building suffixes.
- Shorten recognized city/state/ZIP/building formats, retaining Hybrid/Remote annotations.
- Simplify recognized state-specific work-at-home labels without removing the state restriction.
- Add an explicit bare San Jose alias to San Jose, CA. This is an inference for that bare label, not general geocoding. Explicit foreign locations and ambiguous unmatched cities remain unchanged.
- Keep multiple locations and existing compact summaries.

Examples: Billerica,MA becomes Billerica, MA; US, CA, Santa Clara becomes Santa Clara, CA; US-TX-MIDLAND-2101 MARKET STREET becomes Midland, TX. Unknown formats pass through with whitespace cleanup. This is conservative formatting, not a guarantee that every source supplies complete geographic information.

Validation: 72 core tests pass; final focused location cases also cover hyphenated Canadian cities, unknown codes, foreign San Jose and idempotence. Focused lint and TypeScript checked separately. Browser visual review remains for the local preview. Publication approved November 12. All 194 tests, full lint, TypeScript and production export pass. Production deployment verification remains separate. No Updates milestone for this minor display refinement.
