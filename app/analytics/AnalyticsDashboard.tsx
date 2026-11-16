"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { activityConfigured, activityEndpoint, setOwnerExclusion } from "@/lib/activity-client";
import type { ActivityReport } from "@/lib/activity-contract";
import type { JobsSummary } from "@/lib/job-summary";
import { SourceHealthSummary } from "../SourceHealthSummary";
const localReports = process.env.NODE_ENV === "development";
const reportsConfigured = localReports || activityConfigured;
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
  const token = useRef("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => { setOwnerExclusion(true); return () => { request.current?.abort(); token.current = ""; }; }, []);
  async function loadReport(secret: string, nextRange: ActivityReport["range"]) {
    if (!reportsConfigured) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setMessage(""); setReport(null);
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const url = localReports
        ? new URL("/__owner-report", window.location.origin)
        : new URL("/report", activityEndpoint);
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
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("preview") === "charts") {
      void import("./chart-preview").then(({chartPreview}) => { setReport(chartPreview); setUnlocked(true); });
    }
  }, []);
  function connect(event: FormEvent) { event.preventDefault(); void loadReport(draft.trim(), range); }
  function lock() { request.current?.abort(); request.current = null; token.current = ""; setUnlocked(false); setDraft(""); setReport(null); setMessage(""); setLoading(false); }
  return <section className={`analytics-shell${unlocked ? "" : " analytics-locked"}`}>
    {unlocked ? <h1 className="sr-only">Analytics dashboard</h1> : <form className="analytics-access" onSubmit={connect}>
      <h1>Analytics dashboard</h1>
      <input type="text" name="username" autoComplete="username" value="empluzzed-owner" readOnly hidden />
      <label><span className="sr-only">Password</span><input name="password" type="password" placeholder="Password" autoComplete="current-password" spellCheck={false} required minLength={43} maxLength={128} value={draft} onChange={(event) => setDraft(event.target.value)} /></label>
      <button className="button primary" disabled={loading || !reportsConfigured}>{loading ? "Opening..." : "Open dashboard"}</button>
      <p role="status" aria-live="polite">{message}</p>
    </form>}
    {unlocked && message ? <p role="status" aria-live="polite">{message}</p> : null}
    {unlocked ? <div className="analytics-toolbar"><div><button type="button" className="button secondary" disabled={loading} onClick={() => void loadReport(token.current, range)}>{loading ? "Loading..." : "Refresh"}</button><button type="button" className="button secondary" onClick={lock}>Lock dashboard</button></div></div> : null}
    {process.env.NODE_ENV === "development" && report?.generatedAt === "preview" ? <p className="analytics-warning">Local chart preview with fictional data. Refresh loads the authenticated live report.</p> : null}
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
  return <div className={`analytics-report analytics-report-${view}`}>
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
    <section aria-label="Overview" className="analytics-section analytics-overview"><div className="analytics-workspace"><ActivityTrend key={`${view}-${month}`} report={report} />
    <div className="analytics-sidebar"><ApplicationsTrend key={`applications-${view}-${month}`} report={report} />{!monthlyView ? <section className="analytics-panel analytics-actions"><h2>What people actually use</h2><p className="analytics-caption">Unique browsers per feature. Actions include repeat use.</p><div className="analytics-table-scroll"><table className="analytics-table"><thead><tr><th scope="col">Feature</th><th scope="col">Visitors</th><th scope="col">Share of visitors</th><th scope="col">Actions</th></tr></thead><tbody>{features.map(([name,people,actions]) => <tr key={name}><th scope="row">{name}</th><td>{number(people)}</td><td>{percent(people,report.totals.visitors)}</td><td>{number(actions)}</td></tr>)}</tbody></table></div><p className="analytics-caption">Zero-result filter uses: {number(zero)} of {number(events("filter_use"))} ({percent(zero,events("filter_use"))}).</p></section> : null}
    <section className="analytics-panel analytics-months"><h2>Monthly totals</h2>{report.monthly?.length ? <div className="analytics-table-scroll"><table className="analytics-table"><thead><tr><th scope="col">Month</th><th scope="col">Visitors</th><th scope="col">Clicks</th></tr></thead><tbody>{report.monthly.map(row => <tr key={row.month}><th scope="row">{new Date(row.month+"-01T00:00Z").toLocaleDateString("en-US",{month:"long",year:"numeric",timeZone:"UTC"})}<small>{row.month === report.end.slice(0,7) ? "In progress" : "Closed month"}{report.trackingSince?.startsWith(row.month) ? " · Collection started " + report.trackingSince.slice(0,10) : ""}{row.limited ? " · Incomplete collection" : ""}</small></th><td>{number(row.visitors)}</td><td>{number(row.clicks)}</td></tr>)}</tbody></table></div> : <p className="analytics-caption">Monthly history will appear after the collector update. No estimates are substituted for unavailable months.</p>}</section>
    </div></div></section>
    <section aria-labelledby="analytics-traffic-heading" className="analytics-section analytics-traffic">
      <h2 id="analytics-traffic-heading" className="analytics-traffic-heading">Traffic &amp; health</h2>
      <p className="analytics-caption analytics-tab-context">All-time traffic since collection began. These page-view counts include repeat navigation and are separate from the selected month.</p>
      <div className="analytics-traffic-grid"><CountTable title="Boards" rows={grouped("board")} subtitle="Page views by job board." /><CountTable title="Traffic sources" rows={grouped("source")} subtitle="Page-view referrers, not unique arrivals or conversions." /><CountTable title="Devices" rows={grouped("device")} subtitle="Page views by estimated device type." /></div>
      <BoardHealth />
      <p className="analytics-caption analytics-tab-context">Last accepted event: {report.lastReceivedAt ?? "None"}. Collection limits: {number(report.limits.dailyEvents)} events per day, {report.limits.browserDailyEvents} per browser per day.</p>
    </section>
  </div>;
}
function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <div className="analytics-panel analytics-metric"><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>;
}
function CountTable({title,rows,subtitle}:{title:string;rows:[string,number][];subtitle:string}) {
  return <section className="analytics-panel"><h2>{title}</h2><p className="analytics-caption">{subtitle}</p><table className="analytics-table"><thead><tr><th scope="col">Category</th><th scope="col">Views</th></tr></thead><tbody>{rows.map(([name,count]) => <tr key={name}><th scope="row">{label(name)}</th><td>{number(count)}</td></tr>)}{!rows.length ? <tr><td colSpan={2}>No recorded views.</td></tr> : null}</tbody></table></section>;
}
function recentDays(report:ActivityReport) {
  const end=Date.parse(report.end+"T00:00:00Z");
  const start=end-29*86400000;
  const rows=report.daily.filter(row=>Date.parse(row.day)>=start && Date.parse(row.day)<=end).sort((a,b)=>a.day.localeCompare(b.day));
  const ticks=[0,7,14,21,29].map(offset=>new Date(start+offset*86400000).toISOString().slice(0,10));
  const days=Array.from({length:30},(_,i)=>new Date(start+i*86400000).toISOString().slice(0,10));
  return {start,rows,ticks,days};
}
function ActivityTrend({report}:{report:ActivityReport}) {
  const [selected,setSelected]=useState<string | null>(null);
  const [table,setTable]=useState(false);
  const [detailPage,setDetailPage]=useState(0);
  const {start,rows,ticks,days}=recentDays(report);
  const selectedRow=selected ? rows.find(row=>row.day===selected) : rows.at(-1);
  const detailPages=Math.max(1,Math.ceil(days.length/7));
  const pageEnd=days.length-detailPage*7;
  const detailDays=days.slice(Math.max(0,pageEnd-7),pageEnd);

  const peak=Math.max(1,...rows.map(row=>row.visitors));
  const barStep=504/30;
  const x=(day:string)=>48+((Date.parse(day)-start)/86400000+.5)*barStep;
  const y=(value:number)=>288-value/peak*244;
  return <section className="analytics-panel analytics-trend" data-table-open={table}><div className="analytics-section-heading"><h2 title="Last 30 UTC days">Daily visitors</h2></div>
    <>
      <div className="analytics-point" aria-live="polite">{selectedRow ? <><strong>{number(selectedRow.visitors)}</strong> visitors on {selectedRow.day}{selectedRow.limited ? " · Incomplete collection" : ""}</> : `No data${selected ? " on " + selected : " in the last 30 days"}.`}</div>
      <svg viewBox="0 0 600 340" role="group" aria-label="Daily visitors over the last 30 UTC days">
        {[0,.5,1].map(t=><g key={t}><line x1="48" y1={y(peak*t)} x2="552" y2={y(peak*t)} stroke="currentColor" opacity=".12"/><text x="35" y={y(peak*t)+4} textAnchor="end" fill="currentColor" fontSize="12">{Number((peak*t).toFixed(1))}</text></g>)}

        {rows.map(row=><g key={row.day}>
          <rect x={x(row.day)-barStep/2} y="35" width={barStep} height="253" fill="#bba2ff" opacity={selectedRow?.day===row.day ? .1 : 0} />
          <rect x={x(row.day)-barStep*.34} y={y(row.visitors)} width={barStep*.68} height={288-y(row.visitors)} rx="2" fill={row.limited ? "#f3d398" : "#bba2ff"} pointerEvents="none" />
          <rect className="analytics-column-target" x={x(row.day)-barStep/2} y="35" width={barStep} height="253" fill="transparent" tabIndex={0} role="button" aria-label={`${row.day}: ${row.visitors} visitors${row.limited ? ", incomplete collection" : ""}`} onFocus={()=>setSelected(row.day)} onPointerEnter={()=>setSelected(row.day)} onPointerMove={()=>setSelected(row.day)} onClick={()=>setSelected(row.day)} onKeyDown={event=>{if(event.key==="Enter" || event.key===" "){event.preventDefault();setSelected(row.day);}}}><title>{row.day}: {row.visitors} visitors</title></rect>
        </g>)}

        {days.filter(day=>!rows.some(item=>item.day===day)).map(day=><g key={day}>
          <rect x={x(day)-barStep/2} y="35" width={barStep} height="253" fill="#bba2ff" opacity={selected===day ? .1 : 0} pointerEvents="none"/>
          <rect className="analytics-column-target" x={x(day)-barStep/2} y="35" width={barStep} height="253" fill="transparent" tabIndex={0} role="button" aria-label={`${day}: No data`} onPointerEnter={()=>setSelected(day)} onPointerMove={()=>setSelected(day)} onFocus={()=>setSelected(day)} onClick={()=>setSelected(day)} onKeyDown={event=>{if(event.key==="Enter" || event.key===" "){event.preventDefault();setSelected(day);}}}><title>{day}: No data</title></rect>
        </g>)}
        {ticks.map(day=><text key={day} x={x(day)} y="322" textAnchor="middle" fill="currentColor" fontSize="12">{day.slice(5)}</text>)}
      </svg>

      <button type="button" className="analytics-text-button" aria-expanded={table} onClick={()=>setTable(!table)}>{table ? "Hide" : "Show"} daily table</button>
      <div className="analytics-daily-drawer" aria-hidden={!table} inert={!table}><div className="analytics-daily-drawer-inner">
        <div className="analytics-detail-heading"><h3>Daily detail</h3><div className="analytics-detail-navigation"><button type="button" aria-label="Previous seven days" disabled={detailPage>=detailPages-1} onClick={()=>setDetailPage(page=>page+1)}>‹</button><button type="button" aria-label="Next seven days" disabled={detailPage===0} onClick={()=>setDetailPage(page=>page-1)}>›</button></div></div>
        <p className="analytics-caption">{detailDays[0]} to {detailDays.at(-1)} (UTC)</p>
        <table className="analytics-table analytics-detail-table"><thead><tr><th scope="col">Day</th><th scope="col">Visitors</th><th scope="col">Engaged</th><th scope="col">Collection</th></tr></thead><tbody>{detailDays.map(day=>{const row=rows.find(item=>item.day===day);return <tr key={day}><th scope="row">{day.slice(5)}</th><td>{row?.visitors ?? "No data"}</td><td>{row?.active ?? "No data"}</td><td>{row ? row.limited ? "Incomplete" : "No limit" : "No data"}</td></tr>;})}</tbody></table>
      </div></div>
    </>
  </section>;
}
function ApplicationsTrend({report}:{report:ActivityReport}) {
  const {start,rows,ticks,days}=recentDays(report);
  const [selected,setSelected]=useState<string | null>(null);
  const row=selected ? rows.find(item=>item.day===selected) : rows.at(-1);
  const available=rows.every(item=>item.internshipClicks!==undefined && item.newGradClicks!==undefined);
  const step=504/30;
  const x=(day:string)=>48+((Date.parse(day)-start)/86400000+.5)*step;
  const peak=Math.max(1,...rows.map(item=>(item.internshipClicks ?? 0)+(item.newGradClicks ?? 0)));
  const y=(value:number)=>288-value/peak*244;
  return <section className="analytics-panel analytics-applications"><h2 title="Last 30 UTC days">Applications opened</h2>

    <div className="analytics-chart-legend"><span><i style={{background:"#bba2ff"}} />Internships</span><span><i style={{background:"#54c9b6"}} />New grad / early career</span></div>
    {available ? <>{row ? <div className="analytics-point analytics-openings-stats" aria-live="polite" title={`${row.day}${row.limited ? ": incomplete collection" : ""}. Includes repeat employer-link openings; private-tracker openings excluded.`}><span><strong>{number((row.internshipClicks ?? 0)+(row.newGradClicks ?? 0))}</strong> total</span><span><strong>{number(row.internshipClicks ?? 0)}</strong> internships</span><span><strong>{number(row.newGradClicks ?? 0)}</strong> fulltime</span></div> : <div className="analytics-point" aria-live="polite">No data{selected ? ` on ${selected}` : ""}.</div>}

    <svg viewBox="0 0 600 340" role="group" aria-label="Daily employer-link openings by board">
      {[0,.5,1].map(t=><g key={t}><line x1="48" x2="552" y1={y(peak*t)} y2={y(peak*t)} stroke="currentColor" opacity=".12"/><text x="35" y={y(peak*t)+4} textAnchor="end" fill="currentColor" fontSize="12">{Number((peak*t).toFixed(1))}</text></g>)}
      {rows.map(item=>{const internships=item.internshipClicks ?? 0; const total=internships+(item.newGradClicks ?? 0); return <g key={item.day}>
        <rect x={x(item.day)-step/2} y="35" width={step} height="253" fill="#bba2ff" opacity={row?.day===item.day ? .1 : 0}/>
        <rect x={x(item.day)-step*.34} y={y(internships)} width={step*.68} height={288-y(internships)} fill="#bba2ff" pointerEvents="none"/>
        <rect x={x(item.day)-step*.34} y={y(total)} width={step*.68} height={y(internships)-y(total)} fill="#54c9b6" pointerEvents="none"/>
        <rect className="analytics-column-target" x={x(item.day)-step/2} y="35" width={step} height="253" fill="transparent" tabIndex={0} role="button" aria-label={`${item.day}: ${internships} internships, ${item.newGradClicks} new grad / early career openings${item.limited ? ", incomplete collection" : ""}`} onPointerEnter={()=>setSelected(item.day)} onPointerMove={()=>setSelected(item.day)} onFocus={()=>setSelected(item.day)} onClick={()=>setSelected(item.day)} onKeyDown={event=>{if(event.key==="Enter" || event.key===" "){event.preventDefault();setSelected(item.day);}}}><title>{item.day}: {internships} internships, {item.newGradClicks} new grad / early career</title></rect>
      </g>;})}

        {days.filter(day=>!rows.some(item=>item.day===day)).map(day=><g key={day}>
          <rect x={x(day)-step/2} y="35" width={step} height="253" fill="#bba2ff" opacity={selected===day ? .1 : 0} pointerEvents="none"/>
          <rect className="analytics-column-target" x={x(day)-step/2} y="35" width={step} height="253" fill="transparent" tabIndex={0} role="button" aria-label={`${day}: No data`} onPointerEnter={()=>setSelected(day)} onPointerMove={()=>setSelected(day)} onFocus={()=>setSelected(day)} onClick={()=>setSelected(day)} onKeyDown={event=>{if(event.key==="Enter" || event.key===" "){event.preventDefault();setSelected(day);}}}><title>{day}: No data</title></rect>
        </g>)}
      {ticks.map(day=><text key={day} x={x(day)} y="322" textAnchor="middle" fill="currentColor" fontSize="12">{day.slice(5)}</text>)}
    </svg></> : <p className="analytics-caption">{rows.length ? "Daily board counts are unavailable in this report. The collector update is required." : "No retained daily observations for this period."}</p>}
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
