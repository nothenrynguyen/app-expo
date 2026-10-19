# USAJOBS selective adapter

Implemented locally October 19, 2026. This is a candidate conversion and official-page review stage, not an activated public source. No main refresh integration, federal agency trust exception, scheduled workflow or credential publication is included.

## Admission checks

Only HTTPS USAJOBS numeric announcement URLs are accepted; credentials, alternate ports, redirects and lookalike domains are refused. Official JobPosting structured data and the summary/requirements sections must exist. Title must match the discovered announcement. Agency identity must match structured data or appear explicitly in the official posting header; a suboffice is not substituted for the discovered parent agency.

Requires current acceptance of applications, valid posting/closing dates, positive USD pay, stated vacancies, explicit early-career evidence and currently supported locations for every structured location. Ambiguous/missing location evidence is held, rather than supplied with a guessed U.S. tag. Closing-day uncertainty is held conservatively.

Rejects/holds senior titles, unpaid summaries and standing public-notice language. Prior volunteer experience credit in qualifications does not make a paid job unpaid. Script, template, navigation, footer and agency contact content is removed before text checks. Current role classification must recognize a category; broad general-engineering titles remain held if the shared categories cannot classify them. This avoids inventing misleading tags. Citizenship detection returns required or unknown, never an unsupported claim that citizenship is unnecessary.

## Measured result

54 official pages reviewed. A second complete fetch reproduced the results after moving research caches outside the build folder; additional replay checks used zero network requests. Next.js clears .next during builds, so the review now stores fixtures in ignored .cache.

| Result | Announcements |
| --- | ---: |
| Candidates for further admission | 2 |
| Standing recruiting notices | 20 |
| Not accepting applications | 14 |
| Closing today or closed by date | 1 |
| Unpaid | 5 |
| Unverified category | 6 |
| Unverified career level | 3 |
| Unverified/ineligible structured location | 3 |

Each row has one first-failing reason; it may also fail later checks. A held result is not necessarily an unsuitable opportunity. This conservative adapter lacks sufficient evidence to publish it automatically.

The two candidates are [Civil Engineer (Recent Graduate), Bureau of Reclamation](https://www.usajobs.gov/job/888900400) and [IT Cybersecurity Specialist, CES Recent Graduate, DISA](https://www.usajobs.gov/job/880946700). Both have explicit U.S. citizenship requirements. Neither overlaps the baseline by application destination or the existing semantic-identity function, and they do not overlap each other. This is a duplicate check, not proof of universal uniqueness. See [sanitized result](usajobs-selective-review-result.json).

Salary uses the official structured salary value, which can omit the full displayed range. Complete grade, clearance, education, citizenship and recent-graduate criteria must be preserved in a future listing presentation. The candidates still require agency admission evidence and the normal shared refresh rules. Broad general-engineering internships are held for category review, including the promising DNFSB summer role; it has not been silently dropped or declared unsuitable.

## Validation and next steps

All 68 tests, project lint, TypeScript and static export pass. Regression coverage checks unpaid versus volunteer credit, standing notices, invalid/future/closing dates, seniority, identity mismatch, explicit header agency provenance, unsupported and mixed locations, blocked page shells, lookalike domains and script-only false signals. The sandbox build initially failed to create an output folder, then passed with required permissions.

Run official-page review with node --import tsx scripts/review-usajobs.ts. Add --cached to replay existing ignored fixtures without network. At most 60 sample rows and one request per trusted URL per run; no retries, 15-second per-request timeout, stop on 401/403/429.

Next: review the six unresolved role-category cases and remaining career/location evidence, establish the narrow federal agency admission policy without blanket employer approval, then wire the reviewed adapter into a disabled-by-default refresh path with explicit eligibility display before measuring publishable additions. Publication requires owner approval.
