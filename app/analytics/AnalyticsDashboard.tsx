"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { activityConfigured, activityEndpoint, setOwnerExclusion } from "@/lib/activity-client";
import type { ActivityReport } from "@/lib/activity-contract";
import type { JobsSummary } from "@/lib/job-summary";
import { SourceHealthSummary } from "../SourceHealthSummary";

const number = (value: number) => value.toLocaleString("en-US");
const percent = (n: number, d: number) => d ? `${(100 * n / d).toFixed(1)}%` : "No data";
const label = (value: string) => value.replaceAll("_", " ");
const ranges = { "7d": "Last 7 days", "30d": "Last 30 days", month: "This month", all: "All time" } as const;

export function AnalyticsDashboard() {
  const [draft, setDraft] = useState("");
  const [range, setRange] = useState<ActivityReport["range"]>("30d");
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
      if (response.status === 401 || response.status === 403) { token.current = ""; setUnlocked(false); throw new Error("Owner access could not be verified. Check the access key."); }
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

  return <section className="analytics-shell">
    <div className="analytics-heading"><div><p className="eyebrow">Owner workspace</p><h1>Site activity.</h1><p>See what brings people here, what they use, and where to improve.</p></div><span className="analytics-private">Private reports</span></div>
    <label className="analytics-exclusion"><input type="checkbox" checked={excluded} onChange={(event) => { setExcluded(event.target.checked); setOwnerExclusion(event.target.checked); }} />Exclude this browser from activity collection</label>
    {!activityConfigured ? <div className="analytics-panel analytics-empty"><h2>Analytics is not connected yet.</h2><p>The dashboard is ready for the private collector. Activity totals will appear after setup and the first consenting visit.</p><p>No historical interactions have been reconstructed.</p></div> : null}
    {activityConfigured && !unlocked ? <form className="analytics-panel analytics-access" onSubmit={connect}><h2>Open your reports</h2><p>Reports require an owner access key. The key stays in this tab&apos;s memory and is cleared when you lock or reload the dashboard.</p><label>Owner access key<input type="password" autoComplete="off" spellCheck={false} required minLength={43} maxLength={128} value={draft} onChange={(event) => setDraft(event.target.value)} /></label><button className="button primary" disabled={loading}>{loading ? "Connecting..." : "Open dashboard"}</button></form> : null}
    <p role="status" aria-live="polite">{message}</p>
    {unlocked ? <div className="analytics-toolbar"><label>Date range<select value={range} disabled={loading} onChange={(event) => { const value = event.target.value as ActivityReport["range"]; setRange(value); void loadReport(token.current, value); }}>{Object.entries(ranges).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label><div><button type="button" className="button secondary" disabled={loading} onClick={() => void loadReport(token.current, range)}>{loading ? "Loading..." : "Refresh"}</button><button type="button" className="button secondary" onClick={lock}>Lock dashboard</button></div></div> : null}
    {report ? <ReportContent report={report} /> : null}
  </section>;
}

function ReportContent({ report }: { report: ActivityReport }) {
  const events = (name: string) => report.breakdown.filter((row) => row.name === name).reduce((sum, row) => sum + row.count, 0);
  const filters = report.breakdown.filter((row) => row.name === "filter_use");
  const filterCount = events("filter_use");
  const zeroCount = filters.filter((row) => row.dimension.endsWith(":zero")).reduce((sum, row) => sum + row.count, 0);
  const pageviews = report.breakdown.filter((row) => row.name === "page_view");
  const breakdown = (dimension: "source" | "device" | "board") => {
    const counts = new Map<string, number>();
    for (const row of pageviews) {
      if (dimension === "board" && row.board === "none") continue;
      const key = dimension === "board" ? row.board : row.dimension.split(":")[dimension === "source" ? 0 : 1];
      counts.set(key, (counts.get(key) ?? 0) + row.count);
    }
    return [...counts].sort((a, b) => b[1] - a[1]);
  };
  const categories = new Map<string, number>();
  for (const row of filters) { const category = row.dimension.split(":")[0]; categories.set(category, (categories.get(category) ?? 0) + row.count); }
  const reach: [string, number][] = [["Visited", report.totals.visitors], ["Browsed a board", report.totals.browsed], ["Opened an employer link", report.totals.applied]];
  const adoption: [string, number][] = [["Saved a job", report.totals.saved], ["Used a filter", report.totals.filtered], ["Added applications", report.totals.tracked]];
  return <>
    <div className="analytics-period"><span>{report.start} to {report.end} (UTC)</span><span>Updated {new Date(report.generatedAt).toLocaleString()}</span></div>
    {!report.trackingSince ? <div className="analytics-panel analytics-empty"><h2>Waiting for the first consenting visit.</h2><p>Empty reports do not mean there have been no visitors. Collection starts after activation and permission.</p></div> : null}
    {report.daily.some((row) => row.limited) ? <p className="analytics-warning" role="status">Some days reached a collection safety limit. Counts for those days are incomplete.</p> : null}
    <div className="analytics-metrics">
      <Metric title="Visitors" value={number(report.totals.visitors)} detail="Distinct observed browser identities" />
      <Metric title="Active visitors" value={number(report.totals.active)} detail="Took at least one measured action" />
      <Metric title="Employer-link clicks" value={number(events("apply_click"))} detail="Outbound clicks, not submissions" />
      <Metric title="Returning visitors" value={percent(report.totals.returning, report.totals.visitors)} detail={`${number(report.totals.returning)} observed on an earlier day`} />
    </div>
    <ActivityTrend report={report} />
    <div className="analytics-grid">
      <CountTable title="Engagement reach" rows={reach} subtitle="Distinct browsers at each stage. These are overlapping groups, not an ordered conversion funnel." />
      <CountTable title="Feature adoption" rows={adoption} subtitle="Distinct browsers using each feature. Bulk additions count as one action." />
      <CountTable title="Boards" rows={breakdown("board")} subtitle="Page views, including repeat visits." />
      <CountTable title="Traffic sources" rows={breakdown("source")} subtitle="Broad categories from page-view referrers. Missing sources remain unknown." />
      <CountTable title="Device types" rows={breakdown("device")} subtitle="Coarse estimates from browser information." />
      <CountTable title="Filter activity" rows={[...categories].sort((a, b) => b[1] - a[1])} subtitle={`Zero-result filter uses: ${percent(zeroCount, filterCount)} (${number(zeroCount)} of ${number(filterCount)}). Changes are debounced and counted per category.`} />
    </div>
    <BoardHealth />
    <details className="analytics-panel analytics-definitions"><summary>Definitions and measurement limits</summary><p>Only consenting visitors without blocking privacy signals are measured. Ad blockers, disabled JavaScript, bots, outages and free-tier limits can leave gaps. Browser identities expire after 180 days, and different devices or cleared storage may count again.</p><p>Active means a filter use, save, unsave, employer-link click or application-add action. Returning means the browser identity was seen on an earlier UTC day. Monthly and period totals deduplicate across days; they are not sums of daily visitors.</p><p>All-time means since this collector began. The daily chart shows up to the last 90 days. Daily counts and lifetime feature flags are retained, while daily cleanup is configured to remove per-browser detail older than 90 days. Cleanup failures can delay removal. An application-add event records the use of the feature, never its contents or a verified submission.</p><p>Tracking began: {report.trackingSince ?? "Not yet"}. Last accepted event: {report.lastReceivedAt ?? "None"}. Safety limits: {number(report.limits.dailyEvents)} events/day and {report.limits.browserDailyEvents} per browser/day. A missing day can reflect no collection, not necessarily no traffic.</p></details>
    <button type="button" className="button secondary" onClick={() => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = `empluzzed-activity-${report.range}-${report.end}.json`; a.click(); URL.revokeObjectURL(url);
    }}>Download this report</button>
  </>;
}
function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <div className="analytics-panel analytics-metric"><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>;
}
function CountTable({ title, rows, subtitle }: { title: string; rows: [string, number][]; subtitle: string }) {
  return <section className="analytics-panel"><h2>{title}</h2><p className="analytics-caption">{subtitle}</p><table className="analytics-table"><caption className="sr-only">{title}</caption><thead><tr><th scope="col">Category</th><th scope="col">Count</th></tr></thead><tbody>{rows.map(([name, count]) => <tr key={name}><th scope="row">{label(name)}</th><td>{number(count)}</td></tr>)}{!rows.length ? <tr><td colSpan={2}>No activity recorded in this period.</td></tr> : null}</tbody></table></section>;
}
function ActivityTrend({ report }: { report: ActivityReport }) {
  const peak = Math.max(1, ...report.daily.map((row) => row.visitors));
  const width = 900, height = 180;
  const points = (field: "visitors" | "active") => report.daily.map((row, i) => `${20 + i * (width - 40) / Math.max(1, report.daily.length - 1)},${height - 20 - row[field] / peak * (height - 40)}`).join(" ");
  return <section className="analytics-panel analytics-trend"><div className="analytics-section-heading"><h2>Daily activity</h2><span>Visitors <i className="analytics-legend visitors" /> Active <i className="analytics-legend active" /></span></div>{report.daily.length ? <><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily visitors and active visitors. Exact counts are available in the daily totals table."><line x1="20" y1="160" x2="880" y2="160" stroke="currentColor" opacity=".2" /><polyline points={points("visitors")} fill="none" stroke="#bba2ff" strokeWidth="3" /><polyline points={points("active")} fill="none" stroke="#73dfba" strokeWidth="3" />{report.daily.length === 1 ? <circle cx="20" cy={height - 20 - report.daily[0].visitors / peak * (height - 40)} r="4" fill="#bba2ff" /> : null}</svg><div className="analytics-chart-dates"><span>{report.daily[0].day}</span><span>{report.daily.at(-1)?.day}</span></div></> : <p className="analytics-caption">The chart will appear when activity is recorded.</p>}<details><summary>Daily totals</summary><div className="analytics-table-scroll"><table className="analytics-table"><caption className="sr-only">Daily visitor and action totals</caption><thead><tr><th scope="col">UTC day</th><th scope="col">Visitors</th><th scope="col">Active</th><th scope="col">Events</th><th scope="col">Collection</th></tr></thead><tbody>{report.daily.map((row) => <tr key={row.day}><th scope="row">{row.day}</th><td>{number(row.visitors)}</td><td>{number(row.active)}</td><td>{number(row.events)}</td><td>{row.limited ? "Safety limit reached" : "No recorded safety limit"}</td></tr>)}</tbody></table></div></details><p className="analytics-caption">Observed days only. All-time view shows the most recent 90 days; missing collection days are not filled with invented zeroes.</p></section>;
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
