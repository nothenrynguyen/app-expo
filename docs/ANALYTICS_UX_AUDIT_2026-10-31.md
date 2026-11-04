# Analytics usefulness audit, October 31, 2026

Status: implementation audit and redesign recommendation only. No product, credential, collector or deployment changes. Live page retrieval and authenticated reporting were unavailable during this review; no audience counts or live visual verification are claimed.

## Findings

- The existing `/analytics` shell is already protected by the Worker's authenticated `/report` endpoint. The dashboard requires a 43-character minimum owner key, keeps it in tab memory and locks on reload. The footer has no dashboard link. A footer link can improve access without exposing report data.
- `ActivityTrend` is a static SVG with no numbered vertical axis, intermediate date ticks, point inspection, keyboard navigation, series selection or zoom. Exact values are hidden inside a separate Daily totals disclosure. Missing days are omitted, but the line connects across them, potentially suggesting continuous observation.
- The four headline cards mix unique browsers, active browsers, repeated outbound clicks and a percentage. Those measure different things. The definitions exist but the prominent numbers do not explain what decision they support.
- Useful feature reach already exists: browsers that browse boards, click employer links, save jobs, filter and add tracker records. Displaying counts alongside percentages would make adoption easier to interpret. Total events is a diagnostic, since page views and repeated actions can dominate it.
- Current ranges are 7 days, 30 days, this UTC month and all time. There is no prior month, month picker, custom interval or period comparison. UTC month boundaries may differ from the owner's Pacific calendar.
- Traffic sources count page views, including internal navigation, rather than unique acquired visitors. They cannot answer which channel brought the most people or converted best. Board and device breakdowns also count page views.
- Job-data health is a separate operational concern. Keep it in a secondary section so it does not compete with audience and product-use questions.

## Recommended first redesign

1. Add a small footer link labeled Owner dashboard. Keep authentication at the report API. Improve password-manager support and plain login wording. A memorable private passphrase would require a separately reviewed collector credential change; a common shared password should not replace the existing random-key mechanism. Never embed a password or key in the static app.
2. Default to This month with prominent dates and a partial-month / collection-start notice. Show unique visitors, engaged visitors, people who clicked an employer link, and returning visitors. Show counts and helpful rates, with explicit denominators. Label identities as observed browsers, not verified people. Define engaged as using a filter, saving/unsaving, opening an employer link or adding a tracker entry.
3. Show an Actions section with repeated employer-link clicks, saves, filter uses and tracker additions. Pair action counts with the unique browsers using each feature. An employer-link click is not an application submission; a tracker addition is not proof of an application.
4. Replace the chart with selectable daily visitors, engaged visitors or employer-link clicks, numbered axes, date labels, pointer/touch inspection and keyboard-accessible values. Keep a visible table option. Preserve missing-data gaps and flag limited days. Supply 7-day, 30-day and month controls first; custom dates can follow with API support.
5. Add a monthly table: month, unique browsers, engaged browsers, employer-link clickers and clicks. Mark the current month incomplete and the initial month as collection starting partway through. Do not show growth until comparable data exists; compare equivalent elapsed days when comparing month-to-date periods.
6. Put plain definitions next to metrics. Keep referral/device/filter diagnostics and collection health below the main report. No unsourced growth or causal claims.

## Measurement and storage boundaries

The existing contract, collector and client already provide the headline and feature/action numbers for supported ranges. Deduplicate monthly visitors across the month, never sum daily unique visitors. Returning currently means observed on an earlier UTC day, which can be within the selected month; it does not mean returning from a previous month.

Daily aggregate visitor counts persist, but per-browser daily detail is scheduled for deletion after 90 days. Historical monthly unique browsers cannot be reconstructed exactly by adding daily totals or using lifetime flags. A durable monthly series needs a reviewed aggregate-finalization or monthly-deduplication design before detail expires. Specify late events, UTC boundaries, retries, safety-limit gaps and retention before implementation. Do not silently extend identity retention.

