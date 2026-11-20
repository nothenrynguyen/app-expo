import assert from "node:assert/strict";
import test from "node:test";
import {matchesJobDateWindow as matches} from "../lib/job-date-window";
import {boardPreferencesKey,defaultBoardPreferences,parseBoardPreferences,serializeBoardPreferences} from "../lib/board-preferences";
import {emptyPublicationDates,planPublicationDates,recordPublicationHistory,readPublicationDates} from "../lib/ingestion/publication-dates";
import type {PublicJob} from "../lib/jobs";
import {filterJobs} from "../lib/job-board";
const job=(id:string):PublicJob=>({id,company:'Example',title:'Software Engineering Intern',term:'Summer 2027',location:'New York, NY',workMode:'in_person',postedAt:'2026-11-20T12:00:00Z',postedAtSource:'exact',applyUrl:`https://example.com/jobs/${id}`,linkedInUrl:null,category:'Software',salary:null,sources:['example'],verifiedCompany:true});
test('Pacific midnight separates calendar days, including daylight saving transitions',()=>{
  for(const [before,after] of [['2026-11-20T07:59:59Z','2026-11-20T08:00:00Z'],['2026-03-08T07:59:59Z','2026-03-08T08:00:00Z'],['2026-11-01T06:59:59Z','2026-11-01T07:00:00Z']]){
    assert.equal(matches(before,'today',new Date(after)),false);
    assert.equal(matches(after,'today',new Date(after)),true);
  }
});
test('This week starts Monday Pacific and excludes future and missing timestamps',()=>{
  const now=new Date('2026-11-20T15:00:00Z');
  assert.equal(matches('2026-11-16T07:59:59Z','week',now),false);
  assert.equal(matches('2026-11-16T08:00:00Z','week',now),true);
  for(const value of [undefined,'bad','2026-11-20T16:00:00Z'])assert.equal(matches(value,'week',now),false);
  assert.equal(matches(undefined,'all',now),true);
  assert.equal(matches('2026-11-16T08:00:00Z','week',new Date('2026-11-23T07:59:59Z')),true);
  assert.equal(matches('2026-11-16T08:00:00Z','week',new Date('2026-11-23T08:00:00Z')),false);
});
test('Preferences isolate collections, validate old or corrupt storage and preserve explicit empty regions',()=>{
  assert.notEqual(boardPreferencesKey('internships'),boardPreferencesKey('fulltime'));
  for(const raw of [null,'bad','null','{"version":2}','x'.repeat(10001)])assert.deepEqual(parseBoardPreferences(raw),defaultBoardPreferences());
  const defaults=defaultBoardPreferences();defaults.regions=[];defaults.dateWindow='week';
  assert.deepEqual(parseBoardPreferences(serializeBoardPreferences(defaults)),defaults);
  assert.deepEqual(parseBoardPreferences('{"version":1}').regions,['us']);
  const parsed=parseBoardPreferences('{"version":1,"regions":["us","us","bogus"],"modes":["remote","bogus"],"companyTiers":["bogus"],"role":{"family":"bogus"}}');
  assert.deepEqual(parsed.regions,['us']);assert.deepEqual(parsed.modes,['remote']);assert.deepEqual(parsed.companyTiers,[]);assert.equal(parsed.role.family,'all');
});
test('Publication planning is pure and a retry cannot advance first publication',()=>{
  const saved=emptyPublicationDates();const timestamp='2026-11-20T14:00:00Z';
  const planned=planPublicationDates([job('new')],[],[],saved,timestamp);
  assert.equal(planned.jobs[0].firstPublishedAt,timestamp);assert.deepEqual(saved,emptyPublicationDates());
  const retry=planPublicationDates([job('new')],[],[],saved,'2026-11-21T14:00:00Z');
  assert.equal(retry.jobs[0].firstPublishedAt,'2026-11-21T14:00:00Z');
});
test('Duplicate identities, aliases, temporary holds and restorations retain the earliest publication',()=>{
  const original=job('old'),saved=emptyPublicationDates();const first='2026-11-10T14:00:00.000Z';
  recordPublicationHistory(saved,[original],first);
  const renamed={...original,id:'new',previousIds:['old']};
  const held=planPublicationDates([], [renamed], [],saved,'2026-11-20T14:00:00Z');
  assert.equal(held.held[0].firstPublishedAt,first);
  const restored=planPublicationDates([renamed],[],[],held.state,'2026-11-21T14:00:00Z');
  assert.equal(restored.jobs[0].firstPublishedAt,first);
  const alias=planPublicationDates([{...job('alias'),applyUrl:'https://different.example/job'}],[],[],saved,'2026-11-21T14:00:00Z',{'alias':'old'});
  assert.equal(alias.jobs[0].firstPublishedAt,first);
});
test('Unknown legacy dates and first-time holds do not become new listings',()=>{
  const result=planPublicationDates([job('legacy')],[job('held')],[job('legacy')],emptyPublicationDates(),'2026-11-20T14:00:00Z');
  assert.equal(result.jobs[0].firstPublishedAt,undefined);assert.equal(result.held[0].firstPublishedAt,undefined);
  const promoted=planPublicationDates([job('held')],[],[],result.state,'2026-11-21T14:00:00Z');
  assert.equal(promoted.jobs[0].firstPublishedAt,'2026-11-21T14:00:00Z');
  assert.throws(()=>readPublicationDates({version:1,dates:{bad:'yesterday'}}));
});
test('Date windows compose with existing eligibility, search and saves, retaining default sorting',()=>{
  const a={...job('a'),firstPublishedAt:'2026-11-20T09:00:00Z',postedAt:'2026-11-20T12:00:00Z'};
  const b={...job('b'),firstPublishedAt:'2026-11-20T10:00:00Z',postedAt:'2026-11-19T12:00:00Z'};
  const filters={type:'internships' as const,roleSelection:{family:'all' as const,specialty:null},query:'',regions:[] as const,metros:[],modes:[],terms:[],companyTiers:[],savedOnly:false,savedJobIds:new Set<string>(),now:new Date('2026-11-20T15:00:00Z')};
  assert.deepEqual(filterJobs([a,b],filters).map(job=>job.id),['a','b']);
  assert.deepEqual(filterJobs([a,b],{...filters,dateWindow:'today'}).map(job=>job.id),['b','a']);
  assert.deepEqual(filterJobs([a,b],{...filters,dateWindow:'today',savedOnly:true,savedJobIds:new Set(['a'])}).map(job=>job.id),['a']);
  assert.equal(filterJobs([a,b],{...filters,dateWindow:'today',query:'nonexistent'}).length,0);
});
