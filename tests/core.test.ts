import { loadReviewedUsaJobs, reviewedFederalCoverage } from "../lib/ingestion/usajobs";
import { reviewUsaJobsPosting } from "../lib/usajobs";
import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCompanyQuality, normalizeCompanyDisplayName, normalizeCompanyName, type CompanyTrustEntry, type VerifiedCompany } from "../lib/company-quality";
import { deduplicateCrossSourceJobs } from "../lib/job-dedup";
import { isProcessManufacturingRole } from "../lib/process-manufacturing";
import { getFreshnessRejection } from "../lib/job-freshness";
import { buildJobInsightsDay, updateJobInsightsHistory } from "../lib/job-insights";
import { countSavedJobs, filterJobs, getAvailableMetroOptions, getJobTerms } from "../lib/job-board";
import { buildJobsSummary } from "../lib/job-summary";
import { daysAgo } from "../lib/jobs";
import { canonicalizeUrl, inferTerm, inferWorkMode, jobIdentity, normalizeDisplayText, parsePostedAt } from "../lib/source-normalization";
import { isInCollection } from "../lib/job-collections";
import { classifyRoleArea, classifyRoleTags, getJobRoleTags, getRoleSelection, matchesRoleSelection } from "../lib/role-areas";
import { createAtsBoard, discoverAtsBoard, isEarlyCareerTitle, type AtsBoardSeed } from "../lib/ats-boards";
import { classifyListingResponse, needsListingCheck } from "../lib/listing-health";
import { applyMicrosoftCareersPosting, parseMicrosoftCareersJobUrl, parseMicrosoftCareersPosting } from "../lib/microsoft-careers";
import { applySmartRecruitersPosting, parseSmartRecruitersJobUrl } from "../lib/smartrecruiters";
import { parseApplyGuySource, parseKeryxSource, parseMarkdownSource, sourceAllowsAtsExpansion } from "../lib/source-parsers";
import { classifyJobMetros, classifyJobRegions, formatSnapshotAge, getSupportedJobRegions, normalizeJobLocation } from "../lib/job-locations";
import { isDiscoverableYearlyRepository } from "../scripts/maintain-sources";
import sourceCatalog from "../data/sources.json";
import pinnedBoards from "../data/pinned-boards.json";
import { sourceLicenseReview } from "../lib/source-licenses";
import { parseSavedJobIds, toggleSavedJobId } from "../lib/saved-jobs";
import { displayText, getLocationDisplay, getPaginationState } from "../app/job-board/job-board-utils";
import { createWorkdayBoard, fetchWorkdayBoard, parseWorkdayJob, parseWorkdayPostedAt } from "../lib/workday";
import { buildRefreshReport } from "../lib/ingestion/refresh-report";
import { preserveLastKnownGoodJobs } from "../lib/ingestion/last-known-good";
import { getJobLocationMetadata } from "../lib/job-location-policy";
import { createScreeningTracker } from "../lib/ingestion/screening";
import type { SourceCatalog } from "../lib/source-catalog";
import { buildReviewedEmployerCoverage, employerBoardIdentity } from "../lib/ingestion/reviewed-employer-coverage";
import type { CandidateJob } from "../lib/source-normalization";

test("foreign cities cannot inherit a contradictory US suffix or stale snapshot tag", () => {
  for (const location of ["Shanghai, 200335, United States", "Shanghai, 200335", "Prague, United States", "Prague"]) {
    assert.equal(getSupportedJobRegions(location).includes("us"), false, location);
    assert.equal(getJobLocationMetadata({ location }).eligible, false, location);
  }
  assert.deepEqual(getSupportedJobRegions("London, United Kingdom; New York, NY"), ["uk", "us"]);
  assert.deepEqual(getSupportedJobRegions("San Diego, California, 92128"), ["us"]);
  assert.deepEqual(getSupportedJobRegions("Remote in India"), []);
  assert.equal(normalizeJobLocation("Remote, United States"), "Remote, United States");
  assert.equal(normalizeJobLocation("Shanghai, 200335, United States"), "Shanghai, 200335, United States");
  const job = {
    id: "bad-location", company: "Apple", title: "Software Engineering Intern",
    location: "Shanghai, 200335", regions: ["us" as const], metros: ["sf-bay-area" as const],
    category: "Internship", term: "Not stated", workMode: "unknown" as const,
    postedAt: "2026-10-15T00:00:00Z", postedAtSource: "exact" as const,
    applyUrl: "https://example.com/bad-location", linkedInUrl: null, salary: null,
    sources: ["Test"], verifiedCompany: true,
  };
  const filters = {
    type: "internships" as const, roleSelection: { family: "software" as const, specialty: null },
    query: "", regions: [], metros: [], modes: [], terms: [], companyTiers: [],
    savedOnly: false, savedJobIds: new Set<string>(),
  };
  assert.deepEqual(filterJobs([job], filters), []);
  assert.deepEqual(getAvailableMetroOptions([job], "internships", []), []);
  const current = new Map();
  const closed = { ...job, id: "closed", location: "Austin, TX", applyUrl: "https://example.com/closed" };
  assert.equal(preserveLastKnownGoodJobs(current, [job, closed], (prior) => prior, (prior) => prior.id === "closed"), 0);
});

test("country policy keeps nationwide US Canada and UK coverage without a metro requirement", () => {
  for (const location of ["San Diego, CA", "Raleigh, NC", "Phoenix, AZ", "Toronto, ON, Canada", "Calgary, Canada", "Cambridge, UK", "Edinburgh, Scotland", "Cardiff, Wales", "Belfast, Northern Ireland", "London, ON, Canada", "United States", "Remote, United States", "Remote in US", "Remote (Remote - United States)", "Canada", "United Kingdom"]) {
    assert.equal(getJobLocationMetadata({ location }).eligible, true, location);
  }
  for (const location of ["Prague", "Prague, United States", "Shanghai, 200335", "Berlin, Germany", "Paris, France", "Dublin, Ireland", "Remote, Europe", "Location not stated"]) {
    assert.equal(getJobLocationMetadata({ location }).eligible, false, location);
  }
  assert.deepEqual(getSupportedJobRegions("Belfast, Northern Ireland"), ["uk"]);
  assert.deepEqual(getSupportedJobRegions("London, ON, Canada"), ["canada"]);
  for (const location of ["Paris, TX", "Berlin, NJ", "Vancouver, WA", "Melbourne, FL"]) {
    assert.deepEqual(getSupportedJobRegions(location), ["us"], location);
  }
  assert.deepEqual(getSupportedJobRegions("Halifax, NS"), ["canada"]);
  assert.deepEqual(getJobLocationMetadata({ location: "Prague; Austin, TX" }).regions, ["us"]);
});
const registry: VerifiedCompany[] = [{
  name: "Figma",
  usPresence: "headquartered",
  minimumEmployees: 1000,
  linkedInUrl: "https://www.linkedin.com/company/figma",
}];

test("posting age uses rolling 24-hour buckets including zero", () => {
  const now = new Date("2026-08-11T20:00:00Z");
  assert.equal(daysAgo("2026-08-11T01:00:01Z", now), 0);
  assert.equal(daysAgo("2026-08-10T20:00:00Z", now), 1);
  assert.equal(daysAgo("2026-08-09T19:59:59Z", now), 2);
});

test("ATS identities merge tracking variants", () => {
  assert.equal(
    jobIdentity("https://boards.greenhouse.io/figma/jobs/6131089004?gh_jid=6131089004"),
    jobIdentity("https://boards.greenhouse.io/figma/jobs/6131089004"),
  );
});

test("job locations are normalized and limited to supported regions", () => {
  assert.equal(normalizeJobLocation("Chicago"), "Chicago, IL");
  assert.equal(normalizeJobLocation("Austin, Texas"), "Austin, TX");
  assert.equal(normalizeJobLocation("SFBellevue, WAMountain View, CA"), "San Francisco, CA; Bellevue, WA; Mountain View, CA");
  assert.equal(normalizeJobLocation("LAPittsburgh, PA"), "Los Angeles, CA; Pittsburgh, PA");
  assert.equal(normalizeJobLocation("Indianapolis, IN: Fort Wayne, IN"), "Indianapolis, IN; Fort Wayne, IN");
  assert.equal(normalizeJobLocation("5 locationsRochester, NYAlbany, NY"), "Rochester, NY; Albany, NY");
  assert.equal(normalizeJobLocation("NYCBrooklyn, NY"), "Brooklyn, NY");
  assert.equal(normalizeJobLocation("Remote in USAMinneapolis, MN"), "Remote, United States; Minneapolis, MN");
  assert.equal(normalizeJobLocation("In, IN"), "India");
  assert.equal(normalizeJobLocation("Il, IL"), "Israel");
  assert.deepEqual(classifyJobRegions("Chicago"), ["us"]);
  assert.deepEqual(classifyJobRegions("Toronto"), ["canada"]);
  assert.deepEqual(classifyJobRegions("Auckland, NZ"), ["australia_nz"]);
  assert.deepEqual(classifyJobRegions("London, United Kingdom; New York, NY"), ["uk", "us"]);
  assert.deepEqual(getSupportedJobRegions("Auckland, NZ"), []);
  assert.deepEqual(getSupportedJobRegions("Singapore"), []);
  assert.deepEqual(getSupportedJobRegions("Location not stated"), []);
  assert.deepEqual(getSupportedJobRegions("In, IN"), []);
  assert.deepEqual(getSupportedJobRegions("Il, IL"), []);
  assert.deepEqual(getSupportedJobRegions("London, United Kingdom; New York, NY"), ["uk", "us"]);
});

