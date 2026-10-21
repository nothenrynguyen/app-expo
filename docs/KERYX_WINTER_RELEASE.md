# Keryx Winter 2027 local release review

Prepared October 20, 2026 (Pacific time), after owner approval to review Winter employers and official postings, run a local refresh, and review actual additions. **No push or deployment in this batch.**

## Result

- **15 new Winter listings** after destination, semantic and complete Workday requisition comparisons: 11 US and four Canadian roles.
- **34 listings carry Winter source credit**: 15 new and 19 already present by destination in the captured live baseline. New roles comprise Tevora (8), Gemini (2), RTX (4) and Insulet (1).
- The whole board contains **6,105 jobs**, compared with **6,014** in the captured live baseline. The net gain of 91 includes other-source changes and employer-review effects, not just Winter.
- There are 73 other new destination rows at the four reviewed employers: Disney 27, RTX 45 and Gemini 1. These are descriptive comparison counts, not a controlled proof that every addition was caused by the trust-record change. They passed current pipeline rules; they were not all individually manually verified.
- **16 unresolved destinations remain held**, including recognized Workday aliases and any copies from other feeds. The final snapshot contains none of their held identities. They were not declared closed merely because official detail access returned 403.

Baseline generatedAt: `2026-10-20T22:23:39.441Z`. Final local generatedAt: `2026-10-21T00:48:23.976Z`. The local calendar date is October 20. [Measurement and new Winter jobs](keryx-winter-release-result.json).

## Changes and evidence

1. Added the existing Keryx Winter file using the existing direct-ATS parser. Source trust and full employer-board expansion remain disabled. The final refresh parsed 52 candidate rows; the earlier research sample had 53. Source inputs can change during review.
2. Reviewed four exact employer names using official company evidence. [Employer and posting review](KERYX_WINTER_EMPLOYERS.md). Fourteen original leads had job-specific open-application evidence, and a distinct Insulet role was independently verified through its official job record.
3. Fixed the false Insulet requisition overlap: year-prefixed IDs now retain their complete number. An old cached closure for that electrical-engineering posting was superseded by fresh official evidence that it is posted and accepting applications. The existing embedded-software requisition remains distinct.
4. Corrected Canadian employer codes such as `CA-QC-LONGUEUIL`. They identify Canada, not California or a US building-state abbreviation. Seven country labels changed in the initial local repair; no eligibility or job identity changed. The final refresh applies the corrected shared classifier directly. Canada remains supported, but its jobs must not appear as US-only results.
5. Added explicit reviewed-destination holds to ingestion. Holds apply across feeds and recognized Workday requisition aliases. Outage recovery cannot restore those destinations. This preserves known unresolved cases without claiming that they are closed or granting blanket source trust.

The [official-check receipt](keryx-winter-official-review.json) contains sanitized outcomes and response hashes. Full job descriptions remain in ignored cache. Source attribution remains covered by the existing MIT notice. No accounts, paid services, provider outreach, billing, backend or new ATS-board crawler were added.

## Validation

- **82 tests pass**, including hold aliases across feeds, distinct requisitions sharing a year, and Canadian province-coded locations.
- Lint, TypeScript and static export pass. Windows initially blocked Next build-cache directory creation; the isolated rerun with required filesystem permission succeeded.
- Zero invalid URLs, location failures, freshness failures, duplicate IDs or duplicate destinations in the snapshot audits.
- Exported internship data contains all 34 Winter-credited records with the matching snapshot timestamp. Exported Sources HTML includes Winter attribution. Canadian-coded Winter records are tagged Canada.
- All **26 feeds succeeded**. The three existing employer-board 404s remain: Interaction, WhatNot and Atomic Semi. No new source failure was introduced.
- Interactive browser verification was not repeated because the app browser URL policy previously blocked preview access. Static build, artifact checks and shared filter/location regression tests provide this batch's validation; no browser rendering pass is claimed.

## Publication and next actions

1. Recommended next approval: publish this reviewed local release.
2. After approval, push and verify the production refresh, new snapshot timestamp, Winter source credit, country labels and continued exclusion of held destinations.
3. Revisit the sixteen held destinations only when official access or evidence improves. No outreach, paid workaround or automatic hold clearing is planned. Future seasonal collection discovery remains pending review by default.
