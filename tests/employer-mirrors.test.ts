import test from "node:test";
import assert from "node:assert/strict";
import { enrichEmployerMirrors, mirrorEvidenceAt, mirrorReference, parseMirrorPosting } from "../lib/ingestion/employer-mirrors";
import { opportunityIdentity, type CandidateJob } from "../lib/source-normalization";
import { sourceReviewHoldIdentity } from "../lib/ingestion/source-review-holds";

const now = new Date("2026-11-19T02:00:00Z"), guid = "BC252E0D321E4B72971A8B9DEECE3B07";
const url = "https://hntb.wd5.myworkdayjobs.com/en-US/HNTB_University_Careers/job/White-Plains-NY/Intern-Engineer_R-32291";
const row = { company: "HNTB", title: "Intern Engineer", applyUrl: url, location: "Source location", rawText: "Intern Engineer",
  category: "Internship", term: "Summer 2027", workMode: "unknown", postedAt: "2026-11-03T00:00:00Z", postedAtSource: "date_only",
  source: "Reviewed licensed feed", salary: null } as CandidateJob;
const data = { guid, reqid: "R-32291", buid: 48236, company_exact: "HNTB", company_canonical_microsite: "https://hntb.jobs/",
  title_exact: "Intern Engineer - Summer 2027", location: "White Plains, NY", country_short_exact: "USA",
  html_description: "<p>Assist civil engineering teams in basic design tasks, transportation planning and engineering calculations for infrastructure projects.</p><h3>What You'll Need</h3><p>Current enrollment in an accredited post-secondary engineering program.</p>",
  link: `https://de.jobsyn.org/${guid}10` };
const target = url.replace('/en-US/', '/').concat('/apply?source=');
function fixtures(detail = data, redirect = target, calls: string[] = []) {
  return (async (input: unknown) => {
    const u = String(input); calls.push(u);
    if (u.includes('/solr/search')) return Response.json({ jobs: [{ guid, reqid: data.reqid, company_exact: "HNTB", buid: 48236 }] });
    if (u.includes('/hntb-jobs/data/')) return Response.json(detail);
    if (u === data.link) return new Response(null, { status: 301, headers: { location: redirect } });
    throw new Error(`Unexpected request: ${u}`);
  }) as typeof fetch;
}

test("mirror scope is restricted to the reviewed employer and both exact Workday sites", () => {
  assert.equal(mirrorReference(row)?.reqid, "R-32291");
  for (const applyUrl of [url.replace('https:', 'http:'), url.replace('hntb.wd5', 'other.wd5'), url.replace('HNTB_University_Careers', 'Other'), url.replace('https://', 'https://user:pass@'), url.replace('.com/', '.com:444/')])
    assert.equal(mirrorReference({ ...row, applyUrl }), null);
  assert.equal(mirrorReference({ ...row, company: "Another employer" }), null);
});

test("current mirror metadata requires the same exact requisition, employer, country and Apply destination", () => {
  assert.equal(parseMirrorPosting(row, data, guid, target)?.title, data.title_exact);
  for (const change of [{ reqid: "R-99999" }, { guid: '0'.repeat(32) }, { buid: 1 }, { company_exact: "Other" },
    { country_short_exact: "CAN" }, { deleted_at: null }, { company_canonical_microsite: "https://evil.example/" },
    { title_exact: "Senior Engineer" }, { html_description: "<p>Minimum qualifications: At least 7 years of engineering experience required.</p>" },
    { html_description: `${data.html_description}<p>This position is unpaid.</p>` }])
    assert.equal(parseMirrorPosting(row, { ...data, ...change }, guid, target), null);
  for (const bad of [target.replace('R-32291', 'R-99999'), target.replace('University_', ''), 'https://evil.example/apply'])
    assert.equal(parseMirrorPosting(row, data, guid, bad), null);
});

test("three bounded public requests establish current evidence without a Workday request or date reset", async () => {
  const calls: string[] = [], result = await enrichEmployerMirrors([row], {}, now, fixtures(data, target, calls));
  assert.equal(result.requests, 3); assert.equal(result.verified, 1);
  assert.ok(calls.every(u => !u.includes('myworkdayjobs.com')));
  const candidate = result.candidates[0];
  assert.equal(candidate.applyUrl, row.applyUrl); assert.equal(candidate.postedAt, row.postedAt);
  assert.equal(candidate.postedAtSource, row.postedAtSource); assert.equal(candidate.source, row.source);
  assert.equal(mirrorEvidenceAt(candidate), now.toISOString());
  assert.ok(!candidate.rawText.includes('Current enrollment')); // No stored employer descriptions.
  const later = await enrichEmployerMirrors([row], result.state, new Date(now.getTime() + 3600_000), fixtures());
  assert.equal(later.requests, 0); assert.equal(later.reused, 1);
  assert.equal(mirrorEvidenceAt(later.candidates[0]), now.toISOString());
});

