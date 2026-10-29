import assert from "node:assert/strict";
import test from "node:test";
import { assertSourcePermissions, permissionHeldSourceNames } from "../lib/ingestion/source-permissions";
import { loadCandidates } from "../lib/ingestion/load-candidates";
import type { JobSource } from "../lib/source-catalog";
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import companyTrust from "../data/company-trust.json";
import { evaluateCompanyQuality, type CompanyTrustEntry } from "../lib/company-quality";

const source: JobSource = {id: "test", name: "Test", kind: "markdown", repository: "owner/jobs", url: "https://raw.githubusercontent.com/owner/jobs/main/README.md", active: true, trustedCoverage: false};
const licensed = {repository: source.repository, status: "licensed", licenseUrl: "https://github.com/owner/jobs/blob/main/LICENSE"};

test("reviewed employer recovery cannot authorize intermediary or lookalike destinations", () => {
  const trust = companyTrust as CompanyTrustEntry[];
  const check = (name: string, applyUrl: string, title = "Software Engineer, New Grad") => evaluateCompanyQuality({name, applyUrl, title}, title, [], trust);
  assert.equal(check("Palantir", "https://jobs.lever.co/palantir/123").status, "approved");
  assert.equal(check("Palantir Technologies", "https://jobs.lever.co/palantir/123").requireLiveListing, true);
  assert.equal(check("Palantir", "https://jobs.lever.co/palantir-other/123").status, "quarantined");
  assert.equal(check("Palantir", "https://www.dreamworkhq.com/job/123").status, "quarantined");
  assert.equal(check("Palantir", "https://jobs.lever.co/palantir/123", "Senior Software Engineer").status, "quarantined");
});

test("active sources require an explicit reviewed license, even when trusted", () => {
  assert.throws(() => assertSourcePermissions([{...source, trustedCoverage: true}], []), /permission review required/);
  assert.throws(() => assertSourcePermissions([source], [{...licensed, status: "no_license_detected"}]), /permission review required/);
  assert.throws(() => assertSourcePermissions([source], [{...licensed, licenseUrl: "https://github.com/other/jobs/blob/main/LICENSE"}]), /permission review required/);
  assert.doesNotThrow(() => assertSourcePermissions([source], [licensed]));
  assert.doesNotThrow(() => assertSourcePermissions([{...source, active: false}], []));
  assert.ok(permissionHeldSourceNames([source], [{...licensed, status: "no_license_detected"}]).has(source.name));
  assert.ok(permissionHeldSourceNames([{...source, active: false}], []).has(source.name));
  assert.ok(permissionHeldSourceNames([source], [{...licensed, licenseUrl: null}]).has(source.name));
});

test("permission failures stop ingestion before any network access", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "empluzzed-permissions-"));
  const original = globalThis.fetch;
  let requests = 0;
  try {
    await mkdir(path.join(root, "data"));
    await writeFile(path.join(root, "data/source-licenses.json"), JSON.stringify({repositories: []}));
    globalThis.fetch = async () => { requests++; throw new Error("Unexpected request"); };
    await assert.rejects(loadCandidates(root, [source]), /permission review required/);
    assert.equal(requests, 0);
  } finally { globalThis.fetch = original; await rm(root, {recursive: true, force: true}); }
});

test("restricted discovery admits only explicit early-career direct ATS destinations without expanding boards", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "empluzzed-direct-source-"));
  const original = globalThis.fetch;
  const requests: string[] = [];
  try {
    await mkdir(path.join(root, "data"));
    await writeFile(path.join(root, "data/source-licenses.json"), JSON.stringify({repositories: [licensed]}));
    const feed = {...source, directEarlyCareerOnly: true, expandAtsBoards: false};
    const markdown = `| Company | Role | Location | Added | Apply |
| --- | --- | --- | --- | --- |
| Example | Software Engineer Intern | Chicago, IL | 1d | [Apply](https://boards.greenhouse.io/example/jobs/1234567) |
| Example | Senior Software Engineer | Chicago, IL | 1d | [Apply](https://boards.greenhouse.io/example/jobs/1234568) |
| Example | Software Engineer Intern | Chicago, IL | 1d | [Apply](https://aggregator.example/jobs/1) |
| Example | Software Engineer Intern | Chicago, IL | 1d | [Apply](https://jobs.ashbyhq.com.evil.example/example/1) |`;
    const mixedMarkdown = markdown + `
| Example | Junior Software Engineer | Chicago, IL | 1d | [Apply](https://boards.greenhouse.io/example/jobs/1234569) |`;
    globalThis.fetch = async input => {
      requests.push(String(input));
      assert.equal(String(input), source.url);
      return new Response(mixedMarkdown);
    };
    const result = await loadCandidates(root, [feed]);
    assert.equal(result.candidates.length, 2);
    assert.equal(result.candidates[0].applyUrl, "https://boards.greenhouse.io/example/jobs/1234567");
    assert.equal(result.candidates[0].category, "Internship");
    assert.equal(result.candidates[1].category, "New grad");
    assert.equal(result.candidates[1].term, "Not stated");
    assert.equal(result.boardRegistry.length, 0);
    assert.deepEqual(requests, [source.url]);
  } finally { globalThis.fetch = original; await rm(root, {recursive: true, force: true}); }
});