test("job locations are grouped into useful metro areas", () => {
  assert.deepEqual(classifyJobMetros("San Francisco, CA; Mountain View, CA"), ["sf-bay-area"]);
  assert.deepEqual(classifyJobMetros("New York, NY; Seattle, WA"), ["new-york-city", "seattle"]);
  assert.deepEqual(classifyJobMetros("Arlington, VA"), ["washington-dc"]);
  assert.deepEqual(classifyJobMetros("Washington, District of Columbia"), ["washington-dc"]);
  assert.deepEqual(classifyJobMetros("Arlington, TX"), []);
  assert.deepEqual(classifyJobMetros("Toronto, ON, Canada"), ["toronto"]);
  assert.deepEqual(classifyJobMetros("London, United Kingdom"), ["london"]);
  assert.deepEqual(classifyJobMetros("London, ON, Canada"), []);
  assert.deepEqual(classifyJobMetros("Madison, WI"), []);
});

test("job board helpers combine filters and derive available options", () => {
  const base = {
    company: "Example",
    term: "Summer 2027",
    workMode: "remote" as const,
    postedAt: "2026-09-20T00:00:00Z",
    postedAtSource: "exact" as const,
    linkedInUrl: null,
    salary: null,
    sources: ["Test"],
    verifiedCompany: true,
    category: "Internship",
  };
  const jobs = [
    { ...base, id: "saved", company: "Microsoft", title: "Software Engineer Intern", location: "San Francisco, CA", regions: ["us" as const], metros: ["sf-bay-area" as const], applyUrl: "https://example.com/saved" },
    { ...base, id: "raleigh", title: "Operations Intern", location: "Raleigh, NC", regions: ["us" as const], metros: ["raleigh-durham" as const], applyUrl: "https://example.com/raleigh" },
    { ...base, id: "canada", title: "Data Analyst Intern", location: "Toronto, ON, Canada", regions: ["canada" as const], metros: ["toronto" as const], workMode: "hybrid" as const, applyUrl: "https://example.com/canada" },
    { ...base, id: "fulltime", title: "Software Engineer", term: "Not stated", location: "New York, NY", regions: ["us" as const], metros: ["new-york-city" as const], category: "New grad", applyUrl: "https://example.com/fulltime" },
  ];

  const filtered = filterJobs(jobs, {
    type: "internships",
    roleSelection: { family: "software", specialty: null },
    query: "microsoft",
    regions: ["us"],
    metros: ["sf-bay-area"],
    modes: ["remote"],
    terms: ["Summer 2027"],
    companyTiers: ["faang_plus"],
    savedOnly: true,
    savedJobIds: new Set(["saved"]),
  });

  assert.deepEqual(filtered.map((job) => job.id), ["saved"]);
  assert.deepEqual(getJobTerms(jobs), ["Summer 2027"]);
  assert.deepEqual(getAvailableMetroOptions(jobs, "internships", ["us"]).map(([value]) => value), ["sf-bay-area"]);
  assert.equal(countSavedJobs(jobs, "internships", new Set(["saved", "fulltime"])), 1);
});

test("process and manufacturing classification finds relevant early-career roles and rejects lookalikes", () => {
  assert.equal(isProcessManufacturingRole({ title: "Dry Etch Equipment Development Engineering Intern", category: "Internship" }), true);
  assert.equal(isProcessManufacturingRole({ title: "Process Engineer (New Grad Summer 2027)", category: "New grad" }), true);
  assert.equal(isProcessManufacturingRole({ title: "FAB Device Engineer Intern", category: "Internship" }), true);
  assert.equal(isProcessManufacturingRole({ title: "Packaging Engineer Intern", category: "Internship" }), true);
  assert.equal(isProcessManufacturingRole({ title: "Manufacturing Engineer, New Grad", category: "New grad" }), true);
  assert.equal(isProcessManufacturingRole({ title: "Jr. AI Process Engineer", category: "New grad" }), false);
  assert.equal(isProcessManufacturingRole({ title: "Business Process Analyst Intern", category: "Internship" }), false);
  assert.equal(isProcessManufacturingRole({ title: "Senior Process Engineer", category: "New grad" }), false);
  assert.equal(isProcessManufacturingRole({ title: "Senior Manufacturing Engineer I", category: "New grad" }), false);
  assert.equal(isProcessManufacturingRole({ title: "Site Reliability Engineer I", category: "New grad" }), false);
  assert.equal(isProcessManufacturingRole({ title: "Software Engineering Intern, Fab", category: "Internship" }), false);
  assert.equal(isProcessManufacturingRole({ title: "PhD Intern - Materials Science", category: "Internship" }), false);
});

test("saved job helpers reject invalid storage and toggle unique IDs", () => {
  assert.deepEqual(parseSavedJobIds(null), []);
  assert.deepEqual(parseSavedJobIds("not json"), []);
  assert.deepEqual(parseSavedJobIds('{"id":"job-1"}'), []);
  assert.deepEqual(parseSavedJobIds('["job-1",3,"job-1","job-2"]'), ["job-1", "job-2"]);
  assert.deepEqual(toggleSavedJobId(["job-1"], "job-2"), ["job-1", "job-2"]);
  assert.deepEqual(toggleSavedJobId(["job-1", "job-2"], "job-1"), ["job-2"]);
});

test("job board pagination clamps first, last, and empty pages", () => {
  assert.deepEqual(getPaginationState(0, 8), {
    pageCount: 1,
    safePage: 0,
    startIndex: 0,
    endIndex: 100,
  });
  assert.deepEqual(getPaginationState(201, -2), {
    pageCount: 3,
    safePage: 0,
    startIndex: 0,
    endIndex: 100,
  });
  assert.deepEqual(getPaginationState(201, 3), {
    pageCount: 3,
    safePage: 2,
    startIndex: 200,
    endIndex: 300,
  });
});

test("job board display helpers keep copy plain and summarize long locations", () => {
  assert.equal(displayText("Platform — Reliability – US"), "Platform - Reliability - US");
  assert.deepEqual(getLocationDisplay("San Francisco, CA; Bellevue, WA; Toronto, ON, Canada"), {
    full: "San Francisco, CA; Bellevue, WA; Toronto, ON, Canada",
    hasMore: true,
    compact: "San Francisco, CA + 2 more",
  });
});

test("snapshot age uses useful minute and hour labels", () => {
  const now = new Date("2026-08-21T12:00:00Z");
  assert.equal(formatSnapshotAge("2026-08-21T11:59:30Z", now), "0 minutes ago");
  assert.equal(formatSnapshotAge("2026-08-21T11:43:00Z", now), "17 minutes ago");
  assert.equal(formatSnapshotAge("2026-08-21T10:00:00Z", now), "2 hours ago");
});

test("yearly source discovery accepts maintained future internship repositories", () => {
  assert.equal(isDiscoverableYearlyRepository({ archived: false, name: "Tech-Internships-2028" }, 2027), true);
  assert.equal(isDiscoverableYearlyRepository({ archived: true, name: "Tech-Internships-2028" }, 2027), false);
  assert.equal(isDiscoverableYearlyRepository({ archived: false, name: "Tech-Internships-2026" }, 2027), false);
});

test("job collections distinguish 2027 internships from full-time new-grad roles", () => {
  const base = { id: "job", company: "Example", location: "New York, NY", workMode: "unknown" as const, postedAt: "2026-08-12T00:00:00Z", postedAtSource: "exact" as const, applyUrl: "https://example.com/job", linkedInUrl: null, salary: null, sources: ["Test"], verifiedCompany: true };
  assert.equal(isInCollection({ ...base, title: "Software Engineer Intern", term: "Summer 2027", category: "Internship" }, "internships"), true);
  assert.equal(isInCollection({ ...base, title: "Software Engineer Summer Analyst", term: "Not stated", category: "Internship" }, "internships"), true);
  assert.equal(isInCollection({ ...base, title: "Software Engineer, New Grad", term: "Not stated", category: "New grad" }, "fulltime"), true);
});

