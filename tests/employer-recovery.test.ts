import assert from 'node:assert/strict';
import test from 'node:test';
import {admitWithCurrentEmployerEvidence, continuityMatcher} from '../lib/ingestion/employer-continuity';
import {loadEmployerRecovery, parseRecoveryPosting, recoveryEvidenceAt} from '../lib/ingestion/employer-recovery';
import {classifyRoleTags} from '../lib/role-areas';
import {jobIdentity, opportunityIdentity} from '../lib/source-normalization';
import {currentWorkdayEvidence} from '../lib/ingestion/workday-continuity';
import type {PublicJob} from '../lib/jobs';
const now=new Date('2026-10-29T12:00:00Z');
const seed={company:'Example',url:'https://example.wd1.myworkdayjobs.com/Careers/job/Boston/Engineering-Intern_JR123'};
const payload={jobPostingInfo:{title:'Engineering Intern',jobReqId:'JR123',posted:true,canApply:true,location:'Boston, Massachusetts',country:{descriptor:'United States of America'},jobDescription:'Mechanical engineering internship.',startDate:'2026-10-28',timeType:'Full time'}};
test('historical admission is bound to the employer name and exact hiring board',()=>{const match=continuityMatcher({version:1,baselineCommit:'old',reviewedAt:now.toISOString(),employers:[{company:'Example',board:'workday:example.wd1.myworkdayjobs.com:careers'}]});assert.equal(match({company:'Example',applyUrl:seed.url}),true);assert.equal(match({company:'Other',applyUrl:seed.url}),false);assert.equal(match({company:'Example',applyUrl:seed.url.replace('/Careers/','/Other/')}),false);});
test('recovery requires live flags and matching requisition, discards employer descriptions',()=>{const job=parseRecoveryPosting(seed,payload,now);assert.ok(job);assert.equal(job.applyUrl,seed.url);assert.ok(!job.rawText.includes('Mechanical engineering internship.'));assert.equal(parseRecoveryPosting(seed,{jobPostingInfo:{...payload.jobPostingInfo,canApply:false}},now),null);assert.equal(parseRecoveryPosting(seed,{jobPostingInfo:{...payload.jobPostingInfo,jobReqId:'JR999'}},now),null);assert.equal(parseRecoveryPosting(seed,{jobPostingInfo:{...payload.jobPostingInfo,jobDescription:'This is an unpaid internship.'}},now),null);});
test('recovery cache keeps original evidence time and refreshes after expiry',async()=>{let requests=0;const fetcher=(async()=>{requests++;return Response.json(payload)}) as typeof fetch;const first=await loadEmployerRecovery([seed],{},now,fetcher);assert.equal(first.candidates.length,1);const later=new Date(now.getTime()+3600000);const cached=await loadEmployerRecovery([seed],first.state,later,fetcher);assert.equal(requests,1);assert.equal(recoveryEvidenceAt(cached.candidates[0]),now.toISOString());const expired=await loadEmployerRecovery([seed],first.state,new Date(now.getTime()+86400001),(async()=>new Response('',{status:403})) as typeof fetch);assert.equal(expired.candidates.length,0);});
test('retired career families do not classify or survive stored tags',async()=>{const {getJobRoleTags,getRoleSelection,ROLE_FAMILIES}=await import('../lib/role-areas');for(const title of ['Human Resources Intern','Legal Intern','Biology Research Intern','Nursing Intern','Teaching Intern'])assert.deepEqual(classifyRoleTags({title,category:'Internship'}),[]);assert.deepEqual(getJobRoleTags({title:'Legal Intern',category:'Internship',roleTags:['legal']}),[]);assert.deepEqual(getRoleSelection('people-legal',null),{family:'all',specialty:null});assert.ok(!ROLE_FAMILIES.some(f=>['people-legal','science-health','education'].includes(f.value)));assert.deepEqual(classifyRoleTags({title:'Software Engineer Intern - Healthcare',category:'Internship'}),['software-engineering']);});

