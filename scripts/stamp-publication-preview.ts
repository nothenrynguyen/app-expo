// Local migration only: no fetching, eligibility changes or publication.
import {readFile,writeFile} from 'node:fs/promises';
import {planPublicationDates,readPublicationDates} from '../lib/ingestion/publication-dates';
import type {JobsSnapshot} from '../lib/jobs';
const state=readPublicationDates(JSON.parse(await readFile('data/publication-dates.json','utf8')));
const aliases=JSON.parse(await readFile('data/job-id-aliases.json','utf8'));
for(const filename of ['jobs','internships','fulltime']){
  const path=`public/${filename}.json`;
  const snapshot=JSON.parse(await readFile(path,'utf8')) as JobsSnapshot;
  const dated=planPublicationDates(snapshot.jobs,snapshot.awaitingVerification??[],[...snapshot.jobs,...(snapshot.awaitingVerification??[])],state,snapshot.generatedAt,aliases);
  snapshot.jobs=dated.jobs;snapshot.awaitingVerification=dated.held;
  await writeFile(path,JSON.stringify(snapshot,null,2)+'\n');
  console.log(`${filename}: ${dated.jobs.length} unchanged listings, ${dated.jobs.filter(job=>job.firstPublishedAt).length} historical dates`);
}