Only consenting observed browsers are counted. Different devices, cleared storage and expired identities can count separately. Owner exclusion reduces self-traffic on the selected browser. Missing collection, blockers and quotas can lower observed counts. The existing action log also identifies retained verification traffic. Keep that distinction in any early adoption or resume claims.

## Evidence reviewed

- `app/analytics/AnalyticsDashboard.tsx`, `app/analytics/page.tsx`, `app/analytics/analytics.css`, `app/SiteFooter.tsx`
- `lib/activity-client.ts`, `lib/activity-contract.ts`
- `workers/activity/src/index.ts`, `workers/activity/migrations/0001_activity.sql`
- `docs/OWNED_ANALYTICS.md`, `docs/ANALYTICS_ACTION_LOG.md`, `COST_POLICY.md`

Next proposed batch: dashboard clarity, chart navigation and footer access using existing reporting protection, followed by a separately specified monthly history change. This audit does not authorize publication or credential rotation.


## Local implementation and owner refinement

October 31: owner authorized the local redesign. Footer access, private-key password-manager support, clearer metrics, feature reach and repeated actions, sample preview, monthly summaries and collector archival are implemented locally. The initial full verification passed all 188 tests, lint and production export. Migration `0002_monthly_reports.sql` and the collector update must be applied together before publishing the frontend; authentication and consent remain unchanged. Archive closed months before the first retained day expires. No new identity storage is introduced. No deployment or migration has been performed.

Owner refinement: Month / All time is now the primary report control, including in sample preview. All-time data is fetched once and lifetime unique visitors come directly from the collector, never a sum of monthly values. A month selector scopes the headline cards to exact monthly summaries. Feature-action and traffic breakdowns remain in All time because the existing aggregate response cannot accurately scope them to an arbitrary historical month. The main chart now shows monthly unique visitors. Optional daily exploration uses the entire selected calendar month, with unmeasured dates left blank and the pre-collection portion labeled. Old daily detail can expire while archived monthly totals remain. One month is expected at this stage; no fictional production history or growth is introduced.

Preview: locally served static export on port 3006, `/analytics.html`. Sample numbers are visibly labeled fictional. Updated build and lint verification are recorded after the refinement below.

Refinement verification: lint, TypeScript and production export pass. The rebuilt static preview returns HTTP 200 and exported assets include the full-month exploration control. Browser interaction/visual verification has not been completed; the prior browser-control restriction remains a limitation.

Owner layout refinement: removed the promotional heading/subheading, period/update metadata row, collection-context paragraph and redundant visible month-selector label. Month now directly shows the full-calendar daily chart; All time directly shows monthly visitor bars. Removed the secondary chart-mode toggle. Metric definitions and collection limits remain in their existing secondary sections. Focused lint, TypeScript and refreshed production export pass. Local preview updated; unpublished.

All-time chart refinement: replaced monthly bars with a monthly line chart, numbered axis, inspectable points, expanded line hover targets and a keyboard-accessible month inspector. One available month renders one centered point; missing months are not connected. Month view retains the full-calendar daily chart. TypeScript, focused lint and export pass; preview refreshed, unpublished.


## Release review, October 31

Owner authorized review and push. Final review includes browser verification of the sample month/all-time controls, both charts, line hit areas, styled dropdown and reduced-motion support. Hidden page heading preserves navigation accessibility; the disconnected-collector setup panel is hidden while viewing the sample. Credentials and private audience reports stay out of the repository.

Release order: apply only the new aggregate table to the existing manually initialized D1 database, deploy the collector preserving `COLLECTION_ENABLED=true`, verify authenticated monthly reports and unauthenticated denial without logging counts or secrets, then push the reviewed frontend. The original `0001_activity.sql` is listed as unapplied because the live database was initialized manually; do not rerun it. The added table uses idempotent creation for safe retries. Retain the original schema and analytics identities. Cloudflare uses the existing free account/resources; no new service or billing change.

