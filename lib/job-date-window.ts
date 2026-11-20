export type JobDateWindow = "all" | "today" | "week";
export const BOARD_TIME_ZONE = "America/Los_Angeles";
const calendar = new Intl.DateTimeFormat("en-US",{timeZone:BOARD_TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"});
export function boardCalendarDay(value:Date):string|null {
  if(!Number.isFinite(value.getTime()))return null;
  const parts=calendar.formatToParts(value);
  const part=(name:string)=>parts.find(p=>p.type===name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function matchesJobDateWindow(firstPublishedAt:string|undefined,window:JobDateWindow,now=new Date()):boolean {
  if(window==='all')return true;
  const date=new Date(firstPublishedAt??'');
  if(!Number.isFinite(date.getTime())||date.getTime()>now.getTime())return false;
  const day=boardCalendarDay(date),today=boardCalendarDay(now);
  if(!day||!today)return false;
  if(window==='today')return day===today;
  const monday=new Date(`${today}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));
  return day>=monday.toISOString().slice(0,10)&&day<=today;
}
