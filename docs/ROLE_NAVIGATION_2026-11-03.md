# Role navigation update, November 3, 2026

Status: implemented locally, uncommitted and unpublished. No refresh, push or deployment was performed. Existing unrelated planning and interview notes are preserved.

## Decisions and behavior

- Product becomes Product / Program, with Product Management and Technical Program Management specialties. Nontechnical program management stays under Business.
- Design becomes a separate family with Product / UX / UI Design, UX Research, Graphic / Visual Design and Industrial Design specialties.
- Solutions / Support is removed from top-level navigation. Solutions / Customer Engineering remains an Engineering specialty. Support specialists, help desk and internal IT support remain under IT / Security.
- Specialty selection is available for Engineering, Product / Program, Design and Business. IT / Security has no specialty control, per owner request. Existing company-tier behavior is preserved.
- Existing `role=product` links remain valid. Former `role=solutions-support` links select the Engineering specialty. Former `role=business&specialty=design` links select product/UX/UI design. Direct `role=design` links open the full Design family.
- Current classification is applied to old design/support tags without changing listing IDs, application URLs or browser storage. Contextual solutions/applications engineering tags from ingestion are retained when their description is absent from public snapshots.
- FPGA implementation is hardware, product-support data science stays Data, and product-support logistics stays Operations. Product support specialists are IT support; explicit product support engineering remains customer engineering.
- Keryx discovery now admits Product / Program and Design alongside its existing allowed families. Its direct-ATS provenance, destination restrictions, date validation and software-role exclusion remain in force. Product/program titles with incidental software tags can pass; pure software engineering rows remain excluded. Regression coverage includes product, TPM, UX research and industrial design.
- Technical program manager ingestion uses the existing description-based early-career evidence requirement. Senior titles and conflicting required experience remain excluded. This does not add a new source. The separately authorized isolated live measurement is complete, as recorded below.

## Local evidence

Checked the existing snapshot generated `2026-11-03T23:24:40.638Z`: all 6,855 rows remain classified. Product / Program has 112 matches and Design has 109. These are local snapshot measurements across both collections, not live production counts. No technical program title is currently present; Product and Design specialties remain selectable even with zero current matches.

Validation: all 192 tests pass, including taxonomy, legacy links, stored tags and early-career program-manager checks. ESLint, TypeScript and production static export pass. Initial restricted runs encountered Windows permissions in temporary Git fixtures/export directories; normal-access reruns passed. Browser preview could not reach the local Windows server from the available in-app browser, so desktop/mobile interaction checks remain unverified.

Next step: review the local changes, then obtain owner authorization before commit/push/deployment. After release, verify both boards, old links and specialty filters on desktop/mobile. Newly discovered technical program roles depend on a later ordinary ingestion refresh and its normal safeguards.

## Authorized measurement

The owner requested measured, verified new additions after confirming Product / Program remains one primary family and Design remains another. The full normal refresh ran in `.cache/role-measurement/run`, with a frozen local snapshot and a separately fetched deployed snapshot for comparison. Production files and automation are unchanged.

Measurement distinguishes unique opportunity additions, category-related additions and the conservative subset whose candidates had no supported tags under the original classifier. Both canonical employer opportunity identities and company/title/location semantics are checked against both baselines. Exact employer listings for the relevant additions receive a second bounded live check. Uncertain responses are not counted as verified closures or verified additions. Overall net refresh movement is separate from additions attributable to this change.

The homepage inventory count includes hidden companies; the board matching count excludes them and applies all current filters. The supplied board screenshot shows three hidden companies and all locations selected. Those preferences can explain a lower board count, but the exact 512-listing difference cannot be attributed without the hidden-company identities and matching snapshot timestamps. Homepage totals load once per page visit; the board polls for updates.

## Measurement result, November 3 Pacific

The isolated run finished at 6:57 p.m. Pacific. The deployed comparison snapshot was generated at 6:23 p.m. Pacific (6,849 listings); the frozen local snapshot was generated at 3:24 p.m. Pacific (6,855 listings). Evidence, hashes, exact job URLs and per-listing outcomes: [measurement JSON](role-expansion-measurement-2026-11-03.json).

