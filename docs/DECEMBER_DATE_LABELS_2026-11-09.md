# December update: clearer listing dates

List view shows the date beneath the job title. Card view uses the same labels in its metadata. The labels distinguish listing dates, estimates, and discovery dates. Calendar dates are displayed in UTC to preserve the published day.

The seven-day posting filter is deferred. In the audited 6,878-listing snapshot, the conservative single-source Ashby and USAJOBS sample had 395 dates tied to publication or opening fields, including 61 in the previous seven days. Other source paths can mix creation, inferred, or discovery dates, and the merged snapshot does not identify which source supplied the selected date. Track that provenance before adding a posting-date filter.

All 193 tests, lint, and static export passed. The original publication test failures reproduced as temporary Git repository permission errors and passed on rerun with write access. The live Early Career board showed the November Design and Product / Program categories. Owner dashboard and scheduled cleanup verification are still open.

## December roundup copy

**Clearer dates on the job board**

See dates in a dedicated column in List view and in card metadata, with the date basis available on hover.

## November 12 local layout revision

Desktop board width increases from 1120px to 1440px. Compact results move dates to a separate Date column after Location. At the owner's request, all dates show only the formatted date without visible labels or qualifiers. Hover explanations describe the date basis. Discovery can be later than publication, and source dates can represent creation, so a universal Posted date label would overstate the evidence.

Intermediate widths scroll the table horizontally; phone layouts retain a separate metadata row. No ingestion or sorting changes. No Updates entry for this minor layout refinement. Focused ESLint, TypeScript and production export pass locally (build rerun with write permission after an initial EPERM); browser visual verification remains outstanding. Publication approved November 12. All 194 tests, full lint, TypeScript and production export pass. Production deployment verification remains separate.
