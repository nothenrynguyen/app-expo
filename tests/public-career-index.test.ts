import test from "node:test";
import assert from "node:assert/strict";
import { enrichPublicCareerIndex, parsePublicIndexPosting, publicIndexEvidenceAt, publicIndexReference, type PublicIndexState } from "../lib/ingestion/public-career-index";
import type { CandidateJob } from "../lib/source-normalization";
import { sourceReviewHoldIdentity } from "../lib/ingestion/source-review-holds";
const now=new Date("2026-11-19T07:00:00Z");
const row={company:"GlobalFoundries",title:"Source title",location:"Source location",applyUrl:"https://globalfoundries.wd1.myworkdayjobs.com/External/job/Texas/AI-Software-Intern_JR-2604029",source:"Licensed feed",category:"New grad",term:"2027",workMode:"unknown",postedAt:now.toISOString(),postedAtSource:"first_seen",salary:null,rawText:"Source text"} as CandidateJob;
const position={id:563980770505766,reqid:"JR-2604029",title:"AI Software Intern (Summer 2027)"};
const detail=()=>({status:200,metadata:null,data:{id:position.id,displayJobId:position.reqid,atsJobId:position.reqid,name:position.title,
  publicUrl:`https://careers.gf.com/careers/job/${position.id}`,locations:["Richardson, Texas, United States of America"],postedTs:1792540800,
  jobDescription:"<h3>Responsibilities</h3><p>Develop software applications and machine learning systems. Collaborate with software engineers to design and test artificial intelligence algorithms and improve software engineering tools.</p><h3>Required Qualifications</h3><p>Currently pursuing a bachelor's degree in computer science. Programming experience in Python.</p>"}});
const search=()=>({status:200,data:{count:1,positions:[{id:position.id,displayJobId:position.reqid,atsJobId:position.reqid,name:position.title,positionUrl:`/careers/job/${position.id}`}]}});
const fetcher=(async(url:unknown)=>new Response(JSON.stringify(String(url).includes('position_details')?detail():search()))) as typeof fetch;
const empty=():PublicIndexState=>({postings:{}});

test("public employer index maps only the reviewed employer and career site",()=>{
  assert.ok(publicIndexReference(row));
  for(const applyUrl of [row.applyUrl.replace('/External/','/Other/'),row.applyUrl.replace('globalfoundries.wd1','other.wd1'),row.applyUrl.replace('https:','http:'),row.applyUrl.replace('https://','https://user:pass@')])assert.equal(publicIndexReference({...row,applyUrl}),null);
  assert.equal(publicIndexReference({...row,company:"Other"}),null);
});

test("public employer details require exact public identity, current results and eligible qualifications",()=>{
  assert.equal(parsePublicIndexPosting(position,detail(),now)?.category,"Internship");
  for(const change of [{id:12},{atsJobId:"JR-1"},{publicUrl:"https://evil.example/job"},{locations:[]},{postedTs:now.getTime()/1000+1},
    {jobDescription:detail().data.jobDescription+'<p>Requires at least 7 years of professional software engineering experience.</p>'}])
    assert.equal(parsePublicIndexPosting(position,{...detail(),data:{...detail().data,...change}},now),null);
  assert.equal(parsePublicIndexPosting(position,{...detail(),metadata:{isFallback:true}},now),null);
});

test("one shared index enriches candidates with dated evidence and cached runs make no requests",async()=>{
  const first=await enrichPublicCareerIndex([row,row],empty(),now,fetcher);
  assert.equal(first.requests,3);assert.equal(first.verified,1);assert.equal(first.candidates[0].title,position.title);
  assert.equal(first.candidates[0].applyUrl,row.applyUrl);assert.equal(first.candidates[0].postedAtSource,"date_only");
  assert.equal(publicIndexEvidenceAt(first.candidates[0]),now.toISOString());
  const cached=await enrichPublicCareerIndex([row],first.state,new Date(now.getTime()+3600000),fetcher);
  assert.equal(cached.requests,0);assert.equal(cached.reused,1);assert.equal(publicIndexEvidenceAt(cached.candidates[0]),now.toISOString());
});

test("failed or incomplete indexes invalidate positives without claiming closure",async()=>{
  const first=await enrichPublicCareerIndex([row],empty(),now,fetcher);
  for(const response of [new Response('',{status:429}),new Response(JSON.stringify({status:200,data:{count:3,positions:[]}})),
    new Response(JSON.stringify({...search(),metadata:{isFallback:true}}))]){
    const later=await enrichPublicCareerIndex([row],first.state,new Date(now.getTime()+7*3600000),(async()=>response.clone()) as typeof fetch);
    assert.equal(publicIndexEvidenceAt(later.candidates[0]),undefined);assert.equal(later.observations[0].status,"unknown");
  }
});

test("holds, source closures and hard budgets cannot create positive evidence",async()=>{
  const hold=new Set([sourceReviewHoldIdentity(row.applyUrl)!]);
  for(const [rows,holds]of [[[row],hold],[[{...row,sourceActive:false}],new Set<string>()]] as const){
    const result=await enrichPublicCareerIndex([...rows],empty(),now,fetcher,holds);
    assert.equal(result.requests,0);assert.equal(result.verified,0);
  }
  const capped=await enrichPublicCareerIndex([row],empty(),now,fetcher,new Set(),2);
  assert.equal(capped.requests,0);assert.equal(capped.verified,0);
});

test("unknown details wait an hour and a failed due detail invalidates earlier evidence",async()=>{
  const fail=(async(url:unknown)=>String(url).includes('position_details')?new Response('',{status:503}):new Response(JSON.stringify(search()))) as typeof fetch;
  const unknown=await enrichPublicCareerIndex([row],empty(),now,fail);
  const waiting=await enrichPublicCareerIndex([row],unknown.state,new Date(now.getTime()+60000),fail);
  assert.equal(waiting.requests,0);
  const live=await enrichPublicCareerIndex([row],empty(),now,fetcher);
  const later=await enrichPublicCareerIndex([row],live.state,new Date(now.getTime()+13*3600000),fail);
  assert.equal(publicIndexEvidenceAt(later.candidates[0]),undefined);
});