| Verified additions absent from both baselines | Count |
| --- | ---: |
| Technical program management enabled by the new classification | 8 |
| Combined product/program management enabled by the new classification | 1 |
| Design enabled by the new classification | 3 |
| General program management enabled under Business | 3 |
| Total verified additions enabled by classification | 15 |
| Other new product listings from ordinary refresh activity | 2 |
| Total new relevant listings with positive exact employer checks | 17 |

TPM examples: Anduril (three roles), Applied Materials (two), Micron, Applied Intuition and Base Power. Design additions: Insomniac Games user research, Illumio brand design and Applied Intuition brand design. Hive Financial Systems' combined product/program internship belongs in Product / Program. These are measured local admissions, not a deployment receipt. Four additional category-related listings did not receive positive exact employer confirmation and are excluded from verified counts; a failed check is inconclusive, not closure evidence.

The raw full refresh passed the existing coverage guard and produced 6,841 rows. Review exposed six misleading newly admitted roles: three generic coordinators, two internal internship/L&D program managers, and a TPM requiring five years. Classification was corrected, with a regression test for each boundary; `You should have` now establishes a required-experience section. The final rules were replayed over the captured candidates and accepted snapshot, rather than repeating the full network collection. Two pre-existing Talent Development Operations rows also obey the existing People scope exclusion. Ordinary internships whose title includes `Internship Program`, such as IT Procurement Intern, remain eligible.

The reviewed proposed snapshot contains 6,833 listings. Relative to the frozen local baseline: 34 added, 56 removed, net -22. Relative to the more recent deployed snapshot the net is -16. Only 28 additions are absent from both snapshots after identity and semantic checks, so neither gross additions nor net movement should be described as 15 more total jobs on the live site. Omissions from failed sources and verification holds are not proven closures. The reviewed coverage guard still passes; the broad refresh's 18 unexplained removals and other provider/verification issues remain visible in the isolated diagnostics.

Final verification: all 192 tests, ESLint, TypeScript and production static export pass. No current public snapshots, source-state files, automation or production deployment were changed by the measurement. The reviewed proposed snapshot, candidate capture, original refresh diagnostics and comparison scripts remain under ignored `.cache/role-measurement`. Only code, concise documentation and the sanitized outcome report are proposed repository changes. Browser interaction verification remains outstanding as described above.

## Local preview follow-up

Owner requested removing the IT / Security specialty control and retaining one desktop filter row. The filter grid now accounts for the extra specialty column on Product / Program, Design and Business without wrapping; existing company-tier selection is retained. The former four-column desktop breakpoint is replaced by a narrower single row. Mobile keeps the existing filter drawer.

Browser verification on the live local preview: IT / Security has seven controls and no specialty; Product / Program has eight controls, all at the same vertical position. Checked at 1,198px and 900px widths with no horizontal page overflow at 900px. Saved screenshot under the session visualization directory. Other previously unverified interactions are not implied by these focused checks.

Counts without hidden companies, for the default US location: the current preview has Product / Program 86 internships and 16 early-career full-time roles; Design has 81 and 20. The reviewed measured snapshot has Product / Program 92 and 20; Design 82 and 22. Across all supported regions the measured counts are Product / Program 100 internships and 22 full-time roles, Design 87 and 25. These are current collected inventory, not exhaustive market coverage. The measured snapshot remains separate from the preview's public files.

## Approved release batch

The owner approved audit, reviewed local preview, measured verification, validation/documentation and commit/push as one batch. Keep Save and the top-level category bar unchanged; Marketing / Sales stays under Business. Preserve unrelated planning/interview work and reconcile automated refresh commits. Production verification is outside this approved boundary; a push can trigger the existing automatic deployment.

Final audit: Product Design Engineer titles no longer imply UX/product design; without a supported physical specialty they stay General Engineering. Stored customer-engineering evidence is reused only when public snapshots lack a description; current internal-only descriptions override it. New regressions cover both boundaries. Homepage totals are labeled as total listings with a short explanation that board counts reflect filters and hidden companies.

Release work is in progress. A fresh normal local collection will use the final rules and current automated state. Its actual guard outcome, measured additions, desktop/mobile checks and final commit/push evidence will supersede the earlier preview-only limitations above.
