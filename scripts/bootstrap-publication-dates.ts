import {execFileSync} from "node:child_process";
import {readFile,writeFile} from "node:fs/promises";
import {emptyPublicationDates,recordPublicationHistory} from "../lib/ingestion/publication-dates";
import type {JobsSnapshot} from "../lib/jobs";
const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8',maxBuffer:40_000_000});
if(git('rev-parse','--is-shallow-repository').trim()!=='false')throw new Error('Full publication history is required for date backfill');
const aliases=JSON.parse(await readFile('data/job-id-aliases.json','utf8')) as Record<string,string>;
const commits=git('log','--first-parent','--reverse','--format=%H','--','public/jobs.json').trim().split('\n').filter(Boolean);
const state=emptyPublicationDates();let snapshots=0;
for(const commit of commits){
  const text=git('show',`${commit}:public/jobs.json`);
  const snapshot=JSON.parse(text) as JobsSnapshot;
  if(!Array.isArray(snapshot.jobs))throw new Error(`Unrecognized publication snapshot ${commit}`);
  recordPublicationHistory(state,snapshot.jobs,snapshot.generatedAt??null,aliases);
  snapshots++;
  if(snapshots%100===0)console.log(`Read ${snapshots}/${commits.length} published snapshots`);
}
state.historyThrough=git('rev-parse','HEAD').trim();
await writeFile('data/publication-dates.json',JSON.stringify(state,null,2)+'\n');
console.log(`Recorded ${Object.keys(state.dates).length} identity keys from ${snapshots} published snapshots`);
