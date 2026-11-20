"use client";
import {useCallback,useSyncExternalStore} from "react";
import {boardPreferencesKey,defaultBoardPreferences,parseBoardPreferences,serializeBoardPreferences,type BoardPreferences} from "@/lib/board-preferences";
import type {JobCollection} from "@/lib/job-board";
type Snapshot={preferences:BoardPreferences;error:boolean;raw:string|null};
const event='app-expo:board-preferences-change';
const server:Snapshot={preferences:defaultBoardPreferences(),error:false,raw:null};
const snapshots=new Map<JobCollection,Snapshot>();
function read(type:JobCollection):Snapshot {
  if(typeof window==='undefined')return server;
  const previous=snapshots.get(type);
  if(previous?.error)return previous;
  try{const raw=window.localStorage.getItem(boardPreferencesKey(type));
    if(previous?.raw===raw&&!previous.error)return previous;
    const next={raw,preferences:parseBoardPreferences(raw),error:false};snapshots.set(type,next);return next;
  }catch{if(previous?.error)return previous;const next={...(previous??server),error:true};snapshots.set(type,next);return next;}
}
function write(type:JobCollection,preferences:BoardPreferences) {
  const raw=serializeBoardPreferences(preferences);let error=false;
  try{window.localStorage.setItem(boardPreferencesKey(type),raw);}catch{error=true;}
  snapshots.set(type,{preferences,raw,error});window.dispatchEvent(new Event(event));
}
export function useBoardPreferences(type:JobCollection){
  const subscribe=useCallback((listener:()=>void)=>{
    const storage=(e:StorageEvent)=>{if(e.key===null||e.key===boardPreferencesKey(type)){snapshots.delete(type);listener();}};
    window.addEventListener(event,listener);window.addEventListener('storage',storage);
    return()=>{window.removeEventListener(event,listener);window.removeEventListener('storage',storage);};
  },[type]);
  const snapshot=useSyncExternalStore(subscribe,useCallback(()=>read(type),[type]),()=>server);
  const update=useCallback((patch:Partial<BoardPreferences>)=>write(type,{...read(type).preferences,...patch}),[type]);
  const reset=useCallback(()=>write(type,defaultBoardPreferences()),[type]);
  return {preferences:snapshot.preferences,storageError:snapshot.error,update,reset};
}