test('current employer evidence cannot override blocks, pending reviews or destination restrictions', async()=>{
  const {evaluateCompanyQuality}=await import('../lib/company-quality');
  const company={name:'Example',title:'Software Engineer Intern',applyUrl:seed.url};
  const unknown=evaluateCompanyQuality(company,'Paid software internship',[]);
  assert.equal(admitWithCurrentEmployerEvidence(unknown,true).status,'approved');
  assert.equal(admitWithCurrentEmployerEvidence(unknown,false).status,'quarantined');
  for(const status of ['blocked','pending'] as const){const decision=evaluateCompanyQuality(company,'Paid internship',[],[{name:'Example',status,reason:'review',reviewedAt:now.toISOString()}]);assert.notEqual(admitWithCurrentEmployerEvidence(decision,true).status,'approved');}
  const restricted=evaluateCompanyQuality(company,'Paid internship',[],[{name:'Example',status:'approved',reason:'scope',reviewedAt:now.toISOString(),allowedDestinations:[{hostname:'other.wd1.myworkdayjobs.com',pathPrefix:'/Careers/'}]}]);assert.equal(admitWithCurrentEmployerEvidence(restricted,true).status,'quarantined');
  assert.equal(admitWithCurrentEmployerEvidence(evaluateCompanyQuality(company,'Unpaid internship',[]),true).status,'rejected');
});
test('access denial pauses other postings on that host across runs',async()=>{
  let requests=0;const fetcher=(async()=>{requests++;return new Response('',{status:429})}) as typeof fetch;
  const first=await loadEmployerRecovery([seed],{},now,fetcher);
  const next={...seed,url:seed.url.replace('JR123','JR124')};
  const second=await loadEmployerRecovery([seed,next],first.state,new Date(now.getTime()+3600000),fetcher);
  assert.equal(requests,1);assert.equal(second.candidates.length,0);assert.equal(second.remaining,1);
});

test('paid volunteer benefits and prior volunteering do not reject a paid job',async()=>{
 const {evaluateCompanyQuality}=await import('../lib/company-quality');
 for(const text of ['Paid internship with paid volunteer days.','Paid software internship. Prior volunteer experience is welcome.','Paid intern program includes networking and volunteer opportunities.'])assert.notEqual(evaluateCompanyQuality({name:'Example',title:'Software Intern'},text,[]).status,'rejected');
 for(const text of ['This is an unpaid internship.','This is a volunteer position.'])assert.equal(evaluateCompanyQuality({name:'Example',title:'Software Intern'},text,[]).status,'rejected');
 assert.equal(evaluateCompanyQuality({name:'Example',title:'Volunteer Software Developer'},'Work on software.',[]).status,'rejected');
});

test('SmartRecruiters title slugs retain the exact posting identity',async()=>{const {parseSmartRecruitersJobUrl}=await import('../lib/smartrecruiters');assert.equal(parseSmartRecruitersJobUrl('https://jobs.smartrecruiters.com/Example/123456789-software-engineer')?.jobId,'123456789');assert.equal(parseSmartRecruitersJobUrl('https://jobs.smartrecruiters.com/Example/not-a-job'),null);});

test('graduate and associate engineering titles are eligible while senior and management titles remain excluded',async()=>{const {isEarlyCareerTitle}=await import('../lib/ats-boards');for(const title of ['Graduate Civil Engineer','Associate Software Engineer','Associate Consultant'])assert.equal(isEarlyCareerTitle(title),true);for(const title of ['Senior Graduate Recruiter','Graduate Program Manager','Principal Associate Engineer'])assert.equal(isEarlyCareerTitle(title),false);});

test('general engineering preserves specialty uncertainty and graduate programs remain student-specific',()=>{assert.deepEqual(classifyRoleTags({title:'Graduate Product Engineer',category:'New grad'}),['general-engineering']);assert.deepEqual(classifyRoleTags({title:'Senior Product Engineer',category:'New grad'}),[]);assert.ok(classifyRoleTags({title:'New Grad: Rotational Discovery Program',category:'New grad'}).includes('graduate-programs'));assert.deepEqual(classifyRoleTags({title:'General Program',category:'New grad'}),[]);});

test('recovery uses the current application URL and rejects a different returned requisition',()=>{const updated=seed.url.replace('Engineering-Intern_JR123','Mechanical-Engineering-Intern_JR123');const job=parseRecoveryPosting(seed,{jobPostingInfo:{...payload.jobPostingInfo,externalUrl:updated}},now);assert.equal(job?.applyUrl,updated);assert.equal(parseRecoveryPosting(seed,{jobPostingInfo:{...payload.jobPostingInfo,externalUrl:updated.replace('JR123','JR999')}},now),null);});

test('positive recovery evidence refreshes before its 24-hour publication expiry',async()=>{let requests=0;const fetcher=(async()=>{requests++;return Response.json(payload)}) as typeof fetch;const first=await loadEmployerRecovery([seed],{},now,fetcher);const refreshed=await loadEmployerRecovery([seed],first.state,new Date(now.getTime()+12*3600000),fetcher);assert.equal(requests,2);assert.equal(refreshed.candidates.length,1);assert.equal(recoveryEvidenceAt(refreshed.candidates[0]),new Date(now.getTime()+12*3600000).toISOString());});

