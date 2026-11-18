import test from "node:test";
import assert from "node:assert/strict";
import { careerPageEvidenceAt, enrichReviewedCareerPages, officialCareerReference, parseOfficialCareerPage } from "../lib/ingestion/reviewed-career-pages";
import type { CandidateJob } from "../lib/source-normalization";

const now=new Date("2026-11-18T10:00:00Z"),id="7663042453461600517",official=`https://lifeattiktok.com/search/${id}`;
const row={company:"TikTok",title:"Source title",location:"Incorrect source location",applyUrl:"https://go.vansh.nyc/15K?s=A",source:"Reviewed licensed source",
  category:"New grad",rawText:"Source metadata",term:"2027",postedAt:now.toISOString(),postedAtSource:"first_seen",workMode:"unknown",salary:null} as CandidateJob;
const page=(title="Backend Software Engineer Graduate - 2027 Start",qualifications="Minimum Qualifications:\nIndividuals completing a Bachelor's degree in computer science. Programming experience in Python.",applyId=id)=>`<html><head><title>${title}</title></head><body><h2>${title}</h2><div><p>Location:</p><p>Seattle</p></div><a href="https://careers.tiktok.com/resume/${applyId}/apply">Apply to this job</a><section><p>Responsibilities</p><p>Build and maintain reliable software systems for our users. Collaborate with engineers to improve platform architecture and application performance.</p></section><section><p>Qualifications</p><p>${qualifications}</p></section></body></html>`;

test("official career evidence requires exact job application ID, body, identity and early-career qualifications",()=>{
  assert.equal(parseOfficialCareerPage(official,page())?.location,"Seattle");
  assert.equal(parseOfficialCareerPage(official,page(undefined,undefined,"9999999999999999999")),null);
  assert.equal(parseOfficialCareerPage(official,"<title>Jobs</title><h2>Jobs</h2>Apply now"),null);
  assert.equal(parseOfficialCareerPage(official,page("Senior Software Engineer")),null);
  assert.equal(parseOfficialCareerPage(official,page().replace('<h2>','<p>This job is no longer available</p><h2>')),null);
  assert.equal(parseOfficialCareerPage(official,page(undefined,"Minimum Qualifications:\nAt least 7 years of professional software engineering experience is required.")),null);
  assert.equal(officialCareerReference("https://evil.example/search/"+id),null);
  assert.equal(officialCareerReference("https://user:pass@lifeattiktok.com/search/"+id),null);
  assert.equal(officialCareerReference("http://lifeattiktok.com/search/"+id),null);
});

test("a reviewed redirect is replaced by current employer fields and evidence keeps its actual timestamp",async()=>{
  const calls:string[]=[];
  const fetcher=(async(u:unknown)=>{calls.push(String(u));return String(u).includes('go.vansh')?new Response(null,{status:302,headers:{location:official}}):new Response(page());}) as typeof fetch;
  const first=await enrichReviewedCareerPages([row],{},now,fetcher);
  assert.equal(first.requests,2);assert.equal(first.candidates[0].applyUrl,official);
  assert.equal(first.candidates[0].title,"Backend Software Engineer Graduate - 2027 Start");
  assert.equal(careerPageEvidenceAt(first.candidates[0]),now.toISOString());
  const later=await enrichReviewedCareerPages([row],first.state,new Date(now.getTime()+3600000),fetcher);
  assert.equal(later.requests,0);assert.equal(calls.length,2);
  assert.equal(careerPageEvidenceAt(later.candidates[0]),now.toISOString());
});

test("bad redirects, brand mismatches, source holds and source closures never gain evidence",async()=>{
  for(const location of ['http://lifeattiktok.com/search/'+id,'https://127.0.0.1/private','https://joinbytedance.com/search/'+id]){
    let calls=0;const f=(async()=>{calls++;return new Response(null,{status:302,headers:{location}});}) as typeof fetch;
    const result=await enrichReviewedCareerPages([row],{},now,f);assert.equal(calls,1);assert.equal(careerPageEvidenceAt(result.candidates[0]),undefined);
  }
  const f=(async()=>{throw new Error('Must not request held rows');}) as typeof fetch;
  const held=await enrichReviewedCareerPages([row],{},now,f,new Set([row.applyUrl.toLowerCase()]));
  assert.equal(held.requests,0);
  const closed=await enrichReviewedCareerPages([{...row,sourceActive:false}],{},now,f);
  assert.equal(closed.requests,0);
});

