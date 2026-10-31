"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { activityConfigured, activityEndpoint, setOwnerExclusion } from "@/lib/activity-client";
import type { ActivityReport } from "@/lib/activity-contract";
import type { JobsSummary } from "@/lib/job-summary";
import { SourceHealthSummary } from "../SourceHealthSummary";
const number = (value: number) => value.toLocaleString("en-US");
const percent = (n: number, d: number) => d ? `${(100 * n / d).toFixed(1)}%` : "No data";
const label = (value: string) => ({fulltime: "Early career", internships: "Internships", direct_unknown: "Direct or unknown"}[value] ?? value.replaceAll("_", " "));
export function AnalyticsDashboard() {
  const [draft, setDraft] = useState("");
  const range: ActivityReport["range"] = "all";
  const [report, setReport] = useState<ActivityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [excluded, setExcluded] = useState(true);
  const token = useRef("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => { setOwnerExclusion(true); return () => { request.current?.abort(); token.current = ""; }; }, []);
  async function loadReport(secret: string, nextRange: ActivityReport["range"]) {
    if (!activityConfigured) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setMessage(""); setReport(null);
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const url = new URL("/report", activityEndpoint);
      url.searchParams.set("range", nextRange);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${secret}` }, credentials: "omit", cache: "no-store",
        referrerPolicy: "no-referrer", redirect: "error", signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) { token.current = ""; setUnlocked(false); throw new Error("Could not unlock the dashboard. Check your password."); }
      if (!response.ok) throw new Error("Reports are temporarily unavailable. Collection may have reached a free-tier limit. Try again later.");
      const data: ActivityReport = await response.json();
      if (data.version !== 1 || data.range !== nextRange || !data.totals || !Array.isArray(data.daily) || !Array.isArray(data.breakdown)) throw new Error("The report response could not be read.");
      if (controller.signal.aborted) return;
      token.current = secret; setUnlocked(true); setDraft(""); setReport(data);
    } catch (error) {
      if (request.current === controller) setMessage(controller.signal.aborted ? "The request timed out. Try again." : error instanceof Error ? error.message : "Could not load analytics.");
    } finally {
      window.clearTimeout(timer);
      if (request.current === controller) setLoading(false);
    }
  }
  function connect(event: FormEvent) { event.preventDefault(); void loadReport(draft.trim(), range); }
  function lock() { request.current?.abort(); request.current = null; token.current = ""; setUnlocked(false); setDraft(""); setReport(null); setMessage(""); setLoading(false); }
  return <section className={`analytics-shell${unlocked ? "" : " analytics-locked"}`}>
    {unlocked ? <><h1 className="sr-only">Analytics dashboard</h1><label className="analytics-exclusion"><input type="checkbox" checked={excluded} onChange={(event) => { setExcluded(event.target.checked); setOwnerExclusion(event.target.checked); }} />Exclude this browser from activity collection</label></> : <form className="analytics-access" onSubmit={connect}>
      <h1>Analytics dashboard</h1>
      <input type="text" name="username" autoComplete="username" value="empluzzed-owner" readOnly hidden />
      <label><span className="sr-only">Password</span><input name="password" type="password" placeholder="Password" autoComplete="current-password" spellCheck={false} required minLength={43} maxLength={128} value={draft} onChange={(event) => setDraft(event.target.value)} /></label>
      <button className="button primary" disabled={loading || !activityConfigured}>{loading ? "Opening..." : "Open dashboard"}</button>
      <p role="status" aria-live="polite">{message}</p>
    </form>}
    {unlocked && message ? <p role="status" aria-live="polite">{message}</p> : null}
    {unlocked ? <div className="analytics-toolbar"><div><button type="button" className="button secondary" disabled={loading} onClick={() => void loadReport(token.current, range)}>{loading ? "Loading..." : "Refresh"}</button><button type="button" className="button secondary" onClick={lock}>Lock dashboard</button></div></div> : null}
    {report ? <ReportContent report={report} /> : null}
  </section>;
}
function ReportContent({ report }: { report: ActivityReport }) {
  const [view, setView] = useState<"month" | "all">("month");
  const [month, setMonth] = useState(report.end.slice(0, 7));
  const months = report.monthly ?? [];
  const selectedMonth = months.find(row => row.month === month);
  const monthName = new Date(month + "-01T00:00Z").toLocaleDateString("en-US", {month:"long", year:"numeric", timeZone:"UTC"});
  const monthlyView = view === "month";
  const monthlyAvailable = !!selectedMonth;
  const events = (name: string) => report.breakdown.filter(row => row.name === name).reduce((sum,row) => sum + row.count,0);
  const features: [string, number, number][] = [["Employer links", report.totals.applied, events("apply_click")], ["Saved jobs", report.totals.saved, events("save_click")], ["Filters", report.totals.filtered, events("filter_use")], ["Tracker additions", report.totals.tracked, events("application_add")]];
  const pageviews = report.breakdown.filter(row => row.name === "page_view");
  const grouped = (kind: "board" | "source" | "device") => {
    const counts = new Map<string,number>();
    for (const row of pageviews) {
      const key = kind === "board" ? row.board : row.dimension.split(":")[kind === "source" ? 0 : 1];
      if (kind === "board" && key === "none") continue;
      counts.set(key,(counts.get(key) ?? 0) + row.count);
    }
    return [...counts].sort((a,b) => b[1]-a[1]);
  };
  const zero = report.breakdown.filter(row => row.name === "filter_use" && row.dimension.endsWith(":zero")).reduce((sum,row) => sum+row.count,0);
  return <>
    <div className="analytics-view-controls"><div className="analytics-segments analytics-period-switch" data-view={view} aria-label="Reporting period"><button type="button" aria-pressed={monthlyView} onClick={() => setView("month")}>Month</button><button type="button" aria-pressed={!monthlyView} onClick={() => setView("all")}>All time</button></div>{monthlyView ? <label className="analytics-day-picker"><span className="sr-only">Select month</span><select value={month} onChange={event => setMonth(event.target.value)}>{[...new Set([report.end.slice(0,7), ...months.map(row => row.month)])].sort().reverse().map(value => <option key={value} value={value}>{new Date(value+"-01T00:00Z").toLocaleDateString("en-US",{month:"long",year:"numeric",timeZone:"UTC"})}</option>)}</select></label> : null}</div>
    {report.daily.some(row => row.limited) ? <p className="analytics-warning">Some days reached a collection limit. Their counts are incomplete.</p> : null}
    {monthlyView ? <div className="analytics-metrics">
      <Metric title={`Visitors in ${monthName}`} value={monthlyAvailable ? number(selectedMonth.visitors) : "Unavailable"} detail="Unique browsers across this month. Each browser counts once, even if it visits on multiple days." />
      <Metric title="Engaged visitors" value={monthlyAvailable ? number(selectedMonth.active) : "Unavailable"} detail={selectedMonth ? `${percent(selectedMonth.active,selectedMonth.visitors)} of this month's visitors used a measured feature.` : "The collector has not supplied a monthly summary."} />
      <Metric title="Employer-link clickers" value={monthlyAvailable ? number(selectedMonth.applied) : "Unavailable"} detail="Unique browsers opening employer links this month, not confirmed applications." />
      <Metric title="Employer-link clicks" value={monthlyAvailable ? number(selectedMonth.clicks) : "Unavailable"} detail="Total clicks this month, including repeat clicks." />
    </div> : <div className="analytics-metrics">
      <Metric title="All-time unique visitors" value={number(report.totals.visitors)} detail="How many browsers visited, counted once in this period. Devices can count separately." />
      <Metric title="Engaged visitors" value={number(report.totals.active)} detail={`${percent(report.totals.active,report.totals.visitors)} of visitors used a filter, saved/unsaved, opened an employer link or added a tracker entry.`} />
      <Metric title="Employer-link clickers" value={number(report.totals.applied)} detail={`${percent(report.totals.applied,report.totals.visitors)} of visitors opened an employer link. This does not confirm an application.`} />
      <Metric title="Returning visitors" value={number(report.totals.returning)} detail={`${percent(report.totals.returning,report.totals.visitors)} were seen on an earlier UTC day, including earlier in this period.`} />
    </div>}
    <ActivityTrend key={`${view}-${month}`} report={report} month={monthlyView ? month : null} />
    {!monthlyView ? <section className="analytics-panel analytics-actions"><h2>What people actually use</h2><p className="analytics-caption">Visitors count once per feature. Actions include repeated uses. One bulk tracker addition counts as one action.</p><div className="analytics-table-scroll"><table className="analytics-table"><thead><tr><th scope="col">Feature</th><th scope="col">Visitors</th><th scope="col">Share of visitors</th><th scope="col">Actions</th></tr></thead><tbody>{features.map(([name,people,actions]) => <tr key={name}><th scope="row">{name}</th><td>{number(people)}</td><td>{percent(people,report.totals.visitors)}</td><td>{number(actions)}</td></tr>)}</tbody></table></div><p className="analytics-caption">Zero-result filter uses: {number(zero)} of {number(events("filter_use"))} ({percent(zero,events("filter_use"))}).</p></section> : null}
    <section className="analytics-panel analytics-months"><h2>Monthly totals</h2>{report.monthly?.length ? <div className="analytics-table-scroll"><table className="analytics-table"><thead><tr><th scope="col">Month</th><th scope="col">Visitors</th><th scope="col">Engaged</th><th scope="col">Link clickers</th><th scope="col">Clicks</th></tr></thead><tbody>{report.monthly.map(row => <tr key={row.month}><th scope="row">{new Date(row.month+"-01T00:00Z").toLocaleDateString("en-US",{month:"long",year:"numeric",timeZone:"UTC"})}<small>{row.month === report.end.slice(0,7) ? "In progress" : "Closed month"}{report.trackingSince?.startsWith(row.month) ? " · Collection started " + report.trackingSince.slice(0,10) : ""}{row.limited ? " · Incomplete collection" : ""}</small></th><td>{number(row.visitors)}</td><td>{number(row.active)}</td><td>{number(row.applied)}</td><td>{number(row.clicks)}</td></tr>)}</tbody></table></div> : <p className="analytics-caption">Monthly history will appear after the collector update. No estimates are substituted for unavailable months.</p>}</section>
    {!monthlyView ? <details className="analytics-panel analytics-definitions"><summary>Explore traffic and collection health</summary><div className="analytics-grid"><CountTable title="Boards" rows={grouped("board")} subtitle="Page views, including repeat navigation." /><CountTable title="Traffic sources" rows={grouped("source")} subtitle="Page-view referrers, including internal navigation. These are not unique arrivals or channel conversions." /><CountTable title="Devices" rows={grouped("device")} subtitle="Page views by estimated device type." /></div><BoardHealth /><p>Last accepted event: {report.lastReceivedAt ?? "None"}. Safety limits: {number(report.limits.dailyEvents)} events per day, {report.limits.browserDailyEvents} per browser per day.</p></details> : null}
    <details className="analytics-panel analytics-definitions"><summary>What these numbers can and cannot tell you</summary><p>These are consenting observed browsers, not verified people. Blockers, privacy signals, cleared storage, different devices and collection outages affect counts. Browser identities expire after 180 days. Owner exclusion applies to this browser.</p><p>Engaged visitors and feature groups overlap. They are not a sequential funnel. Returning means seen on an earlier UTC day, not necessarily in a previous month. Employer-link clicks are not submitted applications. Tracker additions measure feature use, never record contents.</p><p>All time starts when collection began. Daily detail is scheduled for deletion after 90 days; failures can delay cleanup. Closed-month summaries preserve aggregate counts without extra browser identities. Missing history is unavailable, not zero.</p></details>
    <button type="button" className="button secondary" onClick={() => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:"application/json"}));
      const a = document.createElement("a"); a.href=url; a.download=`empluzzed-activity-${report.end}.json`; a.click(); URL.revokeObjectURL(url);
    }}>Download full report JSON</button>
  </>;
}
function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <div className="analytics-panel analytics-metric"><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>;
}
function CountTable({title,rows,subtitle}:{title:string;rows:[string,number][];subtitle:string}) {
  return <section><h3>{title}</h3><p className="analytics-caption">{subtitle}</p><table className="analytics-table"><thead><tr><th scope="col">Category</th><th scope="col">Views</th></tr></thead><tbody>{rows.map(([name,count]) => <tr key={name}><th scope="row">{label(name)}</th><td>{number(count)}</td></tr>)}{!rows.length ? <tr><td colSpan={2}>No recorded views.</td></tr> : null}</tbody></table></section>;
}
function ActivityTrend({report, month}:{report:ActivityReport; month:string | null}) {
  const daily = month !== null;
  const [selected,setSelected]=useState<string | null>(null);
  const [table,setTable]=useState(false);
  const monthRows=(report.monthly ?? []).slice().sort((a,b)=>a.month.localeCompare(b.month));
  const rows=report.daily.filter(row=>!month || row.day.startsWith(month));
  const selectedRow=rows.find(row=>row.day===selected) ?? rows.at(-1);
  const selectedMonthRow=monthRows.find(row=>row.month===selected) ?? monthRows.at(-1);
  const monthIndex=(value:string)=>Number(value.slice(0,4))*12+Number(value.slice(5,7));
  const firstMonthIndex=monthRows.length ? monthIndex(monthRows[0].month) : 0;
  const monthSpan=Math.max(1,monthRows.length ? monthIndex(monthRows.at(-1)!.month)-firstMonthIndex : 0);
  const monthX=(value:string)=>monthRows.length===1 ? 450 : 48+(monthIndex(value)-firstMonthIndex)/monthSpan*804;
  const monthLabel=(value:string)=>new Date(value+"-01T00:00Z").toLocaleDateString("en-US",{month:"short",year:"numeric",timeZone:"UTC"});
  const peak=Math.max(1,...(daily ? rows.map(row=>row.visitors) : monthRows.map(row=>row.visitors)));
  const monthStart=month ? Date.parse(month+"-01T00:00Z") : 0;
  const monthEnd=month ? Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0) : 0;
  const span=Math.max(86400000,monthEnd-monthStart);
  const x=(day:string)=>48+(Date.parse(day)-monthStart)/span*804;
  const y=(value:number)=>188-value/peak*144;
  const lastDay=month ? new Date(monthEnd).getUTCDate() : 31;
  const ticks=[1,8,15,22,lastDay].filter((day,i,all)=>all.indexOf(day)===i);
  return <section className="analytics-panel analytics-trend"><div className="analytics-section-heading"><h2>{daily ? "Daily visitors" : "Monthly visitors"}</h2></div>
    {daily ? <>
      <div className="analytics-point" aria-live="polite">{selectedRow ? <><strong>{number(selectedRow.visitors)}</strong> visitors on {selectedRow.day}{selectedRow.limited ? " · Incomplete collection" : ""}</> : "No daily observations available for this month."}</div>
      <svg viewBox="0 0 900 230" role="group" aria-label="Daily visitors over the full calendar month">
        {[0,.5,1].map(t=><g key={t}><line x1="48" y1={y(peak*t)} x2="852" y2={y(peak*t)} stroke="currentColor" opacity=".12"/><text x="35" y={y(peak*t)+4} textAnchor="end" fill="currentColor" fontSize="12">{Number((peak*t).toFixed(1))}</text></g>)}
        {report.trackingSince && month && report.trackingSince.slice(0,10)>month+"-01" ? <><rect x="48" y="35" width={Math.max(0,Math.min(804,x(report.trackingSince.slice(0,10))-48))} height="153" fill="#bba2ff" opacity=".06"/><text x="60" y="60" fill="currentColor" fontSize="12">Before tracking began</text></> : null}
        {rows.map((row,i)=><g key={row.day}>{i>0 && Date.parse(row.day)-Date.parse(rows[i-1].day)===86400000 ? <g><line x1={x(rows[i-1].day)} y1={y(rows[i-1].visitors)} x2={x(row.day)} y2={y(row.visitors)} stroke="#bba2ff" strokeWidth="3" pointerEvents="none"/><line x1={x(rows[i-1].day)} y1={y(rows[i-1].visitors)} x2={x(row.day)} y2={y(row.visitors)} stroke="transparent" strokeWidth="20" pointerEvents="stroke" onPointerMove={event => {
          const svg = event.currentTarget.ownerSVGElement;
          const transform = svg?.getScreenCTM();
          if (!svg || !transform) return;
          const point = svg.createSVGPoint();
          point.x = event.clientX; point.y = event.clientY;
          const pointerX = point.matrixTransform(transform.inverse()).x;
          setSelected(pointerX < (x(rows[i-1].day) + x(row.day)) / 2 ? rows[i-1].day : row.day);
        }} style={{cursor:"crosshair"}} /></g> : null}<circle cx={x(row.day)} cy={y(row.visitors)} r={selectedRow?.day===row.day ? 7 : 5} fill={row.limited ? "#f3d398" : "#bba2ff"} tabIndex={0} role="button" aria-label={`${row.day}: ${row.visitors} visitors`} onFocus={()=>setSelected(row.day)} onPointerEnter={()=>setSelected(row.day)} onClick={()=>setSelected(row.day)} onKeyDown={event=>{if(event.key==="Enter" || event.key===" "){event.preventDefault();setSelected(row.day);}}}><title>{row.day}: {row.visitors}</title></circle></g>)}
        {ticks.map(day=><text key={day} x={48+(day-1)/(lastDay-1)*804} y="217" textAnchor="middle" fill="currentColor" fontSize="12">{month?.slice(5)}-{String(day).padStart(2,"0")}</text>)}
      </svg>
      {rows.length ? <label className="analytics-day-picker">Inspect a day<select value={selectedRow?.day ?? ""} onChange={event=>setSelected(event.target.value)}>{rows.map(row=><option key={row.day} value={row.day}>{row.day}</option>)}</select></label> : <p className="analytics-caption">Daily detail is retained for 90 days. Older monthly totals remain available when archived.</p>}
      <button type="button" className="analytics-text-button" aria-expanded={table} onClick={()=>setTable(!table)}>{table ? "Hide" : "Show"} daily table</button>
      {table ? <div className="analytics-table-scroll"><table className="analytics-table"><thead><tr><th scope="col">UTC day</th><th scope="col">Visitors</th><th scope="col">Engaged</th><th scope="col">Collection</th></tr></thead><tbody>{rows.map(row=><tr key={row.day}><th scope="row">{row.day}</th><td>{row.visitors}</td><td>{row.active}</td><td>{row.limited ? "Incomplete" : "No recorded limit"}</td></tr>)}</tbody></table></div> : null}
    </> : <>
      {selectedMonthRow ? <div className="analytics-point" aria-live="polite"><strong>{number(selectedMonthRow.visitors)}</strong> visitors in {monthLabel(selectedMonthRow.month)}{selectedMonthRow.month===report.end.slice(0,7) ? " (in progress)" : ""}{selectedMonthRow.limited ? " · Incomplete collection" : ""}</div> : null}
      {monthRows.length ? <svg viewBox="0 0 900 230" role="group" aria-label="All-time chart of unique visitors per month">
        {[0,.5,1].map(t=><g key={t}><line x1="48" y1={y(peak*t)} x2="852" y2={y(peak*t)} stroke="currentColor" opacity=".12"/><text x="35" y={y(peak*t)+4} textAnchor="end" fill="currentColor" fontSize="12">{Number((peak*t).toFixed(1))}</text></g>)}
        {monthRows.map((row,i)=><g key={row.month}>
          {i>0 && monthIndex(row.month)-monthIndex(monthRows[i-1].month)===1 ? <g><line x1={monthX(monthRows[i-1].month)} y1={y(monthRows[i-1].visitors)} x2={monthX(row.month)} y2={y(row.visitors)} stroke="#bba2ff" strokeWidth="3" pointerEvents="none"/><line x1={monthX(monthRows[i-1].month)} y1={y(monthRows[i-1].visitors)} x2={monthX(row.month)} y2={y(row.visitors)} stroke="transparent" strokeWidth="20" pointerEvents="stroke" style={{cursor:"crosshair"}} onPointerMove={event=>{
            const svg=event.currentTarget.ownerSVGElement; const transform=svg?.getScreenCTM();
            if(!svg || !transform) return;
            const point=svg.createSVGPoint(); point.x=event.clientX; point.y=event.clientY;
            setSelected(point.matrixTransform(transform.inverse()).x < (monthX(monthRows[i-1].month)+monthX(row.month))/2 ? monthRows[i-1].month : row.month);
          }}/></g> : null}
          <circle cx={monthX(row.month)} cy={y(row.visitors)} r={selectedMonthRow?.month===row.month ? 7 : 5} fill={row.limited ? "#f3d398" : "#bba2ff"} tabIndex={0} role="button" aria-label={`${monthLabel(row.month)}: ${row.visitors} visitors`} onPointerEnter={()=>setSelected(row.month)} onFocus={()=>setSelected(row.month)} onClick={()=>setSelected(row.month)} onKeyDown={event=>{if(event.key==="Enter" || event.key===" "){event.preventDefault();setSelected(row.month);}}}><title>{monthLabel(row.month)}: {row.visitors}</title></circle>
          {i===0 || i===monthRows.length-1 || i % Math.max(1,Math.ceil(monthRows.length/6))===0 ? <text x={monthX(row.month)} y="217" textAnchor="middle" fill="currentColor" fontSize="12">{monthLabel(row.month)}</text> : null}
        </g>)}
      </svg> : null}
      {monthRows.length ? <label className="analytics-day-picker"><span className="sr-only">Inspect a month</span><select value={selectedMonthRow?.month ?? ""} onChange={event=>setSelected(event.target.value)}>{monthRows.map(row=><option key={row.month} value={row.month}>{monthLabel(row.month)}</option>)}</select></label> : null}
      {!monthRows.length ? <p className="analytics-caption">Monthly summaries are not available yet. No daily counts are added together to estimate unique visitors.</p> : null}
    </>}
  </section>;
}
function BoardHealth() {
  const [summary, setSummary] = useState<JobsSummary | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/summary.json", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error();
      const data: JobsSummary = await response.json();
      setSummary(data);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  return <section className="analytics-panel"><h2>Job-data health</h2><p className="analytics-caption">Current public snapshot, separate from visitor analytics and the selected date range.</p>{summary ? <><div className="analytics-health"><span><strong>{number(summary.totalJobs)}</strong> listings</span><span><strong>{summary.closedPostingsCaught === null ? "Not available" : number(summary.closedPostingsCaught)}</strong> closed destinations caught in this snapshot</span></div><SourceHealthSummary summary={summary} /><p className="analytics-caption">Snapshot refreshed {new Date(summary.generatedAt).toLocaleString()}. Listing freshness reflects ingestion time, not a live check of every employer link.</p></> : <p>{failed ? "The snapshot summary could not be loaded." : "Loading current snapshot..."}</p>}</section>;
}
