import type {PublicJob} from './jobs';
import {BOARD_TIME_ZONE} from './job-date-window';
const format=(timeZone:string)=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone});
const postedFormatter=format('UTC');
const addedFormatter=format(BOARD_TIME_ZONE);
export function listingDateDisplay(job:Pick<PublicJob,'postedAt'|'postedAtSource'|'firstPublishedAt'>,added=false){
  const posted=Date.parse(job.postedAt);
  const sourceExplanation=job.postedAtSource==='first_seen'
    ? 'When empluzzed first found this listing. The employer may have posted it earlier.'
    : job.postedAtSource==='relative_derived'
      ? 'Estimated from a relative source date, such as 3 days ago.'
      : 'Date supplied by the listing source. It may reflect publication or creation.';
  const value=added?job.firstPublishedAt:job.postedAt;
  const timestamp=Date.parse(value??'');
  const text=Number.isFinite(timestamp)?(added?addedFormatter:postedFormatter).format(timestamp):'Date unavailable';
  const explanation=added
    ? `Added to Empluzzed in Pacific time. Original posting/source date: ${Number.isFinite(posted)?postedFormatter.format(posted):'unavailable'}. ${sourceExplanation}`
    : sourceExplanation;
  return {text,dateTime:Number.isFinite(timestamp)?value:undefined,explanation};
}
