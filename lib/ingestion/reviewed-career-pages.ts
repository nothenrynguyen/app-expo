import { load } from "../html";
import { classifyListingResponse } from "../listing-health";
import { isEarlyCareerTitle } from "../ats-boards";
import { hasRequiredExperienceConflict } from "../early-career-evidence";
import { canonicalizeUrl, type CandidateJob } from "../source-normalization";
import { sourceReviewHoldIdentity } from "./source-review-holds";
import { inBatches } from "./concurrency";

type Brand = "TikTok" | "ByteDance";
type Posting = { company: Brand; url: string; title: string; location: string; description: string };
export type CareerPageState = Record<string, { checkedAt: string; parserVersion?: number; targetUrl?: string; httpStatus?: number | null; closed?: boolean; posting?: Posting }>;
const PARSER_VERSION = 2;
const evidence = new WeakMap<CandidateJob, string>();
export const careerPageEvidenceAt = (row: CandidateJob) => evidence.get(row);
const brandFor = (name: string): Brand | null => name.trim().toLowerCase() === "tiktok" ? "TikTok" : name.trim().toLowerCase() === "bytedance" ? "ByteDance" : null;

export function officialCareerReference(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const company = url.hostname === "lifeattiktok.com" ? "TikTok" : url.hostname === "joinbytedance.com" ? "ByteDance" : null;
    const id = url.pathname.match(/^\/search\/(\d{16,22})\/?$/)?.[1];
    return company && id ? { company: company as Brand, id, url: `${url.origin}/search/${id}` } : null;
  } catch { return null; }
}

export function needsCareerPageEvidence(row: CandidateJob) {
  if (!brandFor(row.company)) return false;
  if (officialCareerReference(row.applyUrl)) return true;
  try { const u=new URL(row.applyUrl); return u.protocol === "https:" && !u.username && !u.password && !u.port
    && u.hostname === "go.vansh.nyc" && /^\/[a-z0-9]{1,12}$/i.test(u.pathname); } catch { return false; }
}

export function parseOfficialCareerPage(url: string, html: string): Posting | null {
  const ref = officialCareerReference(url);
  if (!ref) return null;
  const $=load(html);
  // React streams completed career content in hidden S:n containers, then
  // moves it into visible template slots. Resolve only literal completed
  // segment moves emitted by this page, in order. Never execute page scripts
  // or reveal arbitrary/unreferenced hidden content.
  const scripts=$("script").toArray().map(node=>$(node).text());
  if (scripts.some(script=>/\$RC\s*=\s*function/.test(script)) && scripts.some(script=>/\$RC\("B:\d+","S:\d+"\)/.test(script))) {
    for(const script of scripts) for(const match of script.matchAll(/\$(RS|RC)\("([BPS]:\d+)","([BPS]:\d+)"\)/g)) {
      const source=match[1]==="RS"?match[2]:match[3], target=match[1]==="RS"?match[3]:match[2];
      if(!/^S:\d+$/.test(source) || !(match[1]==="RS"?/^P:\d+$/:/^B:\d+$/).test(target))continue;
      const segment=$(`div[hidden][id="${source}"]`), slot=$(`template[id="${target}"]`);
      if(segment.length!==1 || slot.length!==1 || segment.find(`template[id="${target}"]`).length)continue;
      slot.replaceWith(segment.contents());segment.remove();
    }
  }
  $("script,style,template,noscript,[hidden],[aria-hidden='true']").remove();
  if(classifyListingResponse(200,$.html())==="closed")return null;
  const title=$("h2").first().text().trim();
  if (!title || $("title").text().trim() !== title) return null;
  const apply=ref.company === "TikTok" ? `https://careers.tiktok.com/resume/${ref.id}/apply` : `https://jobs.bytedance.com/en/resume/${ref.id}/apply`;
  if (!$("a").toArray().some(e=>$(e).attr("href")===apply && /apply to this job/i.test($(e).text()))) return null;
  const value=(label:string)=>$("p,h1,h2,h3").filter((_,e)=>$(e).text().trim()===label).first().next().text().trim();
  const location=value("Location:"), responsibilities=value("Responsibilities"), qualifications=value("Qualifications");
  if (!location || responsibilities.length<80 || qualifications.length<40
    || !isEarlyCareerTitle(title.replace(/\bgraduates\b/gi,"Graduate"),qualifications)
    || hasRequiredExperienceConflict(qualifications)) return null;
  return {company:ref.company,url:ref.url,title,location,description:`Responsibilities\n${responsibilities}\nQualifications\n${qualifications}`};
}