Remote main advanced through automated updates during this work. Reconcile before push and leave the unrelated November planning document and its roadmap/task entries local.


### Collector release receipt

- Applied only `0002_monthly_reports.sql` to the existing D1 database; original schema was preserved. Initialization remains manual, so the migration tracker must not be used to rerun 0001.
- Worker version `01b2afee-bf3b-4447-a8c3-ff53c0e541fe` deployed successfully with the existing DB, allowed production origins, preserved secrets, `COLLECTION_ENABLED=true` override and `43 6 * * *` schedule. Invocation observability is disabled as specified in source.
- Read-only production checks passed: health confirms collection enabled, all/month reports authenticate and have monthly history and daily click fields, unauthenticated reports return 401, reports use no-store. No visitor events were generated and no audience counts or credentials were published.
- The deploy used the checked-in compatibility date `2026-10-01`, while the previous dashboard-managed deployment used `2026-10-22`. A corrective redeploy was rejected by automatic approval review because it might overwrite other remote settings. No retry or indirect bypass was attempted. The deployed runtime reports `2026-10-01`; both private report ranges pass, but restoring the prior compatibility date remains a separately approved follow-up. Core collection/report code uses the same standard APIs as before. Do not claim the date was restored.
- Final local verification: all 190 tests, ESLint, TypeScript and production export pass. Browser checks verified month/all-time switching, full-month and monthly charts, styled selector and dropdown, sample labeling and the cleaned preview. The main report key remains tab-memory-only.
- Frontend publication and production asset checks follow below.


### Frontend publication receipt

- Pushed implementation `8f54b5b` to main after rebasing over eleven generated-data/source-maintenance commits. Unrelated November planning notes and their two overview entries remain uncommitted locally.
- GitHub's Vercel status is success: deployment `5xdfpGgc7nSnjjNEPV9pd5h25ocB` ([deployment](https://vercel.com/henrys-projects-84715f33/app-expo/5xdfpGgc7nSnjjNEPV9pd5h25ocB)). The Vercel connector could list the project but denied deployment access; the CLI had no existing login and its login attempt was canceled. Deployment success was obtained through GitHub instead.
- Live `https://empluzzed.fyi/analytics` has the updated protected access form, owner footer link, no promotional header and an explicitly fictional sample mode. In the live sample, Month shows the full-calendar daily chart; All time shows the monthly chart and lifetime cards. Moving onto the first chart line segment changed the readout from October 31 to October 23. Sample mode does not create collector events.
- The database/collector and frontend are published. Browser checks exercised the public sample; authenticated data access was checked through the private API without disclosing audience data or credentials. No verified scheduled-cleanup receipt is claimed. The compatibility-date restoration remains blocked pending explicit approval, as explained above.


### Compatibility date restored, October 31

The owner explicitly approved restoring the date. Uploaded and activated version `8c4f138b-f8eb-46f0-a48c-6635031f90a8` at 100% traffic using versions upload/deploy, with keep-vars and explicit active collection. Compared the prior and new version resources before activation: script checksum and every binding (including production variables, DB and secret references) are identical; runtime compatibility date is `2026-10-22`. Triggers were not redeployed, preserving the existing schedule. Deployment skipped observability and tail-consumer changes; logpush remains false. The checked-in config now matches the restored compatibility date and retains the disabled-by-default intake safeguard.

Post-activation read-only checks pass: collection enabled, authenticated all/month reports with monthly-summary and daily-click fields, unauthenticated reporting denied, no-store headers. No audience values or credentials were displayed and no visitor events were generated. The earlier blocked correction is resolved.

Login polish: removed the sample-preview entry point and fixture from the shipped dashboard. Locked view now centers a simple Analytics dashboard heading, password field and unlock button. Owner exclusion controls appear after unlock while exclusion remains enabled on mount. Existing report authentication and credential requirements are preserved. TypeScript, focused lint and production export pass.

