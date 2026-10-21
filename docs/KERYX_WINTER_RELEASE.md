# Keryx Winter 2027 local release review

Prepared October 20, 2026 (Pacific time), after owner approval to review Winter employers and official postings, run a local refresh, and review actual additions. **No push or deployment in this batch.**

## Result

- **15 new Winter listings** after destination, semantic and complete Workday requisition comparisons: 11 US and four Canadian roles.
- **35 listings carry Winter source credit**: 15 new and 20 already present by destination in the captured live baseline. New roles comprise Tevora (8), Gemini (2), RTX (4) and Insulet (1).
- The whole board contains **6,092 jobs**, compared with **6,014** in the captured live baseline. The net gain of 78 includes other-source changes and employer-review effects, not just Winter.
- There are 74 other new destination rows at the four reviewed employers: Disney 27, RTX 46 and Gemini 1. These are descriptive comparison counts, not a controlled proof that every addition was caused by the trust-record change. They passed current pipeline rules; they were not all individually manually verified.
- **16 unresolved destinations remain held**, including recognized Workday aliases and any copies from other feeds. The final snapshot contains none of their held identities. They were not declared closed merely because official detail access returned 403.

Baseline generatedAt: `2026-10-20T22:23:39.441Z`. Final local generatedAt: `2026-10-21T05:24:16.064Z`. The local calendar date is October 20. [Measurement and new Winter jobs](keryx-winter-release-result.json).

## Changes and evidence

1. Added the existing Keryx Winter file using the existing direct-ATS parser. Source trust and full employer-board expansion remain disabled. The final refresh parsed 53 candidate rows; the earlier research sample had 53. Source inputs can change during review.
2. Reviewed four exact employer names using official company evidence. [Employer and posting review](KERYX_WINTER_EMPLOYERS.md). Fourteen original leads had job-specific open-application evidence, and a distinct Insulet role was independently verified through its official job record.
3. Fixed the false Insulet requisition overlap: year-prefixed IDs now retain their complete number. An old cached closure for that electrical-engineering posting was superseded by fresh official evidence that it is posted and accepting applications. The existing embedded-software requisition remains distinct.
4. Corrected Canadian employer codes such as `CA-QC-LONGUEUIL`. They identify Canada, not California or a US building-state abbreviation. Seven country labels changed in the initial local repair; no eligibility or job identity changed. The final refresh applies the corrected shared classifier directly. Canada remains supported, but its jobs must not appear as US-only results.
5. Added explicit reviewed-destination holds to ingestion. Holds apply across feeds and recognized Workday requisition aliases. Outage recovery cannot restore those destinations. This preserves known unresolved cases without claiming that they are closed or granting blanket source trust.

The [official-check receipt](keryx-winter-official-review.json) contains sanitized outcomes and response hashes. Full job descriptions remain in ignored cache. Source attribution remains covered by the existing MIT notice. No accounts, paid services, provider outreach, billing, backend or new ATS-board crawler were added.

## Validation

- **82 tests pass**, including hold aliases across feeds, distinct requisitions sharing a year, and Canadian province-coded locations.
- Lint, TypeScript and static export pass. Windows initially blocked Next build-cache directory creation; the isolated rerun with required filesystem permission succeeded.
- Zero invalid URLs, location failures, freshness failures, duplicate IDs or duplicate destinations in the snapshot audits.
- The original reviewed export contained all 34 then-current Winter-credited records with the matching snapshot timestamp. Exported Sources HTML includes Winter attribution. Canadian-coded Winter records are tagged Canada.
- All **26 feeds succeeded**. The three existing employer-board 404s remain: Interaction, WhatNot and Atomic Semi. No new source failure was introduced.
- Interactive browser verification was not repeated because the app browser URL policy previously blocked preview access. Static build, artifact checks and shared filter/location regression tests provide this batch's validation; no browser rendering pass is claimed.

## Publication and next actions

1. Publication approved and release c248726 pushed. Deployment succeeded; the initial live snapshot has 6,092 jobs and 35 Winter-credited records.
2. Automatic refresh 39549427823 passed and snapshot 4b30025 deployed successfully. Live has 6,091 jobs, 35 Winter records, all 26 feeds healthy and zero held identities. [Production receipt](keryx-winter-production-result.json).
3. Revisit the sixteen held destinations only when official access or evidence improves. No outreach, paid workaround or automatic hold clearing is planned. Future seasonal collection discovery remains pending review by default.

## Approved publication reconciliation

Rebased the reviewed release onto three newer scheduled data commits, then regenerated the snapshot. All 82 tests and data identity/location/freshness audits pass. The refreshed snapshot has 6,092 jobs and 35 Winter-credited records, retaining the same 15 new Winter destinations versus the captured baseline. All 26 feeds succeeded. The 16 held destinations remain absent. A fresh official-detail recheck still returned 403 for all 16, so no hold was cleared. See [hold recheck](keryx-winter-hold-recheck.json).