export async function enrichReviewedCareerPages(candidates: CandidateJob[], state: CareerPageState, now: Date,
  fetcher: typeof fetch=fetch, holds=new Set<string>(), limit=25) {
  const nowMs=now.getTime();
  if (!state || typeof state!=="object" || Array.isArray(state) || Object.values(state).some(x=>!x || !Number.isFinite(Date.parse(x.checkedAt)) || Date.parse(x.checkedAt)>nowMs)) throw new Error("Invalid reviewed-career observation state");
  const eligible=[...new Map(candidates.filter(row=>row.sourceActive!==false && needsCareerPageEvidence(row) && !holds.has(sourceReviewHoldIdentity(row.applyUrl)??""))
    .map(row=>[canonicalizeUrl(row.applyUrl)!,row])).entries()];
  const next=structuredClone(state);
  const parserRetry=(key:string)=>state[key]?.httpStatus===200 && !state[key]?.posting && !state[key]?.closed && state[key]?.parserVersion!==PARSER_VERSION;
  const recentParserRetry=(key:string)=>parserRetry(key) && nowMs-Date.parse(state[key].checkedAt)<3600_000;
  const waiting=eligible.filter(([key])=>parserRetry(key) || !state[key] || nowMs-Date.parse(state[key].checkedAt)>=(state[key].posting?12:1)*3600_000)
    .sort(([a],[b])=>Number(recentParserRetry(b))-Number(recentParserRetry(a)) || Number(!!state[b]?.posting)-Number(!!state[a]?.posting)
      || Number(parserRetry(b))-Number(parserRetry(a))
      || (parserRetry(a)&&parserRetry(b)?-1:1)*(Date.parse(state[a]?.checkedAt??"1970-01-01")-Date.parse(state[b]?.checkedAt??"1970-01-01")) || a.localeCompare(b));
  const queues=[...Map.groupBy(waiting,([,row])=>brandFor(row.company)).values()];
  const due: typeof waiting=[];
  while(due.length<limit && queues.some(queue=>queue.length)) for(const queue of queues) {
    if(due.length>=limit)break;
    const row=queue.shift();if(row)due.push(row);
  }
  const selectedKeys = new Set(due.map(([key]) => key));
  const queue = {
    eligible: eligible.length, renewalDue: waiting.filter(([key]) => !!state[key]?.posting).length,
    otherDue: waiting.filter(([key]) => !state[key]?.posting).length,
    selectedRenewals: due.filter(([key]) => !!state[key]?.posting).length,
    selectedOther: due.filter(([key]) => !state[key]?.posting).length,
    byEmployer: [...Map.groupBy(waiting, ([, row]) => brandFor(row.company) ?? "unknown")].map(([employer, rows]) => ({
      employer, due: rows.length, renewalDue: rows.filter(([key]) => !!state[key]?.posting).length,
      selected: rows.filter(([key]) => selectedKeys.has(key)).length,
      selectedRenewals: rows.filter(([key]) => selectedKeys.has(key) && !!state[key]?.posting).length,
    })),
  };
  let requests=0;
  await inBatches(due,4,async([key,row])=>{
    next[key]={checkedAt:now.toISOString(),parserVersion:PARSER_VERSION,httpStatus:null};
    try {
      let ref=officialCareerReference(row.applyUrl);
      if (!ref) {
        requests++;
        const response=await fetcher(row.applyUrl,{redirect:"manual",signal:AbortSignal.timeout(10_000)});
        if (![301,302,303,307,308].includes(response.status)) return;
        const location=response.headers.get("location");
        ref=location?officialCareerReference(location):null;
      }
      if (!ref || ref.company!==brandFor(row.company) || holds.has(sourceReviewHoldIdentity(ref.url)??"")) return;
      next[key].targetUrl=ref.url;
      requests++;
      const response=await fetcher(ref.url,{redirect:"error",signal:AbortSignal.timeout(10_000)});
      next[key].httpStatus=response.status;
      if (!response.ok) return;
      const body=await response.text();
      if(classifyListingResponse(response.status,body)==="closed"){next[key].closed=true;return;}
      const posting=parseOfficialCareerPage(ref.url,body);
      if (posting) next[key].posting=posting;
    } catch { /* Inconclusive results stay pending, never successful by HTTP alone. */ }
  });
  const dueKeys=new Set(due.map(([key])=>key)), verified=new Set<string>(), reused=new Set<string>();
  const rows=candidates.map(row=>{
    const key=canonicalizeUrl(row.applyUrl),record=key?next[key]:null,posting=record?.posting;
    const target=record?.targetUrl?officialCareerReference(record.targetUrl):null;
    const pending=row.sourceActive!==false && target && target.company===brandFor(row.company) && record && nowMs-Date.parse(record.checkedAt)<24*3600_000
      && !holds.has(sourceReviewHoldIdentity(row.applyUrl)??"") && !holds.has(sourceReviewHoldIdentity(target.url)??"")?{...row,applyUrl:target.url}:row;
    if (row.sourceActive===false || !needsCareerPageEvidence(row) || !record || !posting || posting.company!==brandFor(row.company)
      || officialCareerReference(posting.url)?.company!==posting.company || !posting.title || !posting.location || !posting.description
      || typeof posting.title!=="string" || typeof posting.location!=="string" || typeof posting.description!=="string"
      || !isEarlyCareerTitle(posting.title.replace(/\bgraduates\b/gi,"Graduate"),posting.description) || hasRequiredExperienceConflict(posting.description)
      || nowMs-Date.parse(record.checkedAt)>=24*3600_000 || holds.has(sourceReviewHoldIdentity(row.applyUrl)??"") || holds.has(sourceReviewHoldIdentity(posting.url)??"")) return pending;
    const result={...row,company:posting.company,title:posting.title,location:posting.location,applyUrl:posting.url,
      // A feed's table label cannot override the verified employer's explicit
      // employment type. Keep graduate jobs out of the internship collection.
      category:/\bintern(?:ship)?\b|\bco-?op\b/i.test(posting.title)?"Internship"
        :/\bgraduates?\b|\bnew (?:college )?grad\b/i.test(posting.title)?"New grad":row.category,
      rawText:posting.description,sourceActive:true};
    evidence.set(result,record.checkedAt); (dueKeys.has(key!)?verified:reused).add(posting.url); return result;
  });
  const observations=Object.values(next).flatMap(record=>{
    const url=record.targetUrl??record.posting?.url;
    return url && officialCareerReference(url)?[{url,checkedAt:record.checkedAt,httpStatus:record.httpStatus??null,
      status:record.posting?"live" as const:record.closed || [404,410].includes(record.httpStatus??0)?"closed" as const:"unknown" as const}]:[];
  });
  return {candidates:rows,state:next,requests,attempted:due.length,verified:verified.size,reused:reused.size,observations,queue};
}