test("Keryx imports only early-career non-software rows with direct ATS provenance", () => {
  const header = "| Company | Role | Location | Academic eligibility | Posted | Seen in | Apply |\n|---|---|---|---|---|---|---|";
  const row = (title: string, url: string, provenance = "Workday direct", date = "2026-10-18") => `| Example | ${title} | Boston, MA | Preferred PhD, not required | ${date} | ${provenance} | [apply](${url}) |`;
  const direct = "https://example.wd1.myworkdayjobs.com/Careers/job/Boston/Mechanical-Engineering-Intern_JR12345";
  const now = new Date("2026-10-19T05:00:00Z");
  const parsed = parseKeryxSource([header,
    row("Mechanical Engineering Intern", direct),
    row("Finance Intern", "https://jobs.lever.co/example/abc", "Lever direct", "—"),
    row("Software Engineering Intern", direct),
    row("Mechanical Engineering Intern", "https://jobright.ai/jobs/info/123"),
    row("Mechanical Engineering Intern", direct, "Jobright Engineering"),
    row("Mechanical Engineering Intern", "https://boards.greenhouse.io.evil.example/jobs/123"),
    row("Mechanical Engineering Intern", "https://user:pass@jobs.lever.co/example/abc"),
    row("Mechanical Engineering Intern", "http://jobs.lever.co/example/abc"),
    row("Senior Mechanical Engineer", direct),
    row("Mechanical Engineering Intern", direct, "Workday direct", "invalid date"),
  ].join("\n"), "Keryx Non-Software Summer 2027", now);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].term, "Summer 2027");
  assert.equal(parsed[0].postedAtSource, "date_only");
  assert.equal(parsed[1].postedAtSource, "first_seen");
  assert.equal(parsed[1].postedAt, now.toISOString());
  for (const date of ["", "-", "not stated", "unknown", "date unknown"]) {
    const missing = parseKeryxSource([header, row("Finance Intern", "https://jobs.lever.co/example/abc", "Lever direct", date)].join("\n"), "Keryx Non-Software Summer 2027", now);
    assert.equal(missing[0].postedAtSource, "first_seen", date);
    assert.equal(missing[0].postedAt, now.toISOString(), date);
  }
  assert.equal(parsed[0].rawText.includes("PhD"), false);
  const grad = parseKeryxSource([header, row("Mechanical Engineer I", direct)].join("\n"), "Keryx Non-Software New Grad 2027", now);
  assert.equal(grad[0].category, "New grad");
  const reviewedCatalog = sourceCatalog as SourceCatalog;
  const sources = reviewedCatalog.sources.filter(source => source.repository === "GodlyDonuts/keryx");
  assert.equal(sources.length, 2);
  assert.ok(sources.every(source => !source.trustedCoverage && !sourceAllowsAtsExpansion(source.name, reviewedCatalog.sources)));
});

test("reviewed employer coverage requires current eligible source evidence on the same ATS site", () => {
  const seed: CandidateJob = { company: "Example Inc.", title: "Mechanical Engineering Intern", category: "Internship", term: "Summer 2027", location: "Boston, MA", workMode: "unknown", postedAt: "2026-10-18T00:00:00Z", postedAtSource: "date_only", applyUrl: "https://example.wd1.myworkdayjobs.com/en-US/Careers/job/Boston/Intern_JR10000", source: "Reviewed", rawText: "Paid mechanical engineering internship", salary: null };
  const target = { ...seed, company: "Example Corporation", source: "Keryx", applyUrl: "https://example.wd1.myworkdayjobs.com/Careers/job/Seattle/Intern_JR10001" };
  const trusted = new Set(["Reviewed"]);
  const build = (candidates: CandidateJob[], trust: CompanyTrustEntry[] = [], closed = false) => buildReviewedEmployerCoverage(candidates, trusted, [], trust, () => closed);
  assert.ok(build([seed])(target));
  assert.ok(build([target, seed])(target));
  assert.equal(build([target])(target), undefined);
  assert.equal(build([seed])({ ...target, company: "Example Subsidiary" }), undefined);
  assert.equal(build([seed])({ ...target, applyUrl: target.applyUrl.replace("/Careers/", "/OtherSite/") }), undefined);
  assert.equal(build([seed])({ ...target, applyUrl: target.applyUrl.replace("example.wd1", "other.wd1") }), undefined);
  assert.equal(build([seed])({ ...target, rawText: "Unpaid internship" }), undefined);
  for (const status of ["blocked", "pending"] as const) {
    const trust: CompanyTrustEntry[] = [{ name: "Example", aliases: ["Example Corp"], status, reason: "Manual review", reviewedAt: "2026-10-18" }];
    assert.equal(build([seed], trust)(target), undefined);
    assert.equal(evaluateCompanyQuality({ name: "Example" }, "paid internship", [], trust).coverageExceptionAllowed, undefined);
  }
  for (const invalid of [{ ...seed, location: "Shanghai" }, { ...seed, term: "Summer 2020" }, { ...seed, sourceActive: false }, { ...seed, title: "Senior Mechanical Engineer" }, { ...seed, rawText: "unpaid internship" }, { ...seed, source: "Unreviewed" }]) {
    assert.equal(build([invalid])(target), undefined);
  }
  assert.equal(build([seed], [], true)(target), undefined);
  assert.equal(employerBoardIdentity("https://jobs.lever.co.evil.example/example/job"), null);
  assert.equal(employerBoardIdentity("https://example.wd1.myworkdayjobs.com/Careers"), null);
  assert.equal(employerBoardIdentity("http://jobs.lever.co/example/job"), null);
  assert.equal(employerBoardIdentity("https://user:password@jobs.lever.co/example/job"), null);
  assert.equal(employerBoardIdentity("https://jobs.lever.co/%ZZ/job"), null);
  assert.equal(employerBoardIdentity("https://boards.greenhouse.io/example/jobs/100"), employerBoardIdentity("https://job-boards.greenhouse.io/example/jobs/200"));
  assert.notEqual(employerBoardIdentity("https://job-boards.eu.greenhouse.io/example/jobs/100"), employerBoardIdentity("https://job-boards.greenhouse.io/example/jobs/200"));
});

test("job summary keeps homepage counts aligned with the published collections", () => {
  const base = { id: "job", company: "Example", location: "New York, NY", workMode: "unknown" as const, postedAt: "2026-08-12T00:00:00Z", postedAtSource: "exact" as const, linkedInUrl: null, salary: null, sources: ["Test"], verifiedCompany: true };
  const snapshot = {
    generatedAt: "2026-08-12T00:00:00Z",
    jobs: [
      { ...base, id: "intern", title: "Software Engineer Intern", term: "Summer 2027", category: "Internship", applyUrl: "https://example.com/intern" },
      { ...base, id: "fulltime", title: "Software Engineer, New Grad", term: "Not stated", category: "New grad", applyUrl: "https://example.com/fulltime" },
    ],
    quarantinedCount: 4,
    sourceHealth: [{ name: "Healthy", status: "ok" as const, rows: 2 }, { name: "Failed", status: "failed" as const, rows: 0 }],
  };
  assert.deepEqual(buildJobsSummary(snapshot), {
    generatedAt: snapshot.generatedAt,
    totalJobs: 2,
    internships: 1,
    fulltime: 1,
    screenedOut: null,
    closedPostingsCaught: null,
    screening: null,
    activeSources: 2,
    healthySources: 1,
  });
});

test("screening uses exclusive final destinations, with acceptance winning across sources", () => {
  const tracker = createScreeningTracker();
  tracker.record("https://example.com/accepted?utm_source=one", "pendingVerification");
  tracker.record("https://example.com/accepted", "role");
  tracker.record("https://example.com/closed?utm_source=one", "closed");
  tracker.record("https://example.com/closed", "pendingVerification");
  tracker.record("https://example.com/closed", "role");
  tracker.record("https://example.com/pending", "pendingVerification");
  tracker.record("https://example.com/pending", "pendingVerification");
  tracker.record("https://example.com/expired", "expired");
  tracker.record("https://example.com/location", "location");
  tracker.record("https://example.com/role", "role");
  tracker.record("https://example.com/employer", "employer");
  tracker.record("not a url", "role");
  const metrics = tracker.summarize(["https://example.com/accepted", "https://example.com/accepted?utm_source=two", "https://example.com/recovered"]);
  assert.deepEqual(metrics, {
    version: 1, unit: "application_destinations", reviewed: 8, accepted: 2, excluded: 5,
    pendingVerification: 1, uncountedRecords: 1,
    reasons: { closed: 1, expired: 1, location: 1, role: 1, employer: 1 },
  });
  const snapshot = { generatedAt: "2026-10-19T05:00:00Z", jobs: [], quarantinedCount: 999, sourceHealth: [], screening: metrics };
  const summary = buildJobsSummary(snapshot);
  assert.equal(summary.screenedOut, 5);
  assert.equal(summary.closedPostingsCaught, 1);
  assert.deepEqual(summary.screening, metrics);
  assert.equal(buildJobsSummary({ ...snapshot, screening: null }).screenedOut, null);
  const reverse = createScreeningTracker();
  reverse.record("https://example.com/closed", "pendingVerification");
  reverse.record("https://example.com/closed", "closed");
  assert.equal(reverse.summarize([]).reasons.closed, 1);
});

test("daily insights capture aggregates without storing individual jobs", () => {
  const base = { company: "Example", term: "Not stated", regions: ["us" as const], postedAtSource: "exact" as const, linkedInUrl: null, salary: null, sources: ["Test"], verifiedCompany: true };
  const snapshot = {
    generatedAt: "2026-09-19T12:00:00Z",
    jobs: [
      { ...base, id: "intern", title: "Software Engineer Intern", category: "Internship", location: "Palo Alto, CA", metros: ["sf-bay-area" as const], workMode: "hybrid" as const, postedAt: "2026-09-18T12:00:00Z", applyUrl: "https://example.com/intern" },
      { ...base, id: "fulltime", title: "Data Analyst, New Grad", category: "New grad", location: "New York, NY", metros: ["new-york-city" as const], workMode: "remote" as const, postedAt: "2026-09-01T12:00:00Z", applyUrl: "https://example.com/fulltime" },
    ],
    quarantinedCount: 4,
    sourceHealth: [{ name: "Healthy", status: "ok" as const, rows: 2 }],
  };
  const day = buildJobInsightsDay(snapshot, { closedPostingsCaught: 3 });
  assert.equal(day.date, "2026-09-19");
  assert.equal(day.openRoles, 2);
  assert.equal(day.internships, 1);
  assert.equal(day.fulltime, 1);
  assert.equal(day.freshListings7d, 1);
  assert.equal(day.activeCompanies, 1);
  assert.equal(day.workModes.hybrid, 1);
  assert.equal(day.workModes.remote, 1);
  assert.equal(day.regions.us, 2);
  assert.equal(day.metros["sf-bay-area"], 1);
  assert.equal(day.metros["new-york-city"], 1);
  assert.equal(day.roleAreas.software, 1);
  assert.equal(day.roleAreas["data-science"], 1);
  assert.equal("jobs" in day, false);
});

