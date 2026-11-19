# Coverage scaling project, approved November 18, 2026

## Authorization and baseline

The owner approved steps 1–6: baseline, backlog diagnosis, shared recovery, permitted-source review/pilots, tested publication and follow-up observation. Preserve the zero-cost policy, eligibility checks, source permissions, direct free applications, existing request caps and unrelated local work. No account creation, paid products or provider messages are authorized or needed.

Starting snapshot `1229f49`, generated November 19 at 06:44 UTC (November 18 Pacific): 3,300 current internships / 2,240 early-career jobs / 5,540 total; 622 internal holds. Intake: 23,928 rows / 18,921 unique opportunities. Candidate-batch verification backlog: 7,556 unique opportunities. The 37,530 unique-intake doubling target is not achieved. These collection counts follow the correction of 131 graduate roles previously labeled Internship.

## Steps 1–2: diagnosis

Added an offline reproducible audit, `node --import tsx scripts/audit-verification-backlog.ts`. It writes `.cache/verification-backlog-audit.json` without requests or ingestion-state changes. Quarantine triage identifies 7,578 distinct pending opportunities after current-public acceptance and recorded terminal exclusions: 7,002 employer identity, 369 availability, 166 application-destination evidence and 41 explicit early-career evidence. This differs from the authoritative candidate-batch count because quarantine is not a complete replay of candidate screening. Neither count is a promise that every pending job qualifies.

The largest visible URL groups are Dreamwork job pages (2,016) and Vansh short links (1,772). Their total is roughly 3,800 opportunities, not 3,800 verified vacancies or distinct employer systems. Direct Workday groups include Booz Allen's reviewed career site (94), RTX (74), Sierra Nevada (63), Northrop Grumman (61), CACI (58) and GlobalFoundries (36). Employer aliases and duplicate sources explain differences from company-name rankings. Workday cooldowns affect 58 board records; retries alone do not address unresolved redirects or missing employer identity.

The production report now adds exclusive pending-blocker counts and top exact board/visible-host groups to its existing opportunity-based backlog. Multiple source decisions collapse to one outcome per opportunity; a later availability failure takes precedence over another source's earlier identity hold. Full Workday career-site identity remains separate.

## Step 3: shared improvements

### Reviewed public employer index

