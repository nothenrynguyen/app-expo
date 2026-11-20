import {JOB_METROS,JOB_REGIONS,type JobMetro,type JobRegion} from "./job-locations";
import {getRoleSelection,type RoleSelection} from "./role-areas";
import type {CompanyTier} from "./company-tiers";
import type {JobCollection} from "./job-board";
import type {JobDateWindow} from "./job-date-window";
export type BoardPreferences={role:RoleSelection;regions:JobRegion[];metros:JobMetro[];modes:string[];terms:string[];companyTiers:CompanyTier[];dateWindow:JobDateWindow};
export const defaultBoardPreferences=():BoardPreferences=>({role:{family:'all',specialty:null},regions:['us'],metros:[],modes:[],terms:[],companyTiers:[],dateWindow:'all'});
export const boardPreferencesKey=(type:JobCollection)=>`app-expo:board-preferences:v1:${type}`;
const strings=(value:unknown)=>Array.isArray(value)?[...new Set(value.filter((v):v is string=>typeof v==='string'&&v.length>0&&v.length<=80))].slice(0,50):[];
export function parseBoardPreferences(raw:string|null):BoardPreferences {
  const fallback=defaultBoardPreferences();
  if(!raw||raw.length>10000)return fallback;
  try{
    const p=JSON.parse(raw);if(!p||p.version!==1)return fallback;
    return {role:getRoleSelection(typeof p.role?.family==='string'?p.role.family:null,typeof p.role?.specialty==='string'?p.role.specialty:null),
      regions:Array.isArray(p.regions)?strings(p.regions).filter((v):v is JobRegion=>JOB_REGIONS.some(([key])=>key===v)):fallback.regions,
      metros:strings(p.metros).filter((v):v is JobMetro=>JOB_METROS.some(([key])=>key===v)),
      modes:strings(p.modes).filter(v=>['remote','hybrid','in_person'].includes(v)),terms:strings(p.terms),
      companyTiers:strings(p.companyTiers).filter((v):v is CompanyTier=>['faang_plus','fortune_500'].includes(v)),
      dateWindow:['today','week'].includes(p.dateWindow)?p.dateWindow:'all'};
  }catch{return fallback;}
}
export const serializeBoardPreferences=(preferences:BoardPreferences)=>JSON.stringify({version:1,...preferences});
