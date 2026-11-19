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

Local validation and publication are in progress. Production result and attribution will be recorded here. Do not mark sustained 24–48 hour observation complete before that window elapses. The first live refreshes establish initial correctness; later scheduled refreshes must establish retention, request behavior and absence of regressions. This approval does not create a background monitoring automation.
