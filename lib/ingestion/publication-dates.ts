import {createHash} from "node:crypto";
import {opportunityIdentity} from "../source-normalization";
import type {PublicJob} from "../jobs";

export type PublicationDates = {version:1; historyThrough?:string; dates:Record<string,string|null>};
export const emptyPublicationDates = ():PublicationDates=>({version:1,dates:{}});
function keys(job:PublicJob,aliases:Record<string,string>) {
  const identity=opportunityIdentity(job.applyUrl);
  const ids=[job.id,...(job.previousIds??[])];
  return [...new Set([...(identity?[`o:${createHash('sha256').update(identity).digest('hex').slice(0,24)}`]:[]),
    ...ids.flatMap(id=>[`i:${id}`,...(aliases[id]?[`i:${aliases[id]}`]:[])])])];
}
function validDate(value:unknown):value is string {return typeof value==='string'&&Number.isFinite(Date.parse(value));}
export function readPublicationDates(value:unknown):PublicationDates {
  const state=value as PublicationDates;
  if(!state||state.version!==1||!state.dates||Array.isArray(state.dates)||typeof state.dates!=='object'
    ||Object.entries(state.dates).some(([key,date])=>!(/^(?:o:[a-f0-9]{24}|i:.{1,200})$/.test(key))||(date!==null&&!validDate(date))))
    throw new Error('Invalid first-publication date registry');
  return state;
}
export function recordPublicationHistory(state:PublicationDates,jobs:PublicJob[],observedAt:string|null,aliases:Record<string,string>={}) {
  for(const job of jobs){
    const identifiers=keys(job,aliases);
    const dates=identifiers.map(key=>state.dates[key]).filter(validDate);
    if(validDate(observedAt))dates.push(new Date(observedAt).toISOString());
    const date=dates.sort()[0]??null;
    for(const key of identifiers)state.dates[key]=date;
  }
}

// Planning is pure. The caller saves this registry only with a guard-passing
// snapshot, never as retry progress after a blocked publication.
export function planPublicationDates(current:PublicJob[],held:PublicJob[],previous:PublicJob[],saved:PublicationDates,
  generatedAt:string,aliases:Record<string,string>={}) {
  if(!validDate(generatedAt))throw new Error('Invalid publication timestamp');
  const state:PublicationDates=structuredClone(readPublicationDates(saved));
  // A legacy job without a known date is old, not "new today" at migration.
  for(const job of previous)recordPublicationHistory(state,[job],job.firstPublishedAt??null,aliases);
  const apply=(job:PublicJob,isCurrent:boolean):PublicJob=>{
    const identifiers=keys(job,aliases),known=identifiers.some(key=>Object.hasOwn(state.dates,key));
    const dates=identifiers.map(key=>state.dates[key]).filter(validDate).filter(date=>Date.parse(date)<=Date.parse(generatedAt));
    const firstPublishedAt=dates.sort()[0]??(!known&&isCurrent?generatedAt:undefined);
    if(isCurrent||known)for(const key of identifiers)state.dates[key]=firstPublishedAt??null;
    return {...job,firstPublishedAt};
  };
  return {state,jobs:current.map(job=>apply(job,true)),held:held.map(job=>apply(job,false))};
}
