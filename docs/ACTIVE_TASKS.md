# Active project tasks

Updated October 19, 2026. Earlier task-by-task notes are preserved in [task history](TASK_HISTORY.md).

## Working agreement

Keep this list current and report next actions after every iteration. Make reasonable local changes within approved scope. Commit coherent tasks after relevant checks pass. Obtain explicit approval before pushing/deploying. New services must satisfy COST_POLICY.md. Keep browsing free and account-free.

## Current milestone: source-expansion release

The owner approved all four development steps as one batch. All four are complete locally; final publication approval remains pending.

| Step | Status | Evidence |
| --- | --- | --- |
| Automatic USAJOBS discovery | Complete | Eleven searches, bounded pagination and official-page verification. [Operation guide](USAJOBS_AUTOMATIC_DISCOVERY.md) |
| Automatic quality filters | Complete | Unpaid, closed, senior and standing-pool exclusions/holds; fresh employer provenance and eligibility presentation. 70 tests pass. |
| Measure useful coverage | Complete | Local 6,106 jobs versus 5,532 live (+574 net). Keryx credited on 570 listings absent from production; USAJOBS adds ten, eight internships/two graduate roles. [Measurement](source-expansion-release-result.json) |
| Prepare one local release review | Complete | Tests, lint, TypeScript, static export, data audit and compact/card browser checks pass. [Release review](SOURCE_EXPANSION_RELEASE.md) |
| Publish and verify production | Awaiting owner approval | Securely install existing key/email as Actions secrets, synchronize/push, then verify refresh and deployment. No remote secret changes, push or deployment yet. |

Known limits: refresh is degraded by six existing employer-board 404s and two timeouts (both timeout endpoints responded on targeted follow-up). 208 possible semantic duplicate groups remain unconfirmed. Source/category counts can overlap and must not be added to net board growth.

## Next actions

1. Obtain the single final publication approval for the complete source-expansion release.
2. Connect private refresh credentials securely, publish, and verify the generated/deployed snapshot end to end.
3. Review possible duplicate requisitions and remaining role/location leakage, preserving saved-job compatibility.
4. Reassess other broad non-software sources using measured eligible unique yield. USAJOBS is a modest complement, not the main bulk source.

## Later queue

- Define clearer early-career experience boundaries before broad exclusions.
- Consider browser-local hide-reviewed jobs and restore behavior.
- Review optional backend, authentication and cross-device storage against the zero-cost policy.

## Completed checkpoints

- Previously approved site changes published at 470155a.
- Keryx integration, reviewed employer coverage and documented employer evidence batches completed locally.
- Automatic USAJOBS discovery and final release preparation completed locally. Detailed decisions and historical validation remain in [task history](TASK_HISTORY.md).
