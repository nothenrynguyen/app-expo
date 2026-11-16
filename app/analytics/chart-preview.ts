import type { ActivityReport } from "@/lib/activity-contract";
// Fictional, development-only data for reviewing chart interactions without credentials.
export const chartPreview: ActivityReport = {
  version:1, generatedAt:"preview", trackingSince:"2026-10-22T00:00:00Z", lastReceivedAt:null,
  range:"all", start:"2026-10-22", end:"2026-11-16",
  totals:{visitors:310,active:120,returning:62,browsed:280,applied:95,saved:30,filtered:55,tracked:12},
  daily:Array.from({length:16},(_,i)=>({day:`2026-11-${String(i+1).padStart(2,"0")}`,visitors:[28,40,58,30,36,38,19,38,35,29,42,23,41,17,29,8][i],active:8,returning:3,events:90,clicks:i===5 ? 0 : i+8,internshipClicks:i===5 ? 0 : i%5+2,newGradClicks:i===5 ? 0 : i%7+1,limited:i===11})),
  breakdown:[], monthly:[{month:"2026-10",visitors:80,active:30,applied:20,clicks:90,limited:false},{month:"2026-11",visitors:250,active:100,applied:85,clicks:180,limited:true}],
  limits:{dailyEvents:25000,browserDailyEvents:100,detailDays:90},
};
