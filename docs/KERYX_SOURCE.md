# Keryx non-software sources

Added locally October 18, 2026 after owner approval. Source activation on production still requires publication approval.

Three public MIT-licensed repository files are configured: `GodlyDonuts/keryx/internships/summer-2027.md`, `GodlyDonuts/keryx/new-grad/2027.md` and the owner-approved October 20 addition, `GodlyDonuts/keryx/internships/spring-2027.md`. Spring publication and production refresh were verified October 20 in [the release review](KERYX_SPRING_RELEASE.md). Attribution is recorded in `data/source-licenses.json` and `THIRD_PARTY_NOTICES.md`; the Sources page uses the shared license registry. Earlier measurements below describe the initial two-file integration.

## Admission boundaries

- Only rows with explicit direct Workday/Greenhouse/Lever/Ashby/SmartRecruiters provenance and an allowlisted HTTPS employer ATS destination are parsed. Aggregator fallback pages and arbitrary employer-domain links are excluded from this initial integration.
- Titles must have an early-career signal and supported engineering, business, finance/quant or IT/security classification, without a software-family tag.
- Academic eligibility hints and upstream discovery labels are not imported as employer requirements or company-quality evidence.
- Source trust is not automatically granted: all feeds have `trustedCoverage: false`. Existing company holds and country, freshness, duplicate, listing-check and recovery rules remain in effect.
- All feeds disable full employer-board expansion. Only feed-listed candidates enter ingestion. The public source files need no account, API key or paid resource.
- Valid source posting dates retain date-only provenance. Missing dates use `first_seen`; the shared refresh preserves prior dates for already published identities. Malformed/future dates are rejected. No dates are invented as employer posting dates.
- The existing daily maintenance path uses the same dedicated reader, so its row counts reflect the admitted source format rather than all upstream rows.

## Future seasons and repository renames

Weekly maintenance already discovers year-named repositories among the configured trusted owners. The October 20 local update also lists collection files inside repositories already configured with the Keryx reader. It considers only `internships/{spring,summer,fall,winter}-YYYY.md` and `new-grad/YYYY.md`, from the current year through two years ahead, with at least five parseable rows. Unscheduled files, archive paths and unknown layouts are ignored.

Each new collection is pending review (`active: false`), without source trust or employer-board expansion. Discovery does not grant license clearance or publication approval. It uses one public GitHub tree request per known Keryx repository and at most fifteen candidate-file checks. Failed/truncated tree responses leave existing sources intact. Weekly maintenance refreshes the source report so pending files are visible there.

Repository metadata refresh repairs raw URLs and default branches for ordinary Markdown and Keryx sources. It retains internal source IDs and health history. For an ordinary year-named repository repurposed for a new year, the cycle and generated source label follow the repository's current year. Canonical repository/path matching prevents rediscovery under duplicate IDs after a rename. No logic relies on the star count. GitHub normally redirects renamed repository addresses, but deleted repositories, changed file layouts, missing redirects and reused old names are not guaranteed recoverable. Daily health checks expose those failures instead of inventing a replacement.

This is bounded discovery within configured owners/repositories, not an internet-wide finder or automatic activation of every future season. The code is included in the published October 20 release; pending discoveries appear when weekly maintenance runs.

Existing license references follow GitHub-reported repository renames without changing license status or granting permissions to a new repository. Weekly workflow publication includes those attribution-reference changes. The completed Spring measurement and release checks are in [the October 20 review](KERYX_SPRING_RELEASE.md).

## Verification

All 66 tests, lint, TypeScript and static export passed. Regression coverage exercises direct-source provenance, allowed ATS hosts, aggregator and lookalike-host rejection, non-software classification, early-career titles, source metadata, dates, credentials and insecure links. No personal browser storage or saved-job identifiers change.

Local refresh at 2026-10-19T06:44:55.735Z (October 18, 11:44 p.m. Pacific) parsed 1,004 summer and 66 new-grad candidates. Four published listings carry Keryx as a source, two of them new NVIDIA ASIC new-grad roles; two were already in the previous snapshot. There are 1,049 employer-verification holds and five closed-posting quarantine rows. Remaining rows fail location admission. The complete board contains 5,526 jobs; changes elsewhere in the refresh mean its total difference is not Keryx's incremental yield.

The whole refresh took 157,757 ms and is degraded due to existing provider/board issues. Each Keryx file required one feed request. No full employer boards were added for Keryx. Summary and refresh metrics were checked for agreement. See [refresh result](keryx-refresh-result.json) for the source diagnostics and impact evidence.

Parser inputs are discovery candidates, not proof that every employer page is currently open. Company holds are deliberately retained rather than bypassed to increase job counts. Country/freshness rules and existing listing verification remain shared.

## Next milestone

Review the employer-verification bottleneck with evidence, particularly company aliases and legitimate engineering employers already found by broad feeds. Then evaluate another broad source specifically for finance/business/operations, with USAJOBS remaining a conditional option requiring owner-managed API registration and a measured sample. Do not expand the number of employers individually as the primary discovery strategy.

Of the 1,049 held Keryx rows, 810 have a normalized company name already present on the board. The holds span 226 normalized employers. Existing board presence is a review signal, not automatic proof of employer legitimacy or authority to approve every new listing.
