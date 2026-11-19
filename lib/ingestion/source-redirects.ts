import {discoverAtsBoard,type AtsBoardResult} from "../ats-boards";
import {canonicalizeUrl,jobIdentity,type CandidateJob} from "../source-normalization";
import {sourceReviewHoldIdentity} from "./source-review-holds";
import {needsCareerPageEvidence} from "./reviewed-career-pages";
import {inBatches} from "./concurrency";
import {load} from "../html";
import {classifyListingResponse} from "../listing-health";

export type RedirectState=Record<string,{checkedAt:string;target:string|null}>;
const DAY=86400_000;
function key(row:CandidateJob,allowed:Set<string>,dreamwork:Set<string>) {
  if ((!allowed.has(row.source)&&!dreamwork.has(row.source)) || needsCareerPageEvidence(row) || row.sourceActive===false) return null;
  try {const u=new URL(row.applyUrl);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port
    &&((allowed.has(row.source)&&u.hostname==='go.vansh.nyc'&&/^\/[a-z0-9]{1,12}$/i.test(u.pathname))
      ||(dreamwork.has(row.source)&&u.hostname==='www.dreamworkhq.com'&&/^\/job\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.pathname)))?canonicalizeUrl(row.applyUrl):null;}catch{return null;}
}
function direct(value:string,company:string,source:string) {
  try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port
    &&discoverAtsBoard(value,company,source)?canonicalizeUrl(value):null;}catch{return null;}
}

export function originalPostingLink(html:string):string|null {
  if(classifyListingResponse(200,html)==='closed')return null;
  const $=load(html);$('script,style,template,noscript,[hidden],[aria-hidden="true"]').remove();
  const links=new Set($('a.job-original-link').toArray().filter(node=>/^View original posting$/i.test($(node).text().trim()))
    .map(node=>$(node).attr('href')).filter((href):href is string=>!!href));
  return links.size===1?[...links][0]:null;
}

// Resolve only licensed owners' public short URLs/original-posting links. This is discovery,
// not positive listing evidence. Never fetch the resolved destination here,
// follow an unreviewed redirect or access a private/account-gated endpoint.
export async function resolveSourceRedirects(rows:CandidateJob[],saved:RedirectState,allowed:Set<string>,
  now=new Date(),fetcher:typeof fetch=fetch,holds=new Set<string>(),published=new Set<string>(),budget=100,dreamwork=new Set<string>()) {
  const state=structuredClone(saved),unique=new Map<string,CandidateJob>();
  for(const row of rows){const k=key(row,allowed,dreamwork);if(k&&!published.has(jobIdentity(row.applyUrl)??'')&&!holds.has(sourceReviewHoldIdentity(row.applyUrl)??''))unique.set(k,row);}
  const age=(k:string)=>{const t=Date.parse(state[k]?.checkedAt??'');return Number.isFinite(t)&&t<=now.getTime()?now.getTime()-t:Infinity;};
  for(const k of Object.keys(state))if(!unique.has(k)&&age(k)>90*DAY)delete state[k];
  const waiting=[...unique].filter(([k])=>age(k)>=(state[k]?.target?7*DAY:DAY))
    .sort(([a],[b])=>age(b)-age(a)||a.localeCompare(b));
  const short=waiting.filter(([k])=>new URL(k).hostname==='go.vansh.nyc');
  const pages=waiting.filter(([k])=>new URL(k).hostname==='www.dreamworkhq.com');
  const due:typeof waiting=[];
  for(let i=0;due.length<budget&&(i<short.length||i<pages.length);i++)for(const item of [short[i],pages[i]])if(item&&due.length<budget)due.push(item);
  let requests=0,throttled=false;
  await inBatches(due,2,async([k,row])=>{
    if(throttled)return;
    requests++;state[k]={checkedAt:now.toISOString(),target:null};
    try {const r=await fetcher(k,{redirect:'manual',signal:AbortSignal.timeout(10000)});
      if(r.status===429){throttled=true;return;}
      const location=new URL(k).hostname==='www.dreamworkhq.com'&&r.ok?originalPostingLink(await r.text()):
        [301,302,303,307,308].includes(r.status)?r.headers.get('location'):null;
      if(!location)return;
      const target=direct(location,row.company,row.source);
      if(target&&!holds.has(sourceReviewHoldIdentity(target)??''))state[k].target=target;
    }catch{/* Failed resolution is not closure and clears an old mapping. */}
  });
  const targets=new Map<string,string>();
  for(const [k,row]of unique){const target=state[k]?.target;if(target&&age(k)<30*DAY&&direct(target,row.company,row.source)
    &&!holds.has(sourceReviewHoldIdentity(target)??''))targets.set(k,target);}
  const discovered=[...unique].flatMap(([k,row])=>{const target=targets.get(k);return target?[{...row,applyUrl:target}]:[];});
  const checked=new Set(due.map(([k])=>k));
  return {state,requests,targets,discovered,reused:[...targets.keys()].filter(k=>!checked.has(k)).length};
}

export function applyVerifiedRedirects(rows:CandidateJob[],targets:Map<string,string>,boards:Map<string,AtsBoardResult>) {
  const enriched=new Set<string>();
  const candidates=rows.map(row=>{
    const target=targets.get(canonicalizeUrl(row.applyUrl)??'');if(!target)return row;
    const board=discoverAtsBoard(target,row.company,row.source),result=board&&boards.get(board.id);
    const posting=result?.jobs.find(job=>jobIdentity(job.applyUrl)===jobIdentity(target));
    if(!posting)return row;
    enriched.add(jobIdentity(posting.applyUrl)!);return {...row,...posting,source:row.source};
  });
  return {candidates,enriched:enriched.size};
}