Reviewed corporate path: [GlobalFoundries careers](https://gf.com/careers/) links [careers.gf.com](https://careers.gf.com/). Its public client uses anonymous `/api/pcsx/search` and `/api/pcsx/position_details` endpoints. No authentication or Workday request is used.

The adapter consumes complete bounded Intern/Graduate search indexes, joins exact employer requisition IDs, then checks public details. The mapping is restricted to company GlobalFoundries, tenant `globalfoundries.wd1.myworkdayjobs.com` and site External. It requires consistent numeric public ID, ATS requisition, exact public URL and title, non-fallback responses, location, posting date, substantive description, early-career qualifications, experience and supported role checks. Existing compensation, geography, freshness, company-block and source rules still run downstream. Apply URLs/source attribution are retained; employer posting dates retain date-only provenance. No company-wide trust is granted and no source-fed candidate is synthesized from index results alone.

Search is refreshed after six hours and expires after twelve; unknown index attempts wait one hour. Positive detail evidence renews after twelve hours and expires after twenty-four; unknown details wait one hour. Failed due checks replace prior positive evidence; missing/partial index results are unknown, never closure. Current source holds/closures remain effective. At most twenty search pages, forty detail requests and sixty total requests per run, with two concurrent details. Actual requests are deducted from the existing 250-request generic pool. State is retained on successful and blocked refreshes.

Nonpublishing pilot: the quarantine sample had 43 distinct GlobalFoundries candidate URLs; 31 requisitions matched the initial observed index. The adapter's later public-index pass attempted 29 matching details in 46 total requests and verified 27 candidates, all passing local location/freshness checks. Index results can change between observations. These are not final net additions.

### Licensed source redirect resolution

The resolver handles only active, permission-checked Vansh feeds with ATS expansion enabled and exact HTTPS `go.vansh.nyc` short URLs. TikTok/ByteDance remain in their existing exact career-page lane. It performs a manual redirect request and accepts only supported direct Greenhouse, Lever or Ashby destinations. It never follows Workday, other aggregators, credentials, private destinations or account pages. Redirect resolution grants discovery only. A candidate changes only after the fetched employer board supplies that exact eligible posting, including the employer title/body/date/location rather than the upstream table's potentially misleading metadata.

Existing published short-link identities are skipped. Source and destination holds remain enforced. Unknown results wait a day, successful mappings renew after seven days and expire after thirty; failed rechecks clear the mapping. Old absent records are pruned after ninety days. At most 100 shortener requests per run, two concurrent, and a 429 stops remaining work. These requests also come from the existing generic pool. Existing employer-board caps remain 1,000 total / 400 retained; no cap is increased.

Nonpublishing pilot: 100 shortener requests yielded 22 supported destinations across 20 successfully fetched employer boards; 20 candidate rows matched eligible employer postings. Five boards were absent from history: Ema, Genius AI, Laminar, General Intuition and Dryft. Existing-board overlap means this is not a promise of twenty new postings. The production lane advances a bounded queue automatically across employers.

Follow-up extends the same resolver to existing permission-checked Dreamwork feeds. Only exact public `www.dreamworkhq.com/job/<UUID>` pages are fetched, without following redirects. It reads a single visible `a.job-original-link` labeled “View original posting”; hidden, ambiguous, closed or unsupported routes do not produce mappings. It copies no aggregator description and grants no eligibility from the link alone. Dreamwork and Vansh split the existing 100-request budget fairly; the cap does not increase. A source with ATS expansion disabled can use an already loaded board but cannot discover a new board through this path. The 40-page nonpublishing Dreamwork pilot found nine supported destinations across nine boards, before employer verification or overlap adjustment. This extension is a separate tested follow-up to the first publication.

## Step 4: source review

Rechecked GitHub repository metadata and root files for SimplifyJobs/Summer2027-Internships, speedyapply/2027-SWE-College-Jobs, speedyapply/2027-AI-College-Jobs and jobright-ai/2026-Software-Engineer-Internship. GitHub reports no detected license and no root license file was present. No feed was activated and no permission is assumed from public visibility. Explicit reuse permission/current review remains necessary; no messages were sent to maintainers.

DereC4/internships-and-newgrad has an MIT license (Copyright 2026 Derek Chen), but its current README aggregates other feeds and contains Zapply application routes. Repository licensing does not clear mixed upstream rights or an existing exclusion. It is deferred, not imported or resolved. Existing Jobr, Zapply, HiringCafe, Jobbie and Getro decisions remain in force. ResuMax remains unselected because its application routes detour through its service.

The bounded redirect pilot expands discovery through already-permitted sources rather than activating overlapping, unreviewed feeds. The previous cyber pilot remains active. Further source activation should demonstrate new qualifying employers/opportunities after existing ATS overlap.

## Steps 5–6: release and observation

The first implementation/release batch is published and production-verified below. Sustained 24–48 hour observation remains open. The first live refreshes establish initial correctness; later scheduled refreshes must establish retention, request behavior and absence of regressions. This approval does not create a background monitoring automation.

### First release result

Shared recovery code `4439370` passed 251 tests, lint, types and the production build. Production run [44479085707](https://github.com/nothenrynguyen/app-expo/actions/runs/44479085707) succeeded and published snapshot `d64621a`, generated November 19 at 07:25 UTC (November 18 at 11:25 p.m. Pacific). An unrelated scheduled refresh advanced the immediate pre-release baseline to `beee4a5`: 5,550 current postings (3,306 internships / 2,244 early-career jobs). Keep that +10 normal refresh change separate from this release's measured effect.

First release current counts: **5,582 total, 3,322 internships / 2,260 early-career jobs**, with 615 holds. Exactly 32 current opportunities were added and none removed versus `beee4a5`. Twenty-eight additions have exact new public-index evidence; two other GlobalFoundries additions came through existing recovery paths, and Ema/Genius AI contributed one each through newly discovered boards. Seven prior holds returned, all with IDs preserved. The tracked inventory grew by 25 because those seven held jobs were already tracked.

Production verification used 47 public-index requests for 30 matching details, verified 28 and indexed 152 distinct requisitions. The resolver used 100 shortener requests, with 20 distinct eligible destinations confirmed by employer boards. Five new pilot boards do not imply five new jobs or twenty new postings. Intake was 23,935 rows / 18,918 unique opportunities; normalization merges some previously separate short URLs with existing employer URLs, so this count can fall while current inventory grows. The pending candidate backlog was 7,507: 6,890 identity, 399 availability, 165 application destination, 41 explicit early-career evidence and twelve career-page evidence. These are pending reasons, not approval estimates.

Dreamwork extension `1c7c7a4` passed all 253 tests, lint, type/build checks and is published.

### Follow-up release and live verification

Run [44479642521](https://github.com/nothenrynguyen/app-expo/actions/runs/44479642521) succeeded and published snapshot `66acfd5`, generated November 19 at 07:28:34 UTC (November 18 at 11:28 p.m. Pacific). Vercel reports success; all four live public data files exactly match this snapshot. Current counts are **3,332 internships / 2,267 early-career jobs / 5,599 total**, with 615 holds. This is +49 current postings (+26 internships / +23 early-career jobs) versus the immediate pre-release snapshot, and +59 versus the project's initial 5,540 baseline. No current listings disappeared across the two release runs.

The second run added seventeen current opportunities: Endeavor AI (two, upstream company display `endeavorai.com`), SCM (one), TribalScale (one), TobogganLabs (one), Relling (seven), Powertown (two), Goaly (two) and One Robot (one). Together the two runs added thirty GlobalFoundries postings, two Ema/Genius AI postings and these seventeen. Twenty-eight GlobalFoundries additions have exact new index evidence; do not attribute the other two to that adapter. Seven held jobs returned with IDs preserved.

Cache reuse is verified: the public-index lane made **zero requests** and reused all 28 positives, without advancing their evidence timestamps. The existing career-page lane also made zero requests and reused 295 positives; HNTB reused nineteen. The shared resolver made its bounded 100 next-queue requests, reused 22 existing mappings and confirmed 53 distinct eligible destinations against employer boards. These 53 overlap many existing postings and are not 53 additions. Its state now records 49 supported Vansh destinations and nine Dreamwork destinations, plus 142 unresolved/unsupported outcomes across 200 requests. The resolver cache stores only URLs and attempt timestamps, not downloaded source HTML. No source's ATS-expansion prohibition was changed.

Employer-board selection reached 321 discovered / 390 retained, within existing caps. All 21 feed records are healthy. Employer diagnostics show 708 healthy, two partial, one unavailable (the existing Iterable 404) and 58 Workday cooldown records. Workday remains degraded; this is alternative official evidence and source normalization, not provider recovery.

The live candidate backlog is **7,466**, down 79 from the immediate pre-release 7,545. Intake is **23,954 rows / 18,892 unique opportunity identities**, versus pre-release 23,927 / 18,920. The -28 unique count reflects aggregate source churn and normalization/merging of short links with employer destinations, not twenty-eight lost public jobs. Raw feed/short-link identities should not be presented as perfectly deduplicated vacancies or used to manufacture progress toward doubling. The 37,530 historical unique-intake target remains unmet and requires comparable normalized measurements.

Quality spot-checks fetched four newly surfaced employer boards (Relling, Powertown, Goaly and Endeavor AI). Sampled roles include explicit internships/graduate roles, substantive employer responsibilities and early-career qualifications on current employer ATS records. No pay was invented where salary was undisclosed; existing unpaid/fee and experience checks remain in force. This is listing verification, not a claim of independent corporate background certification.

### Continuing checkpoints

Steps 1–2 are complete for the starting snapshot. Step 3 delivered two shared automated collection methods, not a complete solution for every employer system. Step 4 rechecked source permissions and measured existing-source expansion; no unreviewed feed was enabled. Step 5 completed two tested, guard-passing releases and live-file verification. Step 6 has initial cache/retention evidence from consecutive runs, but its full 24–48 hour window starts at the first release (November 18 at 11:25 p.m. Pacific), so the sustained check is due November 19–20 late Pacific. Do not label the whole expansion project or doubling target complete.

Next audit should compare that window's scheduled-run history and current inventory against `66acfd5`, inspect new employer/eligibility exclusions, confirm source queue progress and unchanged request caps, and quantify net qualifying additions. Then prioritize the largest remaining exact employer groups and extend only reviewed public collection methods. Existing approval persists; a new approval is needed only for work outside the agreed boundaries. No screen-control session was used.
