"use client";
import type {JobDateWindow} from "@/lib/job-date-window";
const windows:ReadonlyArray<[JobDateWindow,string]>=[['all','All'],['today','New today'],['week','New this week']];
export function BoardFreshnessControls({value,onChange,onReset,storageError}:{value:JobDateWindow;onChange:(value:JobDateWindow)=>void;onReset:()=>void;storageError:boolean}){
  return <div className="board-preferences-bar">
    <div className="date-window-controls">
      <div className="date-window-buttons" role="group" aria-label="Date added to Empluzzed">
        {windows.map(([key,label])=><button key={key} type="button" aria-pressed={value===key} onClick={()=>onChange(key)}>{label}</button>)}
      </div>
      <span className="date-window-note" title="Today starts at midnight Pacific. This week starts Monday at midnight Pacific.">Added to Empluzzed · Pacific time</span>
    </div>
    <div className="remembered-filters"><span>{storageError?'Filters work, but could not be remembered.':'Filters remembered in this browser'}</span><button type="button" onClick={onReset} title="Reset board filters. Saved jobs, application statuses and hidden companies stay unchanged.">Reset filters</button></div>
  </div>;
}
