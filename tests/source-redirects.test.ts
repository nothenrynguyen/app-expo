import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveSourceRedirects,applyVerifiedRedirects,originalPostingLink} from '../lib/ingestion/source-redirects';
import {discoverAtsBoard,type AtsBoardResult} from '../lib/ats-boards';
import {jobIdentity,type CandidateJob} from '../lib/source-normalization';
import {sourceReviewHoldIdentity} from '../lib/ingestion/source-review-holds';
const now=new Date('2026-11-19T07:00:00Z'),source='Licensed Vansh feed',allowed=new Set([source]);
const row={company:'Acme',title:'Software Engineering Intern',applyUrl:'https://go.vansh.nyc/ABC?s=A',source,rawText:'Unverified source text',category:'Internship'} as CandidateJob;
const target='https://job-boards.greenhouse.io/acme/jobs/1234567';
const redirect=(location=target,status=302)=>(async()=>new Response(null,{status,headers:{location}})) as typeof fetch;

test('short-link resolution grants discovery only; exact eligible employer data is required',async()=>{
  const resolved=await resolveSourceRedirects([row],{},allowed,now,redirect());
  assert.equal(resolved.requests,1);assert.equal(resolved.discovered[0].applyUrl,target);
  assert.equal(applyVerifiedRedirects([row],resolved.targets,new Map()).candidates[0].applyUrl,row.applyUrl);
  const board=discoverAtsBoard(target,'Acme','Direct ATS')!;
  const posting={...row,applyUrl:target,title:'Employer Software Engineer Intern',rawText:'Employer qualifications',source:'Direct ATS'};
  const boards=new Map([[board.id,{board,jobs:[posting],liveIdentities:new Set([jobIdentity(target)!])} as AtsBoardResult]]);
  const applied=applyVerifiedRedirects([row],resolved.targets,boards);
  assert.equal(applied.enriched,1);assert.equal(applied.candidates[0].title,posting.title);
  assert.equal(applied.candidates[0].rawText,posting.rawText);assert.equal(applied.candidates[0].source,source);
});

test('redirects never follow Workday, unreviewed services, credentials or private addresses',async()=>{
  for(const destination of ['https://acme.wd1.myworkdayjobs.com/External/job/A/Intern_JR-1','https://jobright.ai/job/1','http://127.0.0.1/',
    'https://user:pass@job-boards.greenhouse.io/acme/jobs/1234567','https://job-boards.greenhouse.io.evil.example/acme/jobs/1234567']){
    const r=await resolveSourceRedirects([row],{},allowed,now,redirect(destination));
    assert.equal(r.requests,1);assert.equal(r.targets.size,0);
  }
});

test('source permission, source closures, published IDs and holds constrain resolution',async()=>{
  for(const [rows,names,holds,published]of [
    [[row],new Set<string>(),new Set<string>(),new Set<string>()],
    [[{...row,sourceActive:false}],allowed,new Set<string>(),new Set<string>()],
    [[row],allowed,new Set([sourceReviewHoldIdentity(row.applyUrl)!]),new Set<string>()],
    [[row],allowed,new Set<string>(),new Set([jobIdentity(row.applyUrl)!])],
  ] as const){const r=await resolveSourceRedirects([...rows],{},names,now,redirect(),holds,published);assert.equal(r.requests,0);}
  const targetHold=await resolveSourceRedirects([row],{},allowed,now,redirect(),new Set([sourceReviewHoldIdentity(target)!]));
  assert.equal(targetHold.targets.size,0);
});

test('mapping reuse makes no requests; failed rechecks clear mappings and rate limits stop the batch',async()=>{
  const first=await resolveSourceRedirects([row],{},allowed,now,redirect());
  const cached=await resolveSourceRedirects([row],first.state,allowed,new Date(now.getTime()+3600000),redirect());
  assert.equal(cached.requests,0);assert.equal(cached.targets.size,1);
  const failed=await resolveSourceRedirects([row],first.state,allowed,new Date(now.getTime()+8*86400000),redirect(target,503));
  assert.equal(failed.targets.size,0);
  const rows=Array.from({length:10},(_,i)=>({...row,applyUrl:'https://go.vansh.nyc/A'+i}));
  const limited=await resolveSourceRedirects(rows,{},allowed,now,redirect(target,429),new Set(),new Set(),5);
  assert.ok(limited.requests<=2);assert.equal(limited.targets.size,0);
  const capped=await resolveSourceRedirects(rows,{},allowed,now,redirect(),new Set(),new Set(),3);
  assert.equal(capped.requests,3);
});

test('licensed Dreamwork pages expose only an unambiguous visible original-posting link',async()=>{
  const html=`<h1>Software Engineering Intern</h1><a class="job-original-link" href="${target}">View original posting</a>`;
  assert.equal(originalPostingLink(html),target);
  assert.equal(originalPostingLink(`<div hidden>${html}</div>`),null);
  assert.equal(originalPostingLink(html+`<a class="job-original-link" href="https://evil.example">View original posting</a>`),null);
  assert.equal(originalPostingLink(html+'<p>This job is no longer available</p>'),null);
  const dream={...row,source:'Licensed Dreamwork feed',applyUrl:'https://www.dreamworkhq.com/job/e4750740-bbd4-498b-9bef-85a5126fbef8'};
  const f=(async()=>new Response(html)) as typeof fetch;
  const denied=await resolveSourceRedirects([dream],{},allowed,now,f);
  assert.equal(denied.requests,0);
  const result=await resolveSourceRedirects([dream],{},allowed,now,f,new Set(),new Set(),100,new Set([dream.source]));
  assert.equal(result.requests,1);assert.equal(result.targets.size,1);
});

test('the shared discovery budget balances source types without fetching destinations',async()=>{
  const dream={...row,source:'Licensed Dreamwork feed',applyUrl:'https://www.dreamworkhq.com/job/e4750740-bbd4-498b-9bef-85a5126fbef8'};
  const calls:string[]=[];
  const f=(async(value:unknown)=>{const url=String(value);calls.push(url);return url.includes('dreamworkhq.com')
    ?new Response(`<a class="job-original-link" href="${target}">View original posting</a>`):new Response(null,{status:302,headers:{location:target}});}) as typeof fetch;
  const result=await resolveSourceRedirects([row,{...row,applyUrl:'https://go.vansh.nyc/DEF'},dream],{},allowed,now,f,new Set(),new Set(),2,new Set([dream.source]));
  assert.equal(result.requests,2);assert.ok(calls.some(url=>url.includes('dreamworkhq.com')));
  assert.ok(calls.every(url=>!url.includes('greenhouse.io')));
});