test("expired observations recheck, and a failed recheck invalidates old positive evidence",async()=>{
  const first=await enrichReviewedCareerPages([{...row,applyUrl:official}],{},now,(async()=>new Response(page())) as typeof fetch);
  const later=await enrichReviewedCareerPages([{...row,applyUrl:official}],first.state,new Date(now.getTime()+12*3600000),(async()=>new Response('',{status:404})) as typeof fetch);
  assert.equal(later.requests,1);assert.equal(later.state[official].posting,undefined);
  assert.equal(careerPageEvidenceAt(later.candidates[0]),undefined);
});

test("official failures distinguish closures from outages without retaining stale positives",async()=>{
  for(const [status,expected] of [[404,"closed"],[410,"closed"],[429,"unknown"],[503,"unknown"]] as const){
    const result=await enrichReviewedCareerPages([{...row,applyUrl:official}],{},now,(async()=>new Response('',{status})) as typeof fetch);
    assert.deepEqual(result.observations,[{url:official,checkedAt:now.toISOString(),httpStatus:status,status:expected}]);
    assert.equal(careerPageEvidenceAt(result.candidates[0]),undefined);
  }
  const result=await enrichReviewedCareerPages([{...row,applyUrl:official}],{},now,(async()=>{throw new Error('timeout');}) as typeof fetch);
  assert.equal(result.observations[0].status,"unknown");assert.equal(result.observations[0].httpStatus,null);
  const closed=await enrichReviewedCareerPages([{...row,applyUrl:official}],{},now,(async()=>new Response(page().replace('<h2>','<p>This job is no longer available</p><h2>'))) as typeof fetch);
  assert.equal(closed.observations[0].status,"closed");assert.equal(closed.observations[0].httpStatus,200);
});

test("hidden streaming fragments cannot establish a visible employer posting",()=>{
  const hidden=page().replace('<h2>','<div hidden><h2>').replace('</body>','</div></body>');
  assert.equal(parseOfficialCareerPage(official,hidden),null);
});

test("both brands receive checks and positive evidence renews before its hard expiry",async()=>{
  const rows=[...Array.from({length:30},(_,i)=>({...row,applyUrl:`https://go.vansh.nyc/A${i}`})),{...row,company:"ByteDance",applyUrl:"https://go.vansh.nyc/Z"}];
  const first=await enrichReviewedCareerPages(rows,{},now,(async()=>new Response('',{status:503})) as typeof fetch);
  assert.ok(first.state['https://go.vansh.nyc/Z']);
  const positive=await enrichReviewedCareerPages([{...row,applyUrl:official}],{},now,(async()=>new Response(page())) as typeof fetch);
  const waiting=await enrichReviewedCareerPages([{...row,applyUrl:official}],positive.state,new Date(now.getTime()+13*3600000),fetch,new Set(),0);
  assert.equal(careerPageEvidenceAt(waiting.candidates[0]),now.toISOString());
  const expired=await enrichReviewedCareerPages([{...row,applyUrl:official}],positive.state,new Date(now.getTime()+24*3600000),fetch,new Set(),0);
  assert.equal(careerPageEvidenceAt(expired.candidates[0]),undefined);
});

test("the lane checks at most 25 jobs with two requests each and rotates toward never-checked rows",async()=>{
  const rows=Array.from({length:40},(_,i)=>({...row,applyUrl:`https://go.vansh.nyc/A${i}`}));
  const f=(async(u:unknown)=>String(u).includes('go.vansh')?new Response(null,{status:302,headers:{location:official}}):new Response(page())) as typeof fetch;
  const first=await enrichReviewedCareerPages(rows,{},now,f);
  assert.equal(first.attempted,25);assert.equal(first.requests,50);
  const second=await enrichReviewedCareerPages(rows,first.state,new Date(now.getTime()+60000),f);
  assert.equal(second.attempted,15);assert.equal(second.requests,30);
});