test("daily insights replace the same date and retain a bounded history", () => {
  const day = buildJobInsightsDay({ generatedAt: "2026-09-19T12:00:00Z", jobs: [], quarantinedCount: 0, sourceHealth: [] });
  const yesterday = { ...day, date: "2026-09-18", openRoles: 10 };
  const replacement = { ...day, openRoles: 12 };
  assert.deepEqual(updateJobInsightsHistory({ version: 1, days: [yesterday, day] }, replacement, 1).days, [replacement]);
});

test("verified and substantial-US-employment companies pass", () => {
  assert.equal(evaluateCompanyQuality({ name: "Figma, Inc." }, "paid software internship", registry).status, "approved");
  assert.equal(evaluateCompanyQuality({ name: "Established Global Firm", h1bApprovals: 24 }, "engineering internship", registry).status, "approved");
});

test("unknown companies quarantine and unpaid roles reject", () => {
  assert.equal(evaluateCompanyQuality({ name: "Unknown Remote Startup" }, "Remote US internship", registry).status, "quarantined");
  assert.equal(evaluateCompanyQuality({ name: "Figma" }, "Unpaid software internship", registry).status, "rejected");
});

test("company trust records block aliases and approve reviewed companies", () => {
  const trustRegistry: CompanyTrustEntry[] = [
    { name: "Inbulks", aliases: ["Inbulks Corp"], status: "blocked", reason: "Does not meet the company standard.", reviewedAt: "2026-08-14" },
    { name: "Reviewed Company", status: "approved", reason: "Established U.S. employer.", reviewedAt: "2026-08-14", minimumEmployees: 200 },
  ];
  assert.equal(evaluateCompanyQuality({ name: "Inbulks Corp" }, "internship", registry, trustRegistry).status, "rejected");
  const approved = evaluateCompanyQuality({ name: "Reviewed Company" }, "internship", registry, trustRegistry);
  assert.equal(approved.status, "approved");
  assert.equal(approved.minimumEmployees, 200);
});

test("normalization helpers preserve direct identity and source dates", () => {
  assert.equal(normalizeCompanyName("Figma, Inc."), "figma");
  assert.equal(canonicalizeUrl("https://example.com/jobs/1?utm_source=x&team=eng"), "https://example.com/jobs/1?team=eng");
  assert.equal(inferTerm("Software Intern - Summer '27"), "Summer 2027");
  assert.equal(inferWorkMode("Remote in the United States"), "remote");
  assert.equal(normalizeDisplayText("Software Intern \u2014 Platform"), "Software Intern - Platform");
  assert.deepEqual(parsePostedAt("2d", new Date("2026-08-11T12:00:00Z")), {
    postedAt: "2026-08-09T12:00:00.000Z",
    source: "relative_derived",
  });
});

test("off-season HTML tables preserve their dedicated term column", () => {
  const source = `<table><thead><tr><th>Company</th><th>Role</th><th>Location</th><th>Terms</th><th>Application</th><th>Age</th></tr></thead><tbody><tr><td>Figma</td><td>Software Engineer Intern</td><td>New York, NY</td><td>Winter 2027</td><td><a href="https://example.com/apply">Apply</a></td><td>0d</td></tr></tbody></table>`;
  assert.equal(parseMarkdownSource(source, "Test", new Date("2026-08-12T00:00:00Z"))[0]?.term, "Winter 2027");
});

test("markdown sources can use the linked role as the application column", () => {
  const markdown = `| Company | Role | Location | Pay | Added |
| --- | --- | --- | --- | --- |
| [Example](https://example.com) | [Software Engineer Intern](https://example.com/jobs/123) | Chicago | $30/hr | 2d |`;
  const [job] = parseMarkdownSource(markdown, "Dreamwork", new Date("2026-08-21T12:00:00Z"));
  assert.equal(job?.title, "Software Engineer Intern");
  assert.equal(job?.applyUrl, "https://example.com/jobs/123");
});

test("Dreamwork business tables parse linked roles and relative dates", () => {
  const markdown = `### Finance & Accounting (2)
| Company | Role | Location | Pay | Added |
| --- | --- | --- | --- | --- |
| **Example Bank** | [Credit Risk Analyst Intern](https://example.com/jobs/credit-risk) | Chicago, IL (Hybrid) | $52K | 0d |
| **Example Insurance** | [Actuarial Analyst Intern](https://example.com/jobs/actuarial) | Hartford, CT | $60K | 2d |`;
  const jobs = parseMarkdownSource(markdown, "Dreamwork Business Internships 2027", new Date("2026-09-15T12:00:00Z"));
  assert.equal(jobs.length, 2);
  assert.equal(jobs[0]?.applyUrl, "https://example.com/jobs/credit-risk");
  assert.equal(jobs[0]?.workMode, "hybrid");
  assert.equal(jobs[1]?.postedAt, "2026-09-13T12:00:00.000Z");
});

test("ApplyGuy ingestion keeps only configured categories and direct employer links", () => {
  const payload = JSON.stringify({ jobs: [
    { company: "Example", title: "Product Management Intern", category: "Product", location: "New York, NY", season: "Summer 2027", posted: "2026-09-15", url: "https://applyguy.ai/jobs/1", listingUrl: "https://example.com/jobs/product" },
    { company: "Example", title: "Software Engineer Intern", category: "Software Engineering", location: "New York, NY", season: "Summer 2027", posted: "2026-09-15", listingUrl: "https://example.com/jobs/software" },
    { company: "Example", title: "Product Intern", category: "Product", location: "New York, NY", season: "Summer 2027", posted: "2026-09-15", listingUrl: "https://applyguy.ai/jobs/3" },
  ] });
  const jobs = parseApplyGuySource(payload, "ApplyGuy Product Internships 2027", ["Product"]);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0]?.applyUrl, "https://example.com/jobs/product");
  assert.equal(jobs[0]?.category, "Internship");
});

test("restricted sources cannot seed full ATS board expansion", () => {
  const sources = [
    { id: "applyguy", name: "ApplyGuy Product Internships 2027", kind: "applyguy_json" as const, url: "https://example.com/feed.json", repository: "ApplyGuy/2027-Internships", active: true, trustedCoverage: false, expandAtsBoards: false },
    { id: "dreamwork", name: "Dreamwork New Grad US", kind: "markdown" as const, url: "https://example.com/README.md", repository: "dreamworkhq/New-Grad-Software-Engineer-Jobs", active: true, trustedCoverage: false, expandAtsBoards: false },
  ];
  assert.equal(sourceAllowsAtsExpansion("ApplyGuy Product Internships 2027", sources), false);
  assert.equal(sourceAllowsAtsExpansion("Dreamwork New Grad US", sources), false);
  assert.equal(sourceAllowsAtsExpansion("Other Source", sources), true);
});

test("ATS company aliases use the employer's public name", () => {
  assert.equal(normalizeCompanyDisplayName("Us Erac", "https://us-erac.icims.com/jobs/564700/accounting-intern/job"), "Enterprise Mobility");
  assert.equal(normalizeCompanyDisplayName("Example", "https://example.com/jobs/1"), "Example");
});

test("cross-source dedup prefers direct employer applications without merging separate requisitions", () => {
  const base = { company: "Amazon", title: "Product Manager Intern", term: "Summer 2027", location: "Seattle, WA", regions: ["us" as const], workMode: "unknown" as const, postedAt: "2026-08-10T00:00:00Z", postedAtSource: "date_only" as const, linkedInUrl: null, category: "Internship", salary: null, verifiedCompany: true };
  const jobs = deduplicateCrossSourceJobs([
    { ...base, id: "aggregator", applyUrl: "https://www.dreamworkhq.com/job/abc", sources: ["Dreamwork"] },
    { ...base, id: "direct", applyUrl: "https://www.amazon.jobs/en/jobs/123/product-manager-intern", sources: ["Open Tech"], postedAt: "2026-08-11T00:00:00Z", postedAtSource: "exact" as const },
    { ...base, id: "other-requisition", applyUrl: "https://www.amazon.jobs/en/jobs/456/product-manager-intern", sources: ["Another Direct Source"] },
  ]);
  assert.equal(jobs.length, 2);
  assert.equal(jobs[0]?.applyUrl, "https://www.amazon.jobs/en/jobs/123/product-manager-intern");
  assert.deepEqual(jobs[0]?.sources, ["Open Tech", "Dreamwork"]);
  assert.equal(jobs[0]?.postedAtSource, "exact");
});

test("completed internship terms are removed after a conservative season cutoff", () => {
  const base = { title: "Software Engineer Intern", category: "Internship", term: "Summer 2026", postedAt: "2026-08-20T00:00:00Z", postedAtSource: "relative_derived" as const };
  assert.match(getFreshnessRejection(base, new Date("2026-09-16T00:00:00Z")) ?? "", /Summer 2026 has already ended/);
  assert.equal(getFreshnessRejection({ ...base, term: "Fall 2026" }, new Date("2026-09-16T00:00:00Z")), null);
  assert.equal(getFreshnessRejection({ ...base, title: "Software Engineer", category: "New grad" }, new Date("2026-09-16T00:00:00Z")), null);
});

