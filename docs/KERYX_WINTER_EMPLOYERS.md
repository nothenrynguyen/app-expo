# Winter employer and official-listing review

Reviewed October 20, 2026 (Pacific time), under the owner's approval to validate Winter coverage and prepare a local refresh. No provider contact, account, payment or new employer-board crawler was added.

## Employer evidence

Four exact source company names now have reviewed trust records. These approve employer legitimacy under the existing size and US-presence policy; they do not approve every posting automatically. No existing blocked/pending entry was overridden and no broad subsidiary aliases were added.

| Source company name | Evidence | Conservative recorded floor |
| --- | --- | ---: |
| Gemini | [Official careers page](https://www.gemini.com/careers) states over 500 employees and multiple US offices, including New York, Seattle and Miami. | 500 |
| Tevora | [Current leadership directory](https://www.tevora.com/leadership/) lists more than ten distinct leaders. [Official About page](https://www.tevora.com/about/) lists Irvine, Fairfax and Scottsdale offices. The floor is supported by named staff, not an estimate of the full workforce. | 10 |
| The Walt Disney Company | [Official fiscal 2025 annual report](https://investors.thewaltdisneycompany.com/files/doc_financials/2025/ar/2025-Annual-Report.pdf) reports 231,000 employees, including 172,000 in the US, and Burbank executive offices. The stored floor is below that dated reported total. | 100,000 |
| RTX | [Official company page](https://www.rtx.com/who-we-are) describes 60,000 engineers and Arlington, Virginia headquarters. The floor uses that engineering workforce, not an invented total employee count. | 60,000 |

These company approvals can also admit otherwise eligible jobs from existing collections. The release review must separate those effects from the Winter collection's own contribution.

## Official destinations

All thirty original lead URLs returned HTTP 200. That was not sufficient verification:

- Two Gemini and eight Tevora postings contained job-specific application content. The Gemini internships describe January through April 2027; Tevora's cohort description gives January 25 through April 2.
- Four RTX job-detail records supplied full content and explicitly reported `canApply: true` and `posted: true`.
- Sixteen remaining detail requests returned HTTP 403. Those destinations stay pending verification, including Disney's unresolved Spring/Summer-versus-Winter labeling. They are not marked closed.

The sixteen decisions are stored as `reviewHolds` on the Winter source. Ingestion applies them across all feeds and Workday requisition aliases, so a second feed cannot silently reintroduce a held destination. Outage recovery also respects those holds. A successful generic HTTP response does not clear them; remove a hold only after a new explicit review.

No paid intermediary is involved. All admitted destinations continue to be official employer ATS pages. The [sanitized official-review receipt](keryx-winter-official-review.json) records outcomes and response hashes; full employer descriptions remain in ignored local cache.

## Resolved requisition overlap

The suspected Insulet overlap was a false match caused by the existing ID parser. It shortened both `REQ-2026-18618` and `REQ-2026-17966` to the year-bearing prefix. These are distinct electrical- and embedded-software-engineering requisitions.

The parser now preserves the complete year-prefixed requisition while recognizing a trailing career-site alias suffix. Regression checks cover distinct jobs surviving deduplication and a hold on one requisition not affecting another from the same year.

The [official electrical-engineering posting](https://insulet.wd5.myworkdayjobs.com/insuletcareers/job/Acton-Massachusetts/Co-op--R-D-Electrical-Engineering--January---June-2027--Hybrid-_REQ-2026-18618) was checked through its public detail record: full role content, `posted: true`, `canApply: true`, and the complete requisition number. Its January through June co-op is a distinct candidate, not an additional alias of the existing software role.

Together, this establishes job-specific evidence for fourteen original leads plus the distinct Insulet role. The local pipeline refresh determines the final admitted counts and may reject other rows under existing policy. Publication remains a separate approval.