test('published missing openings receive recovery slots without starving discovery or exceeding the cap', async () => {
  const known = Array.from({length: 8}, (_, i) => ({...seed, url: seed.url.replace('JR123', `JR${1000+i}`)}));
  const unknown = Array.from({length: 12}, (_, i) => ({...seed, url: seed.url.replace('JR123', `JR${2000+i}`)}));
  const candidate = parseRecoveryPosting(seed,payload,now)!;
  const saved = Object.fromEntries(known.map(s => [opportunityIdentity(s.url)!, {status:'live' as const,checkedAt:new Date(now.getTime()-23*3600000).toISOString(),candidate:{...candidate,applyUrl:s.url}}]));
  const requested: string[] = [];
  const result = await loadEmployerRecovery([...unknown,...known],saved,now,(async input=>{
    const url=String(input); requested.push(url);
    const req=url.match(/_(JR\d+)$/)![1];
    return Response.json({jobPostingInfo:{...payload.jobPostingInfo,jobReqId:req}});
  }) as typeof fetch,5,{previousJobs:known.map(s=>({...candidate,id:s.url,applyUrl:s.url} as unknown as PublicJob)),seenUrls:known.slice(0,7).map(s=>s.url)});
  assert.equal(result.requests,5);
  assert.ok(requested[0].endsWith('JR1007'), 'published opening missing from inputs is checked first');
  assert.equal(requested.filter(url=>/JR1\d+$/.test(url)).length,4);
  assert.equal(requested.filter(url=>/JR2\d+$/.test(url)).length,1);
});

test('fresh exact Workday evidence grants current admission and avoids duplicate recovery requests', async () => {
  const posting={...parseRecoveryPosting(seed,payload,now)!,source:'Direct ATS (Workday)',rawText:'Mechanical engineering internship. Employer description must not persist.'};
  const checks=[{url:posting.applyUrl,status:'live' as const}];
  const evidence=currentWorkdayEvidence([posting],checks);
  assert.equal(evidence.matches(posting),true);
  assert.equal(evidence.matches({...posting,company:'Unrelated employer'}),false);
  assert.equal(evidence.matches({...posting,applyUrl:posting.applyUrl.replace('/Careers/','/Other/')}),false);
  assert.equal(evidence.matches({...posting,applyUrl:posting.applyUrl.replace('JR123','JR124')}),false);
  const alias={...posting,applyUrl:posting.applyUrl.replace('/Careers/','/en-US/careers/').replace('Engineering-Intern','Different-Slug')};
  assert.equal(evidence.matches(alias),true);
  const {evaluateCompanyQuality}=await import('../lib/company-quality');
  assert.equal(admitWithCurrentEmployerEvidence(evaluateCompanyQuality({name:'Example',title:posting.title,applyUrl:posting.applyUrl},posting.rawText,[]),evidence.matches(posting)).status,'approved');
  const result=await loadEmployerRecovery([seed],{},now,(async()=>{throw new Error('duplicate request')}) as typeof fetch,5,{workdayPostings:[posting],workdayChecks:checks});
  assert.equal(result.requests,0);assert.equal(result.reusedCurrentPostings,1);assert.equal(result.candidates.length,1);
  assert.equal(recoveryEvidenceAt(result.candidates[0]),now.toISOString());
  assert.ok(!JSON.stringify(result.state).includes('Employer description must not persist'));
});

test('unknown or terminal Workday observations cannot create or retain recovery trust', async () => {
  const candidate=parseRecoveryPosting(seed,payload,now)!;
  for (const status of ['unknown','closed','ineligible'] as const) {
    assert.equal(currentWorkdayEvidence([candidate],[{url:seed.url,status}]).matches(candidate),false);
  }
  const saved={[opportunityIdentity(seed.url)!]:{status:'live' as const,checkedAt:now.toISOString(),candidate}};
  const result=await loadEmployerRecovery([seed],saved,now,(async()=>{throw new Error('unexpected request')}) as typeof fetch,0,{workdayPostings:[candidate],workdayChecks:[{url:seed.url,status:'live'},{url:seed.url,status:'closed'}]});
  assert.equal(result.candidates.length,0);
  assert.equal(result.state[opportunityIdentity(seed.url)!].status,'unknown');
});

test('legacy recovery migration binds positives to their exact site and preserves host denial cooldowns', async () => {
  const candidate=parseRecoveryPosting(seed,payload,now)!;
  const saved={[jobIdentity(seed.url)!]:{status:'live' as const,checkedAt:now.toISOString(),candidate}};
  const other={...seed,url:seed.url.replace('/Careers/','/Internal/')};
  const result=await loadEmployerRecovery([seed,other],saved,now,fetch,0);
  assert.equal(result.candidates.length,1);
  assert.equal(result.state[opportunityIdentity(other.url)!],undefined);
  assert.equal(result.state[opportunityIdentity(seed.url)!].checkedAt,now.toISOString());
  let requests=0;
  const denied=await loadEmployerRecovery([seed,other],{[jobIdentity(seed.url)!]:{status:'unknown',checkedAt:now.toISOString(),accessDenied:true}},now,(async()=>{requests++;return Response.json(payload)}) as typeof fetch,5);
  assert.equal(requests,0);assert.equal(denied.candidates.length,0);assert.equal(denied.pausedHosts,1);
});