test("role areas classify prefiltered board views", () => {
  assert.equal(classifyRoleArea({ title: "Product Management Intern", category: "Internship" }), "product");
  assert.equal(classifyRoleArea({ title: "Quantitative Trading Intern", category: "Quant" }), "quant");
  assert.equal(classifyRoleArea({ title: "Data Science and Analytics Intern", category: "Internship" }), "data-science");
  assert.equal(classifyRoleArea({ title: "Business Intelligence Analyst", category: "New grad" }), "data-science");
  assert.equal(classifyRoleArea({ title: "Finance Analyst Intern", category: "Internship" }), "finance");
  assert.equal(classifyRoleArea({ title: "Business Analyst Intern", category: "Internship" }), "business-analyst");
  assert.equal(classifyRoleArea({ title: "Machine Learning Engineer Intern", category: "Internship" }), "software");
  assert.equal(classifyRoleArea({ title: "MLOps Engineer", category: "New grad" }), "software");
  assert.equal(classifyRoleArea({ title: "Network Software Engineer Intern", category: "Internship" }), "it-network");
  assert.equal(classifyRoleArea({ title: "IT Infrastructure Internship", category: "Internship" }), "it-network");
  assert.equal(classifyRoleArea({ title: "Help Desk Technician", category: "New grad" }), "it-network");
  assert.equal(classifyRoleArea({ title: "Cybersecurity Analyst Intern", category: "Internship" }), "it-network");
  assert.equal(classifyRoleArea({ title: "Data Science Intern - Corporate IT", category: "Internship" }), "data-science");
  assert.equal(classifyRoleArea({ title: "Leadership Rotation Network Intern", category: "Internship" }), null);
  assert.equal(classifyRoleArea({ title: "Hardware Systems Engineer - Board Design", category: "New grad" }), "hardware");
  assert.equal(classifyRoleArea({ title: "Electrical Engineering Intern", category: "Internship" }), "hardware");
  assert.equal(classifyRoleArea({ title: "ASIC Design Verification Engineer", category: "New grad" }), "hardware");
  assert.equal(classifyRoleArea({ title: "Embedded Systems Engineer", category: "New grad" }), "hardware");
  assert.equal(classifyRoleArea({ title: "Process Engineer (New Grad Summer 2027)", category: "New grad" }), "process-manufacturing");
  assert.equal(classifyRoleArea({ title: "Manufacturing Engineering Intern", category: "Internship" }), "process-manufacturing");
  assert.equal(classifyRoleArea({ title: "Embedded Software Engineer", category: "New grad" }), "software");
  assert.equal(classifyRoleArea({ title: "Technical Program Manager Intern, Hardware Engineering", category: "Internship" }), null);
  assert.equal(classifyRoleArea({ title: "LLM Post-training Engineer Graduate", category: "New grad" }), "software");
  assert.equal(classifyRoleArea({ title: "Accounting Intern", category: "Internship" }), "finance");
  assert.equal(classifyRoleArea({ title: "Actuarial Analyst Intern", category: "Internship" }), "finance");
  assert.equal(classifyRoleArea({ title: "Commercial Credit Underwriting Intern", category: "Internship" }), "finance");
  assert.equal(classifyRoleArea({ title: "Credit Risk Analyst Intern", category: "Internship" }), "finance");
  assert.equal(classifyRoleArea({ title: "Risk Advisory Intern", category: "Internship" }), "finance");
  assert.equal(classifyRoleArea({ title: "Capital Markets Intern", category: "Internship" }), "finance");
  assert.equal(classifyRoleArea({ title: "Strategy & Analytics Intern", category: "Internship" }), "data-science");
  assert.equal(classifyRoleArea({ title: "Business Systems Analyst Intern", category: "Internship" }), "business-analyst");
  assert.equal(classifyRoleArea({ title: "Supply Chain Analyst Intern", category: "Internship" }), "business-analyst");
  assert.equal(classifyRoleArea({ title: "Information Security Analyst Intern", category: "Internship" }), "it-network");
  assert.equal(classifyRoleArea({ title: "Database Administrator Intern", category: "Internship" }), "it-network");
  assert.equal(classifyRoleArea({ title: "Internship - Touring", category: "Internship" }), null);
  assert.equal(classifyRoleArea({ title: "Mechanical Engineering Intern", category: "Internship" }), null);
  assert.equal(classifyRoleArea({ title: "Brand Marketing Intern", category: "Internship" }), null);
});

test("supported ATS links reveal stable company board identifiers", () => {
  assert.equal(discoverAtsBoard("https://job-boards.greenhouse.io/figma/jobs/1234567", "Figma", "Test")?.id, "greenhouse:figma");
  assert.equal(discoverAtsBoard("https://jobs.lever.co/zoox/11111111-1111-4111-8111-111111111111", "Zoox", "Test")?.provider, "lever");
  assert.equal(discoverAtsBoard("https://jobs.ashbyhq.com/handshake/11111111-1111-4111-8111-111111111111", "Handshake", "Test")?.key, "handshake");
  assert.equal(
    discoverAtsBoard("https://jobs.ashbyhq.com/Citizen%20Health/11111111-1111-4111-8111-111111111111", "Citizen Health", "Test")?.endpoint,
    "https://api.ashbyhq.com/posting-api/job-board/Citizen%20Health",
  );
  assert.equal(isEarlyCareerTitle("Software Engineer Intern, Summer 2027"), true);
  assert.equal(isEarlyCareerTitle("Process Engineer I"), true);
  assert.equal(isEarlyCareerTitle("Senior Software Engineer"), false);
  assert.equal(isEarlyCareerTitle("Senior Mechanical Engineer I"), false);
  assert.equal(isEarlyCareerTitle("Product Manager Intern"), true);
  assert.equal(isEarlyCareerTitle("Technical Support Engineer", "This role requires 1-3 years of relevant experience."), true);
  assert.equal(isEarlyCareerTitle("Technical Support Engineer", "This role requires 1–3 years of relevant experience."), true);
  assert.equal(isEarlyCareerTitle("Product Support Engineer", "Candidates should have 0 to 2 years of professional experience."), true);
  assert.equal(isEarlyCareerTitle("Product Manager", "Candidates should have 0 to 2 years of professional experience."), true);
  assert.equal(isEarlyCareerTitle("Associate Solutions Engineer"), true);
  assert.equal(isEarlyCareerTitle("Support Engineer Tier 1"), true);
  assert.equal(isEarlyCareerTitle("Software Engineer", "This role requires 4-6 years of experience."), false);
  assert.equal(isEarlyCareerTitle("Senior Support Engineer", "This role requires 1-3 years of experience."), false);
  assert.equal(isEarlyCareerTitle("Sales Operations Manager", "This role requires 1-3 years of experience."), false);
});

test("store-floor retail roles cannot inherit professional sales tags", () => {
  for (const title of [
    "Seasonal Sales Associate (Part-Time) - City Creek Centre",
    "Retail Sales Associate", "Sales Associate - Seasonal", "Store Associate - Operations", "Cashier",
  ]) {
    const job = { title, category: "New grad", roleTags: ["marketing-sales", "operations-supply-chain"] };
    assert.deepEqual(classifyRoleTags(job), [], title);
    assert.deepEqual(getJobRoleTags(job), [], title);
    assert.equal(matchesRoleSelection(job, { family: "all", specialty: null }), false, title);
  }
  for (const title of ["Sales Development Representative", "Sales Operations Analyst", "Sales Associate", "Account Executive", "Customer Success Associate", "Retail Sales Analyst", "Retail Marketing Intern"]) {
    assert.ok(classifyRoleTags({ title, category: "New grad" }).includes("marketing-sales"), title);
  }
  assert.ok(classifyRoleTags({ title: "Software Engineer - Retail", category: "New grad" }).includes("software-engineering"));
  assert.ok(classifyRoleTags({ title: "Retail Data Analyst", category: "New grad" }).includes("analytics"));
});

