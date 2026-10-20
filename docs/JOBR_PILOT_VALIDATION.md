# Jobr pilot validation and publication decision

Checked October 20, 2026. The owner approved validation, a local pilot if validation passed, and a review of actual additions. This review closes that conditional batch.

## Decision: do not enable Jobr

Jobr contains real, relevant jobs. The blocker is a reliable direct application path for our automatic pipeline. Its documented feed returns a Jobr intermediary URL, not an employer URL. All 60 initial automated checks returned HTTP 403. A normal browser passed the automatic security check and revealed a choice between a paid application service and a free employer link. Three representative jobs followed that same pattern.

This corrects the earlier uncertainty: the sampled links are not proven broken for browser users. They also are not simple automatic redirects to employers. The paid option does not charge empluzzed or require us to subscribe, but it adds an unrelated commercial decision before the employer application.

The current feed contract does not provide a raw employer URL. Reliably populating those links would therefore require another supported data path or ongoing manual/browser extraction. The tested automated path is blocked. Do not build a browser scraper, route our Apply button through that upsell, or treat three manually recovered links as a sustainable source adapter.

## Representative official checks

The following were opened through the public Manual Apply destinations and verified on the employer pages, without starting an application or creating an account:

| Area | Employer and role | Official identifier | Evidence |
| --- | --- | --- | --- |
| Accounting | Hermès, Accounting Intern (2027 Semester 1), Generation H | Oracle 24455 | [Employer posting](https://fa-eoic-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_12001/job/24455): New York, beginner internship, $20/hour. Posting identifies Hermès of Paris as the legal employer and describes more than 1,500 associates and US operations. |
| Operations | Four Hands, Business Operations Analyst Intern | Greenhouse 4458217009 | [Employer posting](https://job-boards.greenhouse.io/fourhands/jobs/4458217009): Austin, January through April 2027, current student requirement, application form present. Employer description states over 800 employees and Austin headquarters. Compensation amount not disclosed in the visible posting; no claim of a verified salary. |
| Mechanical engineering | Zebra Technologies, 2027 Summer Internship (US), Mechanical Engineer | Workday JR103627 | [Employer posting](https://zebra.wd501.myworkdayjobs.com/Zebra_careers/job/Holtsville-New-York/XMLNAME-2027-Summer-Internship--US----Mechanical-Engineer_JR103627): Holtsville, mechanical-engineering student, graduation in 2029, $30/hour in the description. Generic salary fields also show zero, so those fields must not override the explicit pay statement. |

All three official URLs returned HTTP 200. Their exact destinations are absent from the fetched production snapshot, which still reports **2026-10-20T18:32:42.461Z and 5,990 jobs**. Exact absence does not independently exclude aliases or prove net additions. These are three verified job pages, not three approved publication records. No company registry approvals or public jobs were added.

The first two pages supply useful employer-size and US-presence evidence for a future source-independent review. Zebra's posting verifies the role and location, but this review did not separately establish its employer-size record. The remaining 57 held leads were not individually employer-verified after the shared application-path gate failed. That limit is deliberate: more manual link recovery would not repair the feed contract.

## Approved steps and outcome

1. **Validation complete.** Rechecked the feed documentation and tested the normal-browser application path, then verified three official listings across three role areas. Retained employer and duplicate uncertainty instead of promoting raw leads into additions.
2. **Local integration pilot not built.** This step was conditional on successful validation. The reliable automatic direct-application gate failed, so the adapter would add maintenance work without a publishable source. The separate threshold of ten fully approved unique additions was not established.
3. **Publication review complete: no release.** Zero Jobr additions are approved for publication. No active feed, workflow, source catalog, company registry, public snapshot or frontend changed. No push, deployment, provider contact, subscription or account creation occurred.

The [sanitized validation receipt](jobr-pilot-validation.json) records the three observed source-to-employer mappings, checks and limits. Raw employer responses stay in ignored local cache. The [original measurement](self-service-source-measurement.json) remains a historical sample rather than being rewritten to imply full verification.

## Next recommendation

Measure **Keryx's Spring 2027 internship collection** before hunting another provider. Keryx is already integrated, but `data/sources.json` currently enables only its Summer 2027 internships and 2027 new-grad collection. The [Spring collection](https://github.com/GodlyDonuts/keryx/blob/main/internships/spring-2027.md) already exposes direct employer links, including the independently verified Four Hands operations role above. Recheck the existing license scope, deduplicate against current jobs, and measure eligible non-software yield before adding another collection. No promised job count and no source change in this batch.

Keep Jobr closed under the current feed contract. Revisit only if a supported, reliable direct-employer path becomes available; no outreach is planned.
