import assert from "node:assert/strict";
import test from "node:test";
import { hasRequiredExperienceConflict, qualificationText } from "../lib/early-career-evidence";
import { createAtsBoard, fetchAtsBoard, isEarlyCareerTitle } from "../lib/ats-boards";
import { currentAtsExperienceConflict } from "../lib/ingestion/ats-eligibility";
import { jobIdentity } from "../lib/source-normalization";

test("a junior skill requirement cannot override a clear mandatory experience floor", () => {
  for (const description of [
    "<h3>Required Qualifications</h3><ul><li>5+ years of professional experience.</li><li>1+ years of experience with a particular library.</li></ul>",
    "What You Need\nMinimum 5 years of experience in compliance.\n1 year of experience with reporting.",
    "&lt;h4&gt;REQUIRED QUALIFICATIONS&amp;nbsp;&lt;/h4&gt;&lt;li&gt;4+ years of technical experience with at least 1–2 years of experience in automation.&lt;/li&gt;",
  ]) {
    assert.equal(hasRequiredExperienceConflict(description), true);
    assert.equal(isEarlyCareerTitle("Software Engineer", description), false);
  }
  assert.equal(isEarlyCareerTitle("Technical Product Manager", "There is no minimum years of experience requirement, but this is not an entry-level position."), false);
});

test("preferred experience, ranges and degree alternatives are not universal requirements", () => {
  for (const description of [
    "Requirements\n0-2 years of professional experience.\nPreferred Qualifications\n5+ years of experience with research.",
    "Requirements\n0-2 years of professional experience.\n5+ years of research experience preferred.",
    "Required Qualifications\nBachelor's degree OR 4 years of experience in IT.\n1 year of experience with tooling.",
    "Required Qualifications\n5 years of experience without a degree.\n1 year of experience in automation.",
    "Required Qualifications\n4 years of experience in lieu of a degree.\n1 year of experience in automation.",
    "Basic Qualifications\nBachelor's degree in a STEM discipline and 1+ years of software development experience; OR 4+ years of professional software development experience in C++.",
    "What we're looking for\n5+ years of experience in an R&D environment (PhD program counts).\n1+ years of experience with testing.",
    "Required Qualifications\n2-4 years of professional experience.\n1 year of experience with testing.",
    "We have been building products for 20 years.\n1 year of professional experience.",
  ]) assert.equal(hasRequiredExperienceConflict(description), false, description);
  assert.equal(isEarlyCareerTitle("Software Engineer", "Requirements\n0-2 years of experience.\nPreferred Qualifications\n5+ years of experience."), true);
  // This repair does not establish a universal experience ceiling for named
  // internship, graduate or junior roles, or infer that Engineer II is senior.
  assert.equal(isEarlyCareerTitle("Software Engineer I", "Required Qualifications\n5 years of experience."), true);
  assert.equal(isEarlyCareerTitle("Senior Engineer", "0-2 years of experience."), false);
  assert.equal(qualificationText("&lt;li&gt;0&amp;ndash;2 years&amp;nbsp;experience&lt;/li&gt;"), "0-2 years experience");
});

test("Lever structured qualifications restore generic-title discovery without admitting clear conflicts", async () => {
  const original = globalThis.fetch;
  const board = createAtsBoard({provider: "lever", key: "example", company: "Example"});
  const base = {categories: {location: "Boston, MA"}, descriptionPlain: "Build reliable software.", createdAt: Date.parse("2026-10-30T12:00:00Z")};
  globalThis.fetch = async () => Response.json([
    {...base, text: "Software Developer", applyUrl: "https://jobs.lever.co/example/11111111-1111-4111-8111-111111111111", lists: [{text: "Requirements", content: "<li>0-2 years of professional experience.</li>"}]},
    {...base, text: "Software Engineer", applyUrl: "https://jobs.lever.co/example/22222222-2222-4222-8222-222222222222", lists: [{text: "Required Qualifications", content: "<li>5+ years of engineering experience.</li><li>1+ years of experience with testing.</li>"}]},
    {...base, text: "Junior Developer", applyUrl: "https://jobs.lever.co/example/33333333-3333-4333-8333-333333333333", lists: [null, {content: 12}]},
  ]);
  try {
    const result = await fetchAtsBoard(board, new Date("2026-10-30T13:00:00Z"));
    assert.deepEqual(result.jobs.map(j => j.title), ["Software Developer", "Junior Developer"]);
    assert.equal(result.liveIdentities.size, 3); // Scope exclusion is not closure.
    const url = "https://jobs.lever.co/example/22222222-2222-4222-8222-222222222222/apply?utm_source=feed";
    const boards = new Map([[board.id, result]]);
    assert.equal(currentAtsExperienceConflict({company: "Example", applyUrl: url}, boards), true);
    assert.equal(currentAtsExperienceConflict({company: "Different Employer", applyUrl: url}, boards), false);
    assert.equal(currentAtsExperienceConflict({company: "Example", applyUrl: url.replace("/example/", "/another/")}, boards), false);
    assert.equal(currentAtsExperienceConflict({company: "Example", applyUrl: url}, new Map()), false);
    assert.match(result.jobs[0].rawText, /0-2 years/);
  } finally { globalThis.fetch = original; }
});

test("current qualification conflicts follow Greenhouse hostname aliases without crossing boards or requisitions", () => {
  const board = createAtsBoard({provider: "greenhouse", key: "example", company: "Example"});
  const url = "https://boards.greenhouse.io/example/jobs/1234567";
  const result = {board, jobs: [], liveIdentities: new Set([jobIdentity(url)!]), experienceConflictUrls: [url]};
  const boards = new Map([[board.id, result]]);
  const alias = "https://job-boards.greenhouse.io/example/jobs/1234567?gh_src=feed";
  assert.equal(currentAtsExperienceConflict({company: "Example", applyUrl: alias}, boards), true);
  assert.equal(currentAtsExperienceConflict({company: "Example", applyUrl: alias.replace("1234567", "7654321")}, boards), false);
  result.liveIdentities.clear();
  assert.equal(currentAtsExperienceConflict({company: "Example", applyUrl: alias}, boards), false);
});