test("role taxonomy supports multiple tags, broad families, and legacy links", () => {
  const semiconductor = { title: "Materials and Process Engineering Intern", category: "Internship" };
  assert.deepEqual(classifyRoleTags(semiconductor), ["process-manufacturing", "materials-chemical"]);
  assert.deepEqual(classifyRoleTags({ title: "Machine Learning Engineer Intern", category: "Internship" }), ["software-engineering", "ai-ml-engineering"]);
  assert.deepEqual(classifyRoleTags({ title: "Civil Engineering Intern", category: "Internship" }), ["civil-infrastructure"]);
  assert.deepEqual(classifyRoleTags({ title: "Mechanical Systems Test Engineer I", category: "New grad" }), ["mechanical", "systems-test"]);
  assert.deepEqual(classifyRoleTags({ title: "Software Engineer II - Reliability Engineering Tooling", category: "New grad" }), ["software-engineering"]);
  assert.deepEqual(classifyRoleTags({ title: "OTA/Cloud Validation Engineer - New Grad", category: "New grad" }), ["cloud-infrastructure"]);
  assert.deepEqual(classifyRoleTags({ title: "Quality Engineer I", category: "New grad" }), []);
  assert.deepEqual(classifyRoleTags({ title: "Supplier Quality Engineer I", category: "New grad" }), ["process-manufacturing", "quality-reliability"]);
  assert.deepEqual(classifyRoleTags({ title: "Device Engineer I", category: "New grad" }), ["hardware-electrical"]);
  assert.deepEqual(classifyRoleTags({ title: "Senior Mechanical Engineer I", category: "New grad" }), []);
  assert.deepEqual(classifyRoleTags({ title: "Product Manager Intern", category: "Internship" }), ["product"]);
  assert.deepEqual(classifyRoleTags({ title: "Technical Support Engineer - University Graduate 2027", category: "New grad" }), ["solutions-support", "it-support-network"]);
  assert.deepEqual(classifyRoleTags({ title: "Software Support Engineer Internship", category: "Internship" }), ["software-engineering", "solutions-support", "it-support-network"]);
  assert.deepEqual(classifyRoleTags({ title: "Forward Deployed Engineer - New Grad", category: "New grad" }), ["software-engineering", "solutions-support"]);
  assert.deepEqual(classifyRoleTags({ title: "Field Applications Engineer I", category: "New grad" }), ["solutions-support"]);
  assert.deepEqual(classifyRoleTags({ title: "Applications Engineering Internship", category: "Internship", rawText: "Build internal systems, data pipelines, and company processes." }), []);
  assert.deepEqual(classifyRoleTags({ title: "Applications Engineer", category: "New grad", rawText: "Work directly with customers on technical deployments." }), ["solutions-support"]);
  assert.deepEqual(classifyRoleTags({ title: "AI Solutions Engineer, Talent Acquisition", category: "New grad" }), ["software-engineering", "ai-ml-engineering"]);
  assert.deepEqual(classifyRoleTags({ title: "Data Solution Engineer Intern", category: "Internship", rawText: "Build internal reporting tools and data pipelines." }), []);
  assert.deepEqual(classifyRoleTags({ title: "Data Solution Engineer Intern", category: "Internship", rawText: "Work directly with clients on technical implementations." }), ["solutions-support"]);
  assert.deepEqual(classifyRoleTags({ title: "Sales Operations Manager", category: "New grad" }), []);
  assert.deepEqual(classifyRoleTags({ title: "Product Support Specialist", category: "New grad" }), ["solutions-support"]);
  assert.deepEqual(classifyRoleTags({ title: "Product Engineer I", category: "New grad" }), []);
  assert.deepEqual(classifyRoleTags({ title: "Product Design Engineer Intern", category: "Internship" }), ["design"]);
  assert.deepEqual(classifyRoleTags({ title: "Production Support Engineer I", category: "New grad" }), []);
  assert.deepEqual(classifyRoleTags({ title: "IT Help Desk Intern", category: "Internship" }), ["it-support-network"]);
  assert.deepEqual(classifyRoleTags({ title: "Vehicle Integration Engineer I", category: "New grad" }), ["systems-test"]);
  assert.deepEqual(classifyRoleTags({ title: "Structural Engineering Internship - Bridge", category: "Internship" }), ["civil-infrastructure"]);
  assert.deepEqual(classifyRoleTags({ title: "Structural Engineer I - Spacecraft", category: "New grad" }), ["mechanical"]);
  assert.deepEqual(classifyRoleTags({ title: "Customer Experience Representative, Active Trader", category: "New grad" }), []);
  assert.deepEqual(classifyRoleTags({ title: "Fullstack Engineer - Applications Engineering", category: "Internship" }), ["software-engineering"]);
  assert.deepEqual(getRoleSelection("product", null), { family: "product", specialty: null });
  assert.deepEqual(getRoleSelection("solutions-support", null), { family: "solutions-support", specialty: null });
  assert.deepEqual(getRoleSelection("process-manufacturing", null), { family: "engineering", specialty: "process-manufacturing" });
  assert.deepEqual(getRoleSelection("engineering", "mechanical"), { family: "engineering", specialty: "mechanical" });
  assert.deepEqual(getRoleSelection("data", "mechanical"), { family: "data", specialty: null });
  assert.equal(matchesRoleSelection(semiconductor, { family: "engineering", specialty: null }), true);
  assert.equal(matchesRoleSelection(semiconductor, { family: "engineering", specialty: "materials-chemical" }), true);
  assert.equal(matchesRoleSelection(semiconductor, { family: "software", specialty: null }), false);
  assert.equal(matchesRoleSelection({ title: "Associate Product Manager", category: "New grad", roleTags: ["product"] }, { family: "product", specialty: null }), true);
  assert.equal(matchesRoleSelection({ title: "Forward Deployed Engineer", category: "New grad", roleTags: ["software-engineering"] }, { family: "solutions-support", specialty: null }), true);
});

test("physical quality context and semiconductor materials terms remain distinct from software QA", () => {
  assert.deepEqual(
    classifyRoleTags({ title: "Quality Engineer I", category: "New grad", rawText: "Medical device manufacturing under ISO 13485 and FDA requirements" }),
    ["quality-reliability"],
  );
  assert.equal(
    classifyRoleTags({ title: "Software Quality Engineer I", category: "New grad", rawText: "Medical device software verification" }).includes("quality-reliability"),
    false,
  );
  assert.equal(
    classifyRoleTags({ title: "New College Grad - Dry Etch Process Engineer", category: "New grad" }).includes("materials-chemical"),
    true,
  );
  assert.equal(
    classifyRoleTags({ title: "Software Engineer - Metrology Systems", category: "New grad" }).includes("materials-chemical"),
    false,
  );
  assert.equal(
    classifyRoleTags({ title: "Commercial Analytics Intern", category: "Chemistry" }).includes("materials-chemical"),
    false,
  );
  assert.deepEqual(
    getJobRoleTags({ title: "Commercial Analytics Intern", category: "Internship", roleTags: ["analytics", "materials-chemical"] }),
    ["analytics"],
  );
});

test("pinned ATS boards produce stable public endpoints", () => {
  for (const seed of pinnedBoards) {
    const board = createAtsBoard(seed as AtsBoardSeed);
    assert.equal(board.endpoint.startsWith("https://"), true);
    assert.equal(board.source, "Pinned ATS");
  }

  assert.equal(
    createAtsBoard({ provider: "greenhouse", key: "freeformfuturecorp", company: "Freeform" }).id,
    "greenhouse:freeformfuturecorp",
  );
});

test("Workday boards produce stable endpoints and parse live early-career jobs", () => {
  const board = createWorkdayBoard({
    host: "https://micron.wd1.myworkdayjobs.com/",
    tenant: "micron",
    site: "External",
    company: "Micron",
    searchTerms: ["new college grad"],
  });
  assert.equal(board.endpoint, "https://micron.wd1.myworkdayjobs.com/wday/cxs/micron/External/jobs");
  assert.throws(() => createWorkdayBoard({
    host: "example.com",
    tenant: "micron",
    site: "External",
    company: "Micron",
    searchTerms: ["new college grad"],
  }), /Invalid Workday host/);
  assert.deepEqual(parseWorkdayPostedAt("Posted 3 Days Ago", new Date("2026-09-27T12:00:00Z")), {
    postedAt: "2026-09-24T12:00:00.000Z",
    source: "relative_derived",
  });

  const job = parseWorkdayJob(board, {
    title: "New College Grad - Process Engineer",
    externalPath: "/job/Boise-ID/New-College-Grad---Process-Engineer_JR12345",
    locationsText: "Boise, ID",
  }, {
    jobPostingInfo: {
      title: "New College Grad - Process Engineer",
      jobDescription: "Support thin film deposition and process improvements.",
      location: "Boise, ID",
      startDate: "2026-09-20",
      timeType: "Full time",
      canApply: true,
      posted: true,
    },
  }, new Date("2026-09-27T12:00:00Z"));

  assert.equal(job?.company, "Micron");
  assert.equal(job?.category, "New grad");
  assert.equal(job?.source, "Direct ATS (Workday)");
  assert.match(job?.applyUrl ?? "", /JR12345/);
  assert.match(job?.rawText ?? "", /thin film deposition/);
});

test("Workday connector paginates, retries transient failures, and keeps successful details", async () => {
  const board = createWorkdayBoard({
    host: "example.wd1.myworkdayjobs.com",
    tenant: "example",
    site: "Careers",
    company: "Example",
    searchTerms: ["engineer i"],
  });
  const summaries = Array.from({ length: 21 }, (_, index) => ({
    title: "Process Engineer I",
    externalPath: index === 20 ? "/job/Test/Process-Engineer-I_JRFAILED" : `/job/Test/Process-Engineer-I_JR${1000 + index}`,
    locationsText: "Austin, TX",
    postedOn: "Posted Today",
  }));
  let listAttempts = 0;
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (init?.method === "POST") {
      listAttempts += 1;
      if (listAttempts === 1) return new Response("temporary", { status: 500, statusText: "Temporary failure" });
      const body = JSON.parse(String(init.body)) as { offset: number };
      const page = body.offset === 0 ? summaries.slice(0, 20) : summaries.slice(20);
      return Response.json({ total: summaries.length, jobPostings: page });
    }
    if (url.includes("JRFAILED")) return new Response("temporary", { status: 503, statusText: "Unavailable" });
    const externalPath = new URL(url).pathname.replace("/wday/cxs/example/Careers", "");
    return Response.json({
      jobPostingInfo: {
        title: "Process Engineer I",
        jobDescription: "Entry-level semiconductor manufacturing process engineering.",
        location: "Austin, TX",
        postedOn: "Posted Today",
        timeType: "Full time",
        canApply: true,
        posted: true,
        externalUrl: `${board.careerBaseUrl}${externalPath}`,
      },
    });
  }) as typeof fetch;

  const result = await fetchWorkdayBoard(board, new Date("2026-09-28T12:00:00Z"), { fetchImpl, retryDelayMs: 0 });
  assert.equal(result.searchedPostings, 21);
  assert.equal(result.jobs.length, 20);
  assert.equal(result.diagnostics.listRequests, 2);
  assert.equal(result.diagnostics.detailRequests, 21);
  assert.equal(result.diagnostics.detailFailures, 1);
  assert.equal(result.diagnostics.retryRequests, 3);
});

