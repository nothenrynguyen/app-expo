# Doubling feasibility review, October 29, 2026

## Conclusion

The current source pool and tested expansions do **not substantiate a promise to double** Empluzzed's in-scope inventory. They do substantiate smaller additions. The starting snapshot had 4,143 internships and 2,514 full-time jobs (6,657 total); doubling requires 8,286 and 5,028 respectively, or 6,657 additional unique eligible jobs. Keep the existing careers, US/Canada/UK geography, no-spending requirement and availability checks.

The [measurement receipt](doubling-feasibility-result.json) separates leads, preliminary candidates, recent-dated candidates and published results. A pilot candidate is not a live addition. These samples are not market-wide recall estimates and do not prove that doubling is impossible.

## Completed work

1. **Audit the backlog.** 12,328 quarantine rows collapse to 9,085 absent destination identities; 4,442 have explicit early-career titles and supported role tags. Location, dates, availability and intermediary duplication are not established by this title screen. Leading groups: Dreamwork 1,266, vanshb03 short links 1,068, Workday 1,030, existing ATS 479, SmartRecruiters 158, Oracle 139 and iCIMS 95. These groups are not additive unique employer opportunities across intermediaries.
2. **Review source access and scope.** SmartRecruiters documents unauthenticated public Posting APIs and company-level listings. Workable documents a public published-jobs endpoint. The existing MIT reviews cover the vanshb03 repositories, but their protected lookup API requires an operator secret and was not used. No Dreamwork bulk site extraction, Jobright extraction, rejected paid service, login, signup or payment method was used. No external outreach was sent.
3. **Measure whole-board providers.** Queried 59 SmartRecruiters companies and five Workable companies, with request caps and access-denial pauses. Scanned 13,474 list rows and checked 456 SmartRecruiters details. Local filtering, explicit employer/destination holds and duplicate checks leave 370 preliminary net additions (174 internships / 196 full-time). Of those, 254 were posted within 365 days (174 / 80); six are one to three years old and 110 are more than three years old. Some API-active postings date to 2015–2017. Older does not mean closed, but this is insufficient evidence to market all 370 as fresh student opportunities. Nineteen boards were truncated at the pilot cap. No provider-wide adapter was enabled from these preliminary results.
4. **Resolve licensed discovery links.** A bounded 200-link sample (100 internship titles and 100 other titles) returned 200 normal redirects. 131 point to existing supported collector types, and 95 resolve to destinations already on the starting board. Six newly tracked standard ATS boards yielded 25 locally eligible absent destinations. This is a much smaller gain than counting 200 links as new jobs. The existing collector can support these six boards without a new dependency or service; they are the release batch.
5. **Test an independent directory.** Wikidata structured facts are CC0. Two bounded 20-employer cohorts, one selected from large employers and one from software-industry entities absent by name from the starting board, produced 13 candidate career links but no directly detected Greenhouse/Lever/Ashby boards within the allowed homepage plus careers-page hop. There were 18 unknown/access/robots holds across the two cohorts. This is a limited crawler result, not proof those companies have no jobs. Some directory facts or names are stale. Finding a company domain is not the same as identifying its hiring system, validating a job or admitting the employer.
6. **Verify operational stability.** The next scheduled refresh (40856405588) succeeded at 10:24:34 UTC with 4,197 internships and 2,556 full-time jobs, retaining the restored coverage and excluding the removed career families. The existing ten-minute budget remains. Broader scaling must batch and stagger collection rather than assume thousands of full employer scans fit every hour.

## Ranked next engineering work

- Resolve licensed short links to their actual employer destinations, retain provenance and strong requisition identities, then discover and verify whole boards. Cache results and maintain bounded queues; do not equate every resolved link with a new job.
- Introduce SmartRecruiters/Workable adapters in reviewed employer cohorts, with explicit older-posting review and pagination/truncation reporting. The measured recent-dated pool is hundreds, not the thousands needed to double.
- Add an independent employer registry with verified career-site mappings. The simple CC0-directory pilot needs better industry selection, entity resolution and support for custom career sites before it is a reliable automatic growth engine.
- Measure Oracle, iCIMS and branded/custom hiring systems next. Authentication, redistribution restrictions or employer agreements may constrain particular sources; do not bypass them. No permission-dependent source is assumed available.
- Expand refresh scheduling and cache renewal deliberately before enlarging the directory. Preserve duplicate, country, career, explicit employer and availability gates.

No numeric yield is promised for these unmeasured steps. There is no evidence for simply flipping a setting to add 6,657 suitable jobs, and no reason to broaden the careers the owner explicitly removed.

## Evidence and limits

- [SmartRecruiters public authentication](https://developers.smartrecruiters.com/docs/authentication) and [Posting endpoints](https://developers.smartrecruiters.com/docs/endpoints).
- [Workable public published-jobs endpoint](https://help.workable.com/hc/en-us/articles/115012771647-Using-the-Workable-API-to-create-a-careers-page) and [customer terms reviewed](https://www.workable.com/terms). Public access is not a blanket legal opinion on every redistribution use; only minimal factual metadata and direct application links were measured.
- [Wikidata licensing](https://www.wikidata.org/wiki/Wikidata:Licensing) and [data access](https://www.wikidata.org/wiki/Help:Linked_Data_Interface).
- Local raw response evidence and pilot programs remain in `.cache/doubling-audit/` and `.cache/*pilot*`. They are not published job descriptions or a production source. The committed receipt contains aggregate findings and board metadata, not copied posting descriptions.

All 145 existing tests pass for the six-board configuration. Publication and exact live verification of that small release batch are pending. The broader doubling research conclusion is complete; the proposed adapters and directory are follow-up work, not shipped features.
