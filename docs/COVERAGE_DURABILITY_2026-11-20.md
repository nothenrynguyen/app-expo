# First coverage durability check, November 20, 2026

## Observation window

The owner returned just after midnight Pacific for the approved 24–48 hour checkpoint. The first scaling release was November 18 at 11:25 p.m. Pacific. Latest inspected snapshot `35c1cd8`, generated November 20 at 08:21 UTC (12:21 a.m. Pacific), is approximately twenty-five hours later. The GitHub API shows all 31 refresh attempts since first publication succeeded, including 25 hourly scheduled attempts. Twenty-six subsequent changed snapshots were audited locally. No collection code changed between the release receipt and this check.

## Growth and queue progress

Compared with verified release snapshot `66acfd5`:

| Metric | Release | Current |
| --- | ---: | ---: |
| Current internships | 3,332 | 3,427 |
| Current early-career jobs | 2,267 | 2,355 |
| Total current | 5,599 | 5,782 |
| Internal holds | 615 | 627 |
| Pending candidate opportunities | 7,466 | 7,149 |
| Intake rows | 23,954 | 24,345 |
| Unique intake identities | 18,892 | 18,910 |
| Discovered / retained boards | 321 / 390 | 408 / 360 |

Current inventory is net +183 (+95 internships / +88 early-career jobs). Exact opportunity comparison shows 333 additions and 150 exits from the current collection, not 183 additions with no turnover. Largest additions include 135 Langan opportunities, seventeen SpaceX and ten Amazon. These are new to the observed public inventory, not proof every vacancy was newly created or caused only by the adapters.

The resolver has inspected 2,800 source URLs and stores 571 supported mappings: 336 Vansh and 235 Dreamwork. Unknown/unsupported outcomes are not jobs verified closed. The latest lane confirms 406 eligible destinations against current employer boards; many overlap existing postings. It still makes no more than 100 source requests per run. Across the audited snapshots, shared adapter requests peaked at 199, below the existing 250 generic-plus-adapter budget; public-index requests peaked at 27, career-page requests at fifty and HNTB at thirty. Board selection remains within existing limits. No request cap was raised.

All 21 feed health records are healthy. Employer diagnostics remain degraded: 766 healthy, one partial, one unavailable (Iterable 404), and 58 Workday cooldown records. The recovery lane is partial. Successful workflows mean safe publication, not universal provider recovery.

## Turnover and bounded posting checks

Of the 150 baseline opportunities no longer current, thirteen are internally held. The remaining historical disappearance diagnoses are thirty pending verification, 91 unresolved, ten scope exclusions, one deduplicated and five source-unavailable. These are the last recorded disappearance categories, not fresh posting-level closure determinations. In particular, board/source omission does not establish closure. Some historical closure conflicts involve older positive cache evidence and therefore remain conservatively unresolved.

Ten exact public Greenhouse posting API checks sampled unresolved disappearances across Anduril, Scout Motors, National Life, Hyperquake, PlayStation, Schneider Downs and SpaceX. All returned posting-level 404, with no positive posting record. None was restored. This supports unavailability for those ten samples and is not extrapolated to the rest. No throttled Workday endpoint was queried.

## Retention gap found and fix

Two previously published GlobalFoundries jobs still have current official-index membership and recent positive employer-detail records, but their community feed no longer emits candidates. The new adapter originally considered only current feed candidates. That allowed a source omission to stop further employer verification even though current official evidence could support the posting.

The fix adds previously published/held, exactly scoped GlobalFoundries requisitions to the adapter's discovery queue only when their prior source is still active and passes the loader's permission review. Current candidates deduplicate these leads. Old job metadata supplies discovery and provenance only. A missing-feed lead enters intake only if the adapter obtains or reuses still-valid exact employer evidence; unknown, expired, held or ineligible checks do not create a new admission. Company, availability, role, compensation, location, freshness and review-hold checks remain effective. Existing URLs are retained and public-ID preservation remains in place.

Regression coverage checks inactive source provenance, duplicate/current candidates, wrong career sites, discovery without positive evidence, fresh official confirmation and failed verification. The first publication (`1458363`) exposed a TypeScript error in the new test fixture: it omitted required `verifiedCompany` and `linkedInUrl` fields. Vercel rejected that build, while the previous site remained live. The local validation command's exit status had not been checked correctly when reviewing test output. The fixture now supplies the required fields; a clean nonincremental type check and the full 254-test/lint/build command are rerun with explicit exit-status handling. No credit, storage, plan or security setting changed. Production verification remains pending.

## Recommended next steps

1. Publish and verify the scoped retention fix, measuring actual returned postings and preserved IDs.
2. Continue automated source resolution; measure qualifying growth after overlap rather than raw mapping counts.
3. Prioritize unresolved losses by shared employer system and exact evidence, preserving provider cooldowns.
4. Recheck the new fix and the original queues after another scheduled observation window. The doubling target and broader expansion project remain open; prior approval covers this work.
