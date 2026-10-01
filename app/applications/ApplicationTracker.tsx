"use client";
import { useState } from "react";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/application-status";
import { importSavedApplications, safeApplicationUrl, validApplicationDate, type Application } from "@/lib/applications";
import { parseSavedJobDetails, SAVED_DETAILS_KEY } from "@/lib/saved-job-details";
import { parseSavedJobIds, SAVED_JOBS_STORAGE_KEY } from "@/lib/saved-jobs";
import { useApplications } from "../useApplications";
import { useApplicationStatuses } from "../useApplicationStatuses";

const blank = () => ({ company: "", title: "", url: "", status: "Applied" as ApplicationStatus, appliedOn: "", notes: "" });
export function ApplicationTracker() {
  const { applications, change } = useApplications();
  const { statuses, update } = useApplicationStatuses();
  const [editing, setEditing] = useState<Application | null>(null);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("All");
  const effectiveStatus = (record: Application) => record.jobId ? statuses[record.jobId] ?? record.status : record.status;
  return <section className="application-tracker">
    <button type="button" className="button secondary" onClick={() => {
      try {
        const details = parseSavedJobDetails(window.localStorage.getItem(SAVED_DETAILS_KEY));
        const ids = new Set(parseSavedJobIds(window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY)));
        const success = change((current) => importSavedApplications(current, details, ids, statuses));
        setMessage(success ? "Available saved jobs added. Existing tracker records were kept. Saved jobs without retained details cannot be imported yet." : "Could not save. Check browser storage.");
      } catch { setMessage("Could not read saved jobs. Check browser storage."); }
    }}>Add saved jobs to tracker</button>
    <h2>{editing ? "Edit application" : "Add an application"}</h2>
    <p>Add existing applications or jobs you found outside App Expo. An application date is optional; enter the date you actually applied.</p>
    <form className="application-form" onSubmit={(event) => {
      event.preventDefault();
      const url = safeApplicationUrl(form.url);
      if (!form.company.trim() || !form.title.trim() || url === null || !validApplicationDate(form.appliedOn)) { setMessage("Enter a company and position, a valid date, and an HTTP or HTTPS link without credentials if provided."); return; }
      const record: Application = { ...form, company: form.company.trim(), title: form.title.trim(), url, id: editing?.id ?? crypto.randomUUID(), origin: editing?.origin ?? "manual", ...(editing?.jobId ? { jobId: editing.jobId } : {}) };
      if (!change((current) => [...current.filter((item) => item.id !== record.id), record])) { setMessage("Could not save. Your form is still here. Check browser storage."); return; }
      const synced = !record.jobId || update(record.jobId, record.status);
      setMessage(synced ? "Application saved in this browser." : "Tracker record saved, but the board status could not be updated. Please retry editing the record.");
      setEditing(null); setForm(blank());
    }}>
      <label>Company<input required maxLength={300} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
      <label>Position<input required maxLength={500} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label>Job link (optional)<input type="url" maxLength={2000} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></label>
      <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}>{APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
      <label>Application date (optional)<input type="date" value={form.appliedOn} onInput={(e) => { const appliedOn = e.currentTarget.value; setForm((current) => ({ ...current, appliedOn })); }} onChange={(e) => { const appliedOn = e.target.value; setForm((current) => ({ ...current, appliedOn })); }} /></label>
      <label className="application-notes">Notes (optional)<textarea maxLength={5000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
      <button className="button primary" type="submit">{editing ? "Save changes" : "Add application"}</button>
      {editing ? <button className="button secondary" type="button" onClick={() => { setEditing(null); setForm(blank()); }}>Cancel editing</button> : null}
    </form>
    <p role="status">{message}</p>
    <label className="saved-status-filter">Filter applications<select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All</option>{APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
    {applications.filter((record) => filter === "All" || effectiveStatus(record) === filter).map((record) => <article className="tracker-record" key={record.id}>
      <h2>{record.title}</h2><p>{record.company} · {effectiveStatus(record)} · {record.origin === "manual" ? "Added manually" : "From App Expo"}</p>
      {record.appliedOn ? <p>Applied on {record.appliedOn}</p> : null}
      {record.notes ? <p className="tracker-notes">{record.notes}</p> : null}
      {record.url ? <a href={record.url} target="_blank" rel="noreferrer">Open job link</a> : null}
      <button type="button" className="button secondary" onClick={() => { setEditing(record); setForm({ ...record, status: effectiveStatus(record) }); }}>Edit<span className="sr-only"> {record.title} at {record.company}</span></button>
      <button type="button" className="button secondary" onClick={() => {
        if (!window.confirm(`Remove ${record.title} at ${record.company} from the tracker? Saved jobs on the board are unchanged.`)) return;
        setMessage(change((current) => current.filter((item) => item.id !== record.id)) ? "Application removed." : "Could not remove. Check browser storage.");
        if (editing?.id === record.id) { setEditing(null); setForm(blank()); }
      }}>Remove<span className="sr-only"> {record.title} at {record.company}</span></button>
    </article>)}
    {!applications.length ? <p>No applications yet. Add one above or import your saved jobs.</p> : applications.every((record) => filter !== "All" && effectiveStatus(record) !== filter) ? <p>No applications match this status.</p> : null}
  </section>;
}