test("refresh report summarizes source health, request volume, and listing decisions", () => {
  const report = buildRefreshReport({
    startedAt: new Date("2026-09-28T12:00:00Z"),
    completedAt: new Date("2026-09-28T12:00:05Z"),
    sourceDiagnostics: [
      { name: "Community", kind: "markdown", status: "ok", rows: 100, durationMs: 400, requestCount: 1 },
      { name: "Empty", kind: "markdown", status: "ok", rows: 0, durationMs: 200, requestCount: 1 },
    ],
    boardDiagnostics: [{
      provider: "workday",
      key: "example/Careers",
      company: "Example",
      status: "ok",
      rows: 20,
      listRequests: 2,
      detailRequests: 21,
      detailFailures: 1,
      retryRequests: 3,
      durationMs: 900,
    }],
    verificationDiagnostics: [{ provider: "microsoft", attempted: 2, verified: 1 }],
    candidates: 120,
    accepted: 80,
    quarantined: 10,
    rejected: 30,
    preservedFromLastHealthySnapshot: 4,
    checksAttempted: 8,
    checksCompleted: 7,
    knownClosed: 2,
  });
  assert.equal(report.status, "degraded");
  assert.equal(report.durationMs, 5_000);
  assert.equal(report.sources.requestCount, 2);
  assert.equal(report.boards.requestCount, 26);
  assert.equal(report.boards.detailFailures, 1);
  assert.equal(report.listings.preservedFromLastHealthySnapshot, 4);
});

test("last-known-good recovery preserves only missing jobs that still pass validation", () => {
  const existing = {
    id: "existing",
    company: "Example",
    title: "Process Engineer I",
    term: "Not stated",
    location: "Austin, TX",
    workMode: "in_person" as const,
    postedAt: "2026-09-28T00:00:00.000Z",
    postedAtSource: "exact" as const,
    applyUrl: "https://example.com/jobs/1",
    linkedInUrl: null,
    category: "New grad",
    salary: null,
    sources: ["Test"],
    verifiedCompany: true,
  };
  const current = new Map([[jobIdentity(existing.applyUrl)!, existing]]);
  const priorJobs = [
    existing,
    { ...existing, id: "preserve", applyUrl: "https://example.com/jobs/2" },
    { ...existing, id: "reject", applyUrl: "https://example.com/jobs/3", title: "Expired role" },
  ];
  const preserved = preserveLastKnownGoodJobs(current, priorJobs, (job) => job.title === "Expired role" ? null : job);
  assert.equal(preserved, 1);
  assert.equal(current.size, 2);
  assert.equal(current.get(jobIdentity("https://example.com/jobs/2")!)?.id, "preserve");
});

test("SmartRecruiters records replace source-list age with employer date and status", () => {
  const url = "https://jobs.smartrecruiters.com/InbulksCorp/743999750129753/example";
  assert.deepEqual(parseSmartRecruitersJobUrl(url), {
    companyIdentifier: "InbulksCorp",
    jobId: "743999750129753",
    endpoint: "https://api.smartrecruiters.com/v1/companies/InbulksCorp/postings/743999750129753",
  });
  const candidate = {
    company: "Inbulks",
    title: "Junior Front End Developer Intern",
    term: "Not stated",
    location: "Remote, United States",
    workMode: "remote" as const,
    postedAt: "2026-08-14T00:00:00.000Z",
    postedAtSource: "relative_derived" as const,
    applyUrl: url,
    category: "Internship",
    salary: null,
    source: "Test",
    rawText: "Junior Front End Developer Intern",
  };
  const enriched = applySmartRecruitersPosting(candidate, { active: true, releasedDate: "2021-05-25T20:26:03.000Z" });
  assert.equal(enriched.postedAt, "2021-05-25T20:26:03.000Z");
  assert.equal(enriched.postedAtSource, "exact");
  assert.equal(enriched.sourceActive, true);
  assert.match(getFreshnessRejection(enriched, new Date("2026-08-14T00:00:00Z")) ?? "", /beyond the 180-day internship limit/);
  assert.equal(getFreshnessRejection({ ...enriched, postedAt: "2026-08-01T00:00:00Z" }, new Date("2026-08-14T00:00:00Z")), null);
  assert.match(getFreshnessRejection({ ...enriched, sourceActive: false }, new Date("2026-08-14T00:00:00Z")) ?? "", /marks this posting as closed/);
});

test("Microsoft Careers records replace source-list age and country-code collisions", () => {
  const url = "https://apply.careers.microsoft.com/careers/job/1970393556911730";
  assert.deepEqual(parseMicrosoftCareersJobUrl(url), { jobId: "1970393556911730", endpoint: url });
  assert.equal(parseMicrosoftCareersJobUrl("https://apply.careers.microsoft.com/careers?pid=200047371")?.jobId, "200047371");

  const html = `<script type="application/ld+json">${JSON.stringify({
    "@context": "http://schema.org",
    "@type": "JobPosting",
    datePosted: "2026-08-07T10:30:00",
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: { "@type": "Country", name: "IL" }, addressLocality: "", addressRegion: "" } },
  })}</script>`;
  assert.deepEqual(parseMicrosoftCareersPosting(html), { postedAt: "2026-08-07T10:30:00.000Z", location: "Israel" });

  const candidate = {
    company: "Microsoft",
    title: "Software Engineering INTERN",
    term: "Not stated",
    location: "Il, IL",
    workMode: "hybrid" as const,
    postedAt: "2026-09-24T12:00:00.000Z",
    postedAtSource: "relative_derived" as const,
    applyUrl: url,
    category: "Internship",
    salary: null,
    source: "Test",
    rawText: "Microsoft Software Engineering INTERN",
  };
  const enriched = applyMicrosoftCareersPosting(candidate, parseMicrosoftCareersPosting(html)!);
  assert.equal(enriched.postedAt, "2026-08-07T10:30:00.000Z");
  assert.equal(enriched.postedAtSource, "exact");
  assert.equal(enriched.location, "Israel");
  assert.deepEqual(getSupportedJobRegions(enriched.location), []);
});

test("listing checks only remove confirmed closed pages", () => {
  assert.equal(classifyListingResponse(404, ""), "closed");
  assert.equal(classifyListingResponse(403, "Access denied"), "unknown");
  assert.equal(classifyListingResponse(200, "This position has been filled."), "closed");
  assert.equal(classifyListingResponse(200, "Apply for this open position"), "live");
  assert.equal(needsListingCheck({ url: "https://example.com/job", status: "live", checkedAt: "2026-08-12T00:00:00Z", httpStatus: 200 }, new Date("2026-08-12T12:00:00Z")), false);
});

test("listing health reads visible vacancy content instead of scripts and shared chrome", () => {
  assert.equal(classifyListingResponse(200, '<main><h1>Page not found.</h1><p>Sorry, this role does not exist or is no longer available.</p></main>'), "closed");
  assert.equal(classifyListingResponse(200, '<main><p>This role is no longer available.</p></main>'), "closed");
  assert.equal(classifyListingResponse(200, '<script>const translations = {closed: "This position has been filled."}</script><nav>Applications closed</nav><main><h1>Software Engineer</h1><button>Apply now</button></main><footer>This job has expired</footer>'), "live");
  assert.equal(classifyListingResponse(200, '<main><template>This job has expired</template><p hidden>This position has been filled.</p><p aria-hidden="true">Applications closed</p><h2>Job description</h2><p>Build software.</p></main>'), "live");
  assert.equal(classifyListingResponse(200, '<div id="root"></div><script>startApp()</script>'), "unknown");
  assert.equal(classifyListingResponse(200, '<main>Explore our careers and teams</main>'), "unknown");
  assert.equal(classifyListingResponse(200, '<main>Access denied. Apply now</main>'), "unknown");
  assert.equal(classifyListingResponse(200, '<main>Verify you are human</main>'), "unknown");
  assert.equal(classifyListingResponse(302, 'Apply now'), "unknown");
  assert.equal(classifyListingResponse(410, ''), "closed");
  assert.equal(classifyListingResponse(429, 'This job has expired'), "unknown");
  assert.equal(classifyListingResponse(503, 'This job has expired'), "unknown");
});

test("every active upstream repository has explicit license review metadata", () => {
  const catalogRepositories = [...new Set(sourceCatalog.sources.filter((source) => source.active).map((source) => source.repository))].sort();
  const reviewedRepositories = sourceLicenseReview.repositories.map((record) => record.repository).sort();
  assert.deepEqual(catalogRepositories.filter((repository) => !reviewedRepositories.includes(repository)), []);

  for (const record of sourceLicenseReview.repositories) {
    if (record.status === "licensed") {
      assert.equal(record.spdxId, "MIT");
      assert.ok(record.licenseUrl);
      assert.ok(record.copyright);
    } else {
      assert.equal(record.spdxId, null);
      assert.equal(record.licenseUrl, null);
      assert.match(record.note, /not treated as permission/i);
    }
  }
});