test("source holds and inactive rows cannot gain mirror evidence", async () => {
  const holds = new Set([sourceReviewHoldIdentity(url)!]);
  const blocked = (async () => { throw new Error('Should never request'); }) as typeof fetch;
  assert.equal((await enrichEmployerMirrors([row], {}, now, blocked, holds)).requests, 0);
  assert.equal((await enrichEmployerMirrors([{ ...row, sourceActive: false }], {}, now, blocked)).requests, 0);
});

test("expired positives are invalidated on failed rechecks and hard-expire without new timestamps", async () => {
  const first = await enrichEmployerMirrors([row], {}, now, fixtures());
  const at = new Date(now.getTime() + 12 * 3600_000);
  const failed = await enrichEmployerMirrors([row], first.state, at, (async () => new Response('', { status: 503 })) as typeof fetch);
  assert.equal(failed.requests, 1); assert.equal(failed.state[opportunityIdentity(url)!].posting, undefined);
  assert.equal(mirrorEvidenceAt(failed.candidates[0]), undefined); assert.equal(failed.observations[0].status, 'unknown');
  const expired = await enrichEmployerMirrors([row], first.state, new Date(now.getTime() + 24 * 3600_000), fixtures(), new Set(), 0);
  assert.equal(mirrorEvidenceAt(expired.candidates[0]), undefined);
});

test("missing, withdrawn, ambiguous and redirected-away mirror records remain inconclusive", async () => {
  const withdrawn = await enrichEmployerMirrors([row], {}, now, fixtures({ ...data, deleted_at: now.toISOString() } as typeof data));
  assert.equal(withdrawn.verified, 0); assert.equal(withdrawn.observations[0].status, 'unknown');
  const missing = await enrichEmployerMirrors([row], {}, now, (async () => Response.json({ jobs: [] })) as typeof fetch);
  assert.equal(missing.requests, 1); assert.equal(missing.verified, 0);
  const ambiguous = await enrichEmployerMirrors([row], {}, now, (async () => Response.json({ jobs: [
    { guid, reqid: data.reqid, company_exact: "HNTB", buid: 48236 },
    { guid: '0'.repeat(32), reqid: data.reqid, company_exact: "HNTB", buid: 48236 },
  ] })) as typeof fetch);
  assert.equal(ambiguous.requests, 1); assert.equal(ambiguous.verified, 0);
  const unsafe = await enrichEmployerMirrors([row], {}, now, fixtures(data, 'https://127.0.0.1/private'));
  assert.equal(unsafe.requests, 3); assert.equal(unsafe.verified, 0);
});

test("the lane cannot exceed ten jobs or thirty requests and rotates to unchecked requisitions", async () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({ ...row, applyUrl: url.replace('R-32291', `R-${40000 + i}`) }));
  const fake = (async (input: unknown) => {
    const u = String(input);
    if (u.includes('/search')) {
      const reqid = new URL(u).searchParams.get('q')!;
      return Response.json({ jobs: [{ guid: reqid.slice(2).padStart(32, '0'), reqid, company_exact: 'HNTB', buid: 48236 }] });
    }
    const id = u.match(/([A-F0-9]{32})/)?.[1];
    if (!id) throw new Error('Unexpected detail request');
    const reqid = `R-${Number(id)}`;
    if (u.includes('/data/')) return Response.json({ ...data, guid: id, reqid, link: `https://de.jobsyn.org/${id}10` });
    return new Response(null, { status: 301, headers: { location: target.replace('R-32291', reqid) } });
  }) as typeof fetch;
  const first = await enrichEmployerMirrors(rows, {}, now, fake, new Set(), 100);
  assert.equal(first.attempted, 10); assert.equal(first.requests, 30); assert.equal(first.verified, 10);
  const second = await enrichEmployerMirrors(rows, first.state, new Date(now.getTime() + 60_000), fake);
  assert.equal(second.attempted, 10); assert.equal(Object.keys(second.state).length, 20);
});