## November 3 compact workspace (local only)

Owner requested a single-screen dashboard with less vertical space. The dashboard uses the viewport width and height on desktop, places the chart next to summary tables, combines controls into one row and reduces metric-card spacing. Removed the footer, JSON download and exclusion checkbox. Existing automatic owner exclusion remains enabled on entry, including when storage is blocked; analytics preferences do not interrupt the analytics route. Other pages retain their consent controls.

Sample-report browser checks: Month and All time at 1024x600, 1280x720, 1366x768 and 1920x1080 fit the page without scrolling, with chart controls visible. Internal overflow remains available for long history, expanded details and smaller desktop panels. At 390x844 the page scrolls vertically and wide tables scroll within their panels. This intentionally preserves readable data on phones and at high zoom rather than clipping it. Sample data does not verify live report values.

Validation: six analytics/client tests, focused ESLint, TypeScript and production static export pass. The initial build hit Windows EPERM on an About export folder; the permitted retry passed. Layout preview used a temporary dummy collector address and intercepted sample report, with no production credential. No commit, push or deployment was performed.

November 3 local-preview follow-up: local analytics access was disabled because the Production-only collector endpoint is absent from development settings. Added a development-only same-origin /__owner-report rewrite to the existing authenticated report service; production continues using its configured endpoint and static export. Activity intake remains disabled locally. Local analytics responds 200, and a report request without Authorization returns 401. Authenticated password entry remains with the owner; stored-key verification was rejected by automatic approval review and was not performed. No production configuration or credential was changed.

## November 3 fixed dashboard sections (local, unpublished)

Owner reviewed the local preview and requested less width/stretch, no All time right-column scrolling, consistently formatted sections and a normal chart pointer. The dashboard is capped at 1480px, with a smaller chart and wider right column. Overview, Traffic & health and Metric notes replace expanding disclosures. Keyboard arrows/Home/End switch section tabs and keep focus aligned with selection. Traffic is explicitly labeled all-time, independently of month selection, and job-data health remains the current public snapshot.

The overview sidebar uses natural height without its own scrolling area. Both existing monthly rows and all four usage rows stay visible. Long history can grow the page instead of being clipped. Traffic tables and job health share a three-column card grid; Metric notes presents three explanatory cards. Hover selection is retained with a pointer cursor.

Validation: local sample-data browser checks with populated traffic tables and the public summary verify all three sections fit at 1541x727, exactly one section is shown, old expandable sections are absent, and keyboard navigation selects/focuses the next tab. Both overview periods fit without chart/sidebar or page scrolling at 1280x720, 1366x768, 1920x1080 and 2560x1256. At 1024x600 and phone widths the page scrolls, preserving readable content; earlier 1024x600 fit claims describe the superseded layout. TypeScript, focused ESLint and static export pass. Local development remains running; no commit, push or deployment performed.

## Final owner-approved release, November 3

The owner superseded the tab choice: Overview and Traffic & health are always visible together, and Metric notes plus all section tabs are removed. The combined page can scroll vertically on smaller viewports; no right-column or chart scroller is introduced. This final requirement supersedes earlier single-screen/tab receipts above. Automatic browser exclusion, removed footer/JSON download, bounded dashboard width, smaller chart, wider right column, pointer hover and local-only report forwarding are retained.

Final sample-data checks cover Month/All time from 390x844 through 2560x1256. Both sections render together, section tab count is zero, Metric notes is absent, crosshair styles are absent and neither chart nor sidebar scrolls. At 1541x727 the combined sample page is 1077px high, intentionally requiring page scrolling. This tests layout rather than live private report values. All 193 tests pass with temporary-repository permissions; full lint, TypeScript and final production export pass. Owner approved pushing to main. Deployment status is a separate check.