test("USAJOBS selective review requires paid current vacancies and preserves agency identity", () => {
  const seed = { url: "https://www.usajobs.gov/job/123456789", title: "Civil Engineer (Recent Graduate)", agency: "Example Federal Agency" };
  const data = { "@type": "JobPosting", title: seed.title, hiringOrganization: seed.agency, datePosted: "10/01/2026", validThrough: "2026-11-30", baseSalary: { currency: "USD", value: { value: 50000, unitText: "YEAR" } }, jobLocation: [{ address: { addressLocality: "Denver", addressRegion: "CO" } }], qualifications: "Bachelor degree in civil engineering." };
  const page = (overrides = {}, summary = "Paid recent graduate opportunity.", extra = "") => `<main>Accepting applications. 2 vacancies.<div id="joa-summary">${summary}</div><div id="joa-requirements">U.S. Citizenship required. Prior volunteer experience may be credited.</div>${extra}</main><script type="application/ld+json">${JSON.stringify({ ...data, ...overrides })}</script>`;
  const now = new Date("2026-10-19T12:00:00Z");
  const review = (html: string, input = seed) => reviewUsaJobsPosting(input, html, now);
  const valid = review(page());
  assert.equal(valid.status, "candidate");
  if (valid.status === "candidate") { assert.equal(valid.candidate.company, seed.agency); assert.equal(valid.candidate.category, "New grad"); assert.equal(valid.citizenshipRequired, true); }
  assert.deepEqual(review(page({}, "Unpaid student volunteer opportunity.")), { status: "held", reason: "unpaid" });
  assert.deepEqual(review(page({}, undefined, "There may or may not be actual vacancies.")), { status: "held", reason: "standing-recruitment-notice" });
  assert.deepEqual(review(page({ baseSalary: { currency: "USD", value: { value: 0 } } })), { status: "held", reason: "unverified-paid-compensation" });
  assert.deepEqual(review(page({ validThrough: "2027-09-30" })), { status: "held", reason: "extended-recruitment-window" });
  assert.deepEqual(review(page({ validThrough: "2026-10-19" })), { status: "held", reason: "closed-or-closing-today" });
  assert.deepEqual(review(page({ datePosted: "11/01/2026" })), { status: "held", reason: "unverified-posting-dates" });
  assert.deepEqual(review(page({ datePosted: "02/30/2026" })), { status: "held", reason: "unverified-posting-dates" });
  assert.deepEqual(review(page({ jobLocation: [{ address: { addressLocality: "Berlin", addressCountry: "Germany" } }] })), { status: "held", reason: "unverified-or-ineligible-location" });
  assert.deepEqual(review(page({ title: "Supervisory Civil Engineer" }), { ...seed, title: "Supervisory Civil Engineer" }), { status: "held", reason: "seniority" });
  assert.deepEqual(review(page(), { ...seed, agency: "Different Agency" }), { status: "held", reason: "posting-identity-mismatch" });
  assert.deepEqual(review(page(), { ...seed, url: "https://www.usajobs.gov.evil.example/job/123456789" }), { status: "held", reason: "untrusted-url" });
  assert.deepEqual(review("<main>Access denied</main>"), { status: "held", reason: "missing-official-posting-structure" });
  assert.equal(review(page({}, undefined, '<script>There may or may not be vacancies</script>')).status, "candidate");
  const officePage = page({ hiringOrganization: "Engineering Office" }, undefined, `<div id="joa-header">${seed.agency} Engineering Office</div>`);
  const office = review(officePage);
  assert.equal(office.status, "candidate");
  if (office.status === "candidate") assert.equal(office.candidate.company, seed.agency);
  assert.deepEqual(review(page({ jobLocation: [{ address: { addressLocality: "Denver", addressRegion: "CO" } }, { address: { addressLocality: "Berlin", addressCountry: "Germany" } }] })), { status: "held", reason: "unverified-or-ineligible-location" });
});

test("USAJOBS admission requires fresh authenticated provenance and never recovers stale records", async () => {
  assert.equal(await loadReviewedUsaJobs(false), null);
  const candidate: CandidateJob = { company: "Bureau of Reclamation", title: "Civil Engineer (Recent Graduate)", applyUrl: "https://www.usajobs.gov/job/888900400", location: "Lakewood, CO", category: "New grad", term: "Not stated", workMode: "unknown", postedAt: "2026-10-15T00:00:00Z", postedAtSource: "date_only", salary: null, source: "USAJOBS selective review", rawText: "Paid civil engineering position", federal: { retrievedAt: "2026-10-19T12:00:00Z", closes: "2026-10-29", citizenshipRequired: true, eligibility: "Recent-graduate eligibility applies." } };
  assert.equal(reviewedFederalCoverage(candidate), false);
  for (const altered of [{ ...candidate, source: "Unreviewed feed" }, { ...candidate, company: "Different Agency" }, { ...candidate, applyUrl: "https://www.usajobs.gov/job/999999999" }, { ...candidate, federal: undefined }]) assert.equal(reviewedFederalCoverage(altered), false);
  const job = { ...candidate, id: "federal", sources: [candidate.source], linkedInUrl: null, verifiedCompany: true };
  assert.equal(isInCollection(job, "fulltime"), true);
  assert.equal(isInCollection(job, "internships"), false);
  assert.equal(getFreshnessRejection(candidate, new Date("2026-10-28T12:00:00Z")), null);
  assert.match(getFreshnessRejection(candidate, new Date("2026-10-29T12:00:00Z")) ?? "", /closed/);
  assert.equal(preserveLastKnownGoodJobs(new Map(), [job], prior => prior), 0);
  assert.equal(preserveLastKnownGoodJobs(new Map(), [{ ...job, federal: undefined }], prior => prior), 0);
  assert.equal(evaluateCompanyQuality({ name: candidate.company }, candidate.rawText, [], [{ name: candidate.company, status: "blocked", reviewedAt: "2026-10-19", reason: "Manual hold" }]).status, "rejected");
});

test("USAJOBS discovery paginates within caps, deduplicates and keeps credentials off detail requests", async () => {
  const now = new Date();
  const posted = now.toISOString().slice(0, 10);
  const closes = new Date(now.getTime() + 30 * 86_400_000).toISOString().slice(0, 10);
  const seed = { PositionURI: "https://www.usajobs.gov/job/123456789", PositionTitle: "Civil Engineer (Recent Graduate)", OrganizationName: "Example Federal Agency" };
  const structured = { "@type": "JobPosting", title: seed.PositionTitle, hiringOrganization: seed.OrganizationName, datePosted: posted, validThrough: closes, baseSalary: { currency: "USD", value: { value: 50000, unitText: "YEAR" } }, jobLocation: [{ address: { addressLocality: "Denver", addressRegion: "CO" } }] };
  const html = `<main>Accepting applications. 2 vacancies.<div id="joa-summary">Paid recent graduate job.</div><div id="joa-requirements">U.S. Citizenship required.</div></main><script type="application/ld+json">${JSON.stringify(structured)}</script>`;
  let searchCalls = 0;
  let detailCalls = 0;
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    assert.equal(init?.redirect, "error");
    if (url.hostname === "data.usajobs.gov") {
      searchCalls++;
      assert.equal(headers.get("Authorization-Key"), "fixture-key");
      assert.ok(Number(url.searchParams.get("Page")) <= 2);
      return Response.json({ SearchResult: { SearchResultCountAll: 10000, SearchResultItems: [{ MatchedObjectDescriptor: seed }, { MatchedObjectDescriptor: { ...seed, PositionURI: "https://untrusted.example/job/123456789" } }] } });
    }
    detailCalls++;
    assert.equal(headers.get("Authorization-Key"), null);
    assert.equal(url.hostname, "www.usajobs.gov");
    return new Response(html);
  };
  const result = await loadReviewedUsaJobs(true, { fetcher, apiKey: "fixture-key", email: "test@example.invalid", costReviewed: true });
  assert.ok(result);
  assert.equal(result.failed, false);
  assert.equal(searchCalls, 22);
  assert.equal(detailCalls, 1);
  assert.equal(result.truncated, true);
  assert.equal(result.discovered, 1);
  assert.equal(result.candidates.length, 1);
  assert.equal(reviewedFederalCoverage(result.candidates[0]), true);
  assert.equal(reviewedFederalCoverage({ ...result.candidates[0] }), false);
  const denied = await loadReviewedUsaJobs(true, { fetcher: async () => new Response(null, { status: 429 }), apiKey: "fixture-key", email: "test@example.invalid", costReviewed: true });
  assert.equal(denied?.requests, 1);
  assert.equal(denied?.failed, true);
  assert.deepEqual(denied?.candidates, []);
  let blockedDetails = 0;
  const partial = await loadReviewedUsaJobs(true, { fetcher: async input => {
    if (String(input).startsWith("https://data.usajobs.gov/")) return Response.json({ SearchResult: { SearchResultCountAll: 2, SearchResultItems: [{ MatchedObjectDescriptor: seed }, { MatchedObjectDescriptor: { ...seed, PositionURI: "https://www.usajobs.gov/job/987654321" } }] } });
    blockedDetails++;
    return blockedDetails === 1 ? new Response(html) : new Response(null, { status: 429 });
  }, apiKey: "fixture-key", email: "test@example.invalid", costReviewed: true });
  assert.equal(partial?.failed, true);
  assert.deepEqual(partial?.candidates, []);
  const missing = await loadReviewedUsaJobs(true, { fetcher: async () => { throw Error("Must not request"); }, apiKey: "", email: "", costReviewed: false });
  assert.equal(missing?.requests, 0);
});
