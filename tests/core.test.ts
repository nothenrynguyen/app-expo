import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCompanyQuality, normalizeCompanyName, type CompanyTrustEntry, type VerifiedCompany } from "../lib/company-quality";
import { getFreshnessRejection } from "../lib/job-freshness";
import { buildJobsSummary } from "../lib/job-summary";
import { daysAgo } from "../lib/jobs";
import { canonicalizeUrl, inferTerm, inferWorkMode, jobIdentity, normalizeDisplayText, parsePostedAt } from "../lib/source-normalization";
import { isInCollection } from "../lib/job-collections";
import { classifyRoleArea } from "../lib/role-areas";
import { discoverAtsBoard, isEarlyCareerTitle } from "../lib/ats-boards";
import { classifyListingResponse, needsListingCheck } from "../lib/listing-health";
import { applySmartRecruitersPosting, parseSmartRecruitersJobUrl } from "../lib/smartrecruiters";
import { parseMarkdownSource } from "../scripts/sync-jobs";
import { classifyJobRegions, formatSnapshotAge, getSupportedJobRegions, normalizeJobLocation } from "../lib/job-locations";
import { isDiscoverableYearlyRepository } from "../scripts/maintain-sources";

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
  assert.deepEqual(classifyJobRegions("Chicago"), ["us"]);
  assert.deepEqual(classifyJobRegions("Toronto"), ["canada"]);
  assert.deepEqual(classifyJobRegions("Auckland, NZ"), ["australia_nz"]);
  assert.deepEqual(classifyJobRegions("London, United Kingdom; New York, NY"), ["europe", "us"]);
  assert.deepEqual(getSupportedJobRegions("Auckland, NZ"), []);
  assert.deepEqual(getSupportedJobRegions("Singapore"), []);
  assert.deepEqual(getSupportedJobRegions("Location not stated"), []);
  assert.deepEqual(getSupportedJobRegions("London, United Kingdom; New York, NY"), ["europe", "us"]);
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
  assert.equal(isInCollection({ ...base, title: "Software Engineer, New Grad", term: "Not stated", category: "New grad" }, "fulltime"), true);
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
    activeSources: 2,
    healthySources: 1,
  });
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
  assert.equal(classifyRoleArea({ title: "LLM Post-training Engineer Graduate", category: "New grad" }), "software");
  assert.equal(classifyRoleArea({ title: "Accounting Intern", category: "Internship" }), "finance");
  assert.equal(classifyRoleArea({ title: "Internship - Touring", category: "Internship" }), null);
  assert.equal(classifyRoleArea({ title: "Mechanical Engineering Intern", category: "Internship" }), null);
  assert.equal(classifyRoleArea({ title: "Brand Marketing Intern", category: "Internship" }), null);
});

test("supported ATS links reveal stable company board identifiers", () => {
  assert.equal(discoverAtsBoard("https://job-boards.greenhouse.io/figma/jobs/1234567", "Figma", "Test")?.id, "greenhouse:figma");
  assert.equal(discoverAtsBoard("https://jobs.lever.co/zoox/11111111-1111-4111-8111-111111111111", "Zoox", "Test")?.provider, "lever");
  assert.equal(discoverAtsBoard("https://jobs.ashbyhq.com/handshake/11111111-1111-4111-8111-111111111111", "Handshake", "Test")?.key, "handshake");
  assert.equal(isEarlyCareerTitle("Software Engineer Intern, Summer 2027"), true);
  assert.equal(isEarlyCareerTitle("Senior Software Engineer"), false);
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

test("listing checks only remove confirmed closed pages", () => {
  assert.equal(classifyListingResponse(404, ""), "closed");
  assert.equal(classifyListingResponse(403, "Access denied"), "unknown");
  assert.equal(classifyListingResponse(200, "This position has been filled."), "closed");
  assert.equal(classifyListingResponse(200, "Apply for this open position"), "live");
  assert.equal(needsListingCheck({ url: "https://example.com/job", status: "live", checkedAt: "2026-08-12T00:00:00Z", httpStatus: 200 }, new Date("2026-08-12T12:00:00Z")), false);
});
