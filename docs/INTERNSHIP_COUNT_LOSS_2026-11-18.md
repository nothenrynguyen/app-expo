# Internship count-loss reconciliation, November 18, 2026

## Owner concern and correction to project reporting

The owner's observation of approximately 1,000 fewer internships is supported by history. Previous status updates emphasized total jobs and successful workflows, which did not make the internship-specific coverage loss clear. Workflow reliability, provider recovery and published coverage are separate outcomes. Recent reliability work is shipped, but the missing internship coverage is not restored and the intake-doubling target is not achieved.

## Exact published-count timeline

All times are Pacific. Counts are current internship postings, excluding internal availability holds after outage mode shipped.

| Snapshot | Local time | Current internships | Change |
| --- | --- | ---: | ---: |
| ac83bc8 | Nov 15, 1:25 p.m. | 4,160 | Baseline |
| d8bd860 | Nov 16, 12:20 p.m. | 3,598 | -562 |
| 3b8e9a3 | Nov 17, 5:24 p.m. | 3,123 | -475 |
| 96e79cc | Nov 18, 8:19 a.m. | 3,263 | +140 |

Net: **-897** from the November 15 baseline, despite **+140** since the November 17 low. A wider November 13 comparison is 4,182 to 3,263, or -919. The previously reported 5,331 is all current jobs, not the internship count.

## Baseline cohort reconciliation

Match the 4,160 November 15 internship opportunity identities against the latest current and held sets. In these two internship snapshots, row counts equal distinct opportunity-identity counts. There are 2,990 retained current baseline opportunities and 1,170 absent from current results. Of the absent baseline opportunities, 317 remain internally held and 853 are outside both current and held sets. The latter use the last recorded historical removal diagnosis, not a new live check of every old posting:

| Disposition of absent baseline opportunities | Count |
| --- | ---: |
| Internal outage holds, not confirmed closed | 317 |
| Employer/destination verification pending | 551 |
| Source unavailable | 137 |
| Unresolved omission | 112 |
| Scope exclusion | 48 |
| Confirmed closed | 4 |
| Deduplicated | 1 |
| Total absent from current results | 1,170 |

The current snapshot also contains **273 opportunities not in that baseline**: 4,160 - 1,170 + 273 = **3,263**. This is why cumulative old-posting losses exceed the net 897 decline. Closure cannot explain the majority of the decline. A previous admission or a missing/blocked input alone cannot prove that every absent job is still live either.

Of the 1,170 absent baseline opportunities, **1,010 have Workday URLs**, including all 317 current internal internship holds and 693 outside the hold set. This is a provider association, not proof of a single cause for every record. Historical evidence strongly concentrates the problem in employer availability/verification rather than ordinary closure.

## Sequence and causes supported by evidence

Before outage mode, November 15 to November 16 produced 621 internship removal events, 571 on Workday URLs. The recorded categories were 436 verification-pending, 138 source-unavailable, 26 scope exclusions, 19 unresolved and two confirmed closures. These are gross historical events across refreshes, not the final baseline-cohort table above. Workday continuity only retains positive exact-listing evidence for 24 hours; continued 429 responses and inability to renew evidence can therefore drain public inventory across otherwise completed refreshes.

On November 17, outage mode resumed safe publication while separating 316 internships into internal holds. That alone accounts for 316 of the 475 visible-count reduction in the first new snapshot. The remaining net 159 reflects other additions/removals during the interval. The code preserves those held jobs and their saved details, but public current counts exclude them. The owner explicitly requested no separate availability tab. This is a real availability/presentation-policy effect, not 316 proved closures.

The final current source report still has 36 Workday rate-limit records and 22 cooldown records. A green refresh means healthy sources updated and publication safeguards passed. It does not mean Workday recovered or old jobs were restored. Vercel deployment-storage usage is separate; deployed JSON matches the current generated snapshot, so missing production publication is not the explanation for this measured count loss.

## What recent work achieved

- Fixed collector crashes, bounded retry/progress persistence and publication handling so valid new snapshots can ship.
- Preserved proven outage-affected jobs internally, retained actual verification dates/saved identities, and consolidated source warnings into one ongoing incident.
- Added a constrained fallback from 11 existing reviewed feeds. The initial release admitted only five jobs overall; strict-source, employer and freshness requirements limited recovery. This did not solve broad Workday coverage.
- Corrected reviewed employer attribution, added exact official TikTok/ByteDance page checks and fixed a demonstrated graduate ML-research classification miss. The latest snapshot has 82 TikTok and 24 ByteDance jobs overall; this count is not all internship-only growth.
- Saved and rechecked one-week Vercel deployment retention. This addresses deployment-history storage, not missing internships.

These changes improved reliability and recovered some coverage, but they are not delivery of the owner's doubling goal. No broad net-new source expansion was completed in this work.

## Revised next milestone

Prioritize a bounded **internship coverage-recovery audit**, then new-source growth:

1. Review the largest missing Workday employer groups, separating stable employer identity from time-sensitive exact-listing availability and explicit source policy. Initial non-held examples include Booz Allen/Booz Allen Hamilton (50), Allegion (26), HNTB (20), GlobalFoundries (17) and Micron (16). These are historical baseline losses, not promises of recoverable live jobs.
2. Identify the actual missing requirement behind the 551 verification-pending diagnoses. The generic company-size reason is not itself a new employer audit; current official evidence can satisfy existing exception rules. Seek permitted current official alternatives or apply existing reviewed feed fallback where its gates actually allow it.
3. Restore only evidence-backed qualifying postings, in a measured batch, preserving quality checks, source rights, request caps, IDs and accurate verification dates. Do not bulk republish all missing records or relabel unknown jobs as closed.
4. Report internship-only additions, removals, restored baseline opportunities and current holds separately. Then review permitted sources that add genuinely new opportunities toward 37,530 unique intake, rather than duplicate rows.

This turn is an audit and priority clarification. No product code, admission threshold, source policy or external setting was changed. The audit helper and detailed history are retained locally in `.cache/internship-loss-audit.ts` and `.cache/internship-loss-audit.json`; the historical commit IDs above reproduce the published-count comparison.
