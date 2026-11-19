import test from "node:test";
import assert from "node:assert/strict";
import trust from "../data/company-trust.json";
import { evaluateCompanyQuality, normalizeCompanyDisplayName, type CompanyTrustEntry } from "../lib/company-quality";
import { buildVerificationBacklog } from "../lib/ingestion/verification-backlog";
import { createScreeningTracker } from "../lib/ingestion/screening";
import type { CandidateJob } from "../lib/source-normalization";

test("reviewed Allegion identity stays restricted to exact career destinations and live early-career vacancies",()=>{
  const applyUrl="https://allegion.wd5.myworkdayjobs.com/careers/job/Golden-CO/Summer-Intern_JR37472-1";
  const decide=(title:string,url=applyUrl)=>evaluateCompanyQuality({name:"Allegion",title,applyUrl:url},"",[],trust as CompanyTrustEntry[]);
  assert.equal(decide("Software Engineering Intern").status,"approved");
  assert.equal(decide("Software Engineering Intern").requireLiveListing,true);
  assert.equal(decide("Software Engineer").status,"quarantined");
  for(const url of [applyUrl.replace('careers/job/','Other/job/'),applyUrl.replace('allegion.wd5','other.wd5'),applyUrl.replace('https:','http:')])
    assert.equal(decide("Software Engineering Intern",url).status,"quarantined");
});

test("Sony internship board display correction is scoped to the reviewed board and does not change job IDs", () => {
  const url="https://job-boards.greenhouse.io/usinternshipspubliccareerssite/jobs/6221769004";
  const raw="US Internships Public Careers S…";
  assert.equal(normalizeCompanyDisplayName(raw,url),"PlayStation (Sony Interactive Entertainment)");
  for(const bad of ["https://job-boards.greenhouse.io/other/jobs/1","https://evil.example/usinternshipspubliccareerssite/jobs/1",
    "https://user:pass@job-boards.greenhouse.io/usinternshipspubliccareerssite/jobs/1","http://job-boards.greenhouse.io/usinternshipspubliccareerssite/jobs/1"]) assert.equal(normalizeCompanyDisplayName(raw,bad),raw);
  assert.equal(evaluateCompanyQuality({name:raw,title:"Intern",applyUrl:url},"",[],[]).status,"quarantined");
});

test("verification backlog counts opportunities once, with acceptance and terminal exclusions winning", () => {
  const tracker=createScreeningTracker();
  const url="https://example.com/jobs/1", accepted="https://example.com/jobs/2", closed="https://example.com/jobs/3";
  for(const value of [url,accepted,closed]) tracker.record(value,"pendingVerification");
  tracker.record(closed,"closed");
  const candidates=[url,url,accepted,closed].map((applyUrl,i)=>({applyUrl,company:"Acme",source:String(i)}) as CandidateJob);
  const result=buildVerificationBacklog({candidates,acceptedUrls:[accepted],outcomeFor:tracker.opportunityOutcomeFor});
  assert.equal(result.total,1);
  assert.deepEqual(result.byEmployer,[{company:"Acme",opportunities:1}]);
});

test("reviewed Martin Marietta employer approval requires early career and the exact official application site", () => {
  const registry=trust as CompanyTrustEntry[];
  const url="https://martinmarietta.wd5.myworkdayjobs.com/Martin_Marietta_Careers/job/Raleigh-NC/Intern_JR024144";
  const evaluate=(applyUrl=url,title="Data Scientist Intern",text="")=>evaluateCompanyQuality({name:"Martin Marietta",applyUrl,title},text,[],registry);
  assert.equal(evaluate().status,"approved");
  assert.equal(evaluate().requireLiveListing,true);
  for(const bad of [url.replace('Martin_Marietta_Careers','OtherSite'),url.replace('martinmarietta.wd5','fake.wd5'),
    url.replace('https:','http:'),'https://aggregator.example/job/1']) assert.equal(evaluate(bad).status,"quarantined");
  assert.equal(evaluate(url,"Senior Data Scientist").status,"quarantined");
  assert.equal(evaluate(url,"Data Scientist Intern","This position is unpaid.").status,"rejected");
});
