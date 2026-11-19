import test from "node:test";
import assert from "node:assert/strict";
import { parseCyberSource } from "../lib/ingestion/cyber-source";

const now = new Date("2026-11-19T07:00:00Z");
const row = { company: "Example", role: "Security Intern", location: "Boston, MA", type: "intern",
  url: "https://job-boards.greenhouse.io/example/jobs/1234567", date_added: "2026-11-18" };
const parse = (rows: unknown[]) => parseCyberSource(JSON.stringify({rows}), "Cyber pilot", now);

test("cyber discovery keeps first-seen provenance and uses title eligibility", () => {
  const [job] = parse([{...row, type: "earlycareer", remote: true}]);
  assert.equal(job.postedAtSource, "first_seen");
  assert.equal(job.category, "Internship");
  assert.equal(job.workMode, "remote");
  assert.equal(parse([{...row, role: "Senior Security Engineer"}, {...row, role: "Security Engineer"}]).length, 0);
});

test("cyber discovery excludes closures and unsupported application routes", () => {
  assert.equal(parse([{...row, closed: true}, {...row, closed_date: "2026-11-18"},
    {...row, url: "https://example.com/careers?gh_jid=1234567"}, {...row, url: "https://user:pass@jobs.lever.co/example/123"},
    {...row, url: "invalid"}, {...row, url: "https://job-boards.greenhouse.io/example"},
    {...row, url: "http://job-boards.greenhouse.io/example/jobs/1234567"}]).length, 0);
});

test("cyber discovery rejects invalid structure and dates without refreshing old rows", () => {
  assert.throws(() => parseCyberSource('{"jobs":[]}', "Cyber pilot", now));
  assert.equal(parse([null, {}, {...row, date_added: "2026-02-30"}, {...row, date_added: "2026-11-20"}]).length, 0);
  assert.equal(parse([{...row, date_added: "2026-09-01"}])[0].postedAt, "2026-09-01T00:00:00.000Z");
});
