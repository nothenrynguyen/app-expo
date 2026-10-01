"use client";
import { useEffect, useRef, useState } from "react";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/application-status";
import { importSavedApplications, safeApplicationUrl, validApplicationDate, type Application } from "@/lib/applications";
import { parseSavedJobDetails, SAVED_DETAILS_KEY } from "@/lib/saved-job-details";
import { parseSavedJobIds, SAVED_JOBS_STORAGE_KEY } from "@/lib/saved-jobs";
import { useApplications } from "../useApplications";
import { useApplicationStatuses } from "../useApplicationStatuses";
import { ApplicationBackups } from "./ApplicationBackups";
import { TrackerSavedJobs } from "./TrackerSavedJobs";

const blank = () => ({ company: "", title: "", location: "", url: "", status: "Applied" as ApplicationStatus, appliedOn: "", notes: "" });
export function ApplicationTracker() {
  const { applications, change } = useApplications();
  const { statuses, update } = useApplicationStatuses();
  const [editing, setEditing] = useState<Application | null>(null);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("All");
  const [editorOpen, setEditorOpen] = useState(false);
  const [view, setView] = useState<"applications" | "saved">("applications");
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editorOpen) {
      editor.current?.scrollIntoView({ block: "nearest" });
      editor.current?.querySelector("input")?.focus({ preventScroll: true });
    }
  }, [editorOpen, editing]);
  const effectiveStatus = (record: Application) => record.jobId ? statuses[record.jobId] ?? record.status : record.status;
  const importSaved = () => {
      try {
        const details = parseSavedJobDetails(window.localStorage.getItem(SAVED_DETAILS_KEY));
        const ids = new Set(parseSavedJobIds(window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY)));
        const success = change((current) => importSavedApplications(current, details, ids, statuses));
        setMessage(success ? "Available saved jobs added. Existing tracker records were kept. Saved jobs without retained details cannot be imported yet." : "Could not save. Check browser storage.");
      } catch { setMessage("Could not read saved jobs. Check browser storage."); }
  };
  return <section className="application-tracker">
    <div className="tracker-toolbar"><div className="tracker-view-switch" role="group" aria-label="Record list"><button type="button" aria-pressed={view === "applications"} onClick={() => setView("applications")}>Applications <span>{applications.length}</span></button><button type="button" aria-pressed={view === "saved"} onClick={() => setView("saved")}>Saved jobs</button></div><div className="tracker-toolbar-actions"><button type="button" className="button primary" aria-expanded={editorOpen} aria-controls="application-editor" onClick={() => { setEditing(null); setForm(blank()); setEditorOpen(true); }}>Add application</button><details className="tracker-backup-menu"><summary>Manage records</summary><ApplicationBackups /><button type="button" className="button secondary" onClick={importSaved}>Import saved jobs</button></details></div></div>
    {editorOpen ? <div id="application-editor" ref={editor} className="tracker-editor">
    <h2>{editing ? "Edit application" : "Add an application"}</h2>
    <p>Add existing applications or jobs you found outside App Expo. An application date is optional; enter the date you actually applied.</p>
    <form className="application-form" onSubmit={(event) => {
      event.preventDefault();
      const url = safeApplicationUrl(form.url);
      if (!form.company.trim() || url === null || !validApplicationDate(form.appliedOn)) { setMessage("Enter a company, a valid date, and an HTTP or HTTPS link without credentials if provided."); return; }
      const record: Application = { ...form, company: form.company.trim(), title: form.title.trim(), url, id: editing?.id ?? crypto.randomUUID(), origin: editing?.origin ?? "manual", ...(editing?.jobId ? { jobId: editing.jobId } : {}) };
      if (!change((current) => [...current.filter((item) => item.id !== record.id), record])) { setMessage("Could not save. Your form is still here. Check browser storage."); return; }
      const synced = !record.jobId || update(record.jobId, record.status);
      setMessage(synced ? "Application saved in this browser." : "Tracker record saved, but the board status could not be updated. Please retry editing the record.");
      setEditing(null); setForm(blank()); setEditorOpen(false);
    }}>
      <label>Company<input required maxLength={300} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
      <label>Location<input maxLength={500} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
      <label>Position (optional)<input maxLength={500} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label>Job link (optional)<input type="url" maxLength={2000} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></label>
      <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}>{APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
      <label>Application date (optional)<input type="date" value={form.appliedOn} onInput={(e) => { const appliedOn = e.currentTarget.value; setForm((current) => ({ ...current, appliedOn })); }} onChange={(e) => { const appliedOn = e.target.value; setForm((current) => ({ ...current, appliedOn })); }} /></label>
      <label className="application-notes">Notes (optional)<textarea maxLength={5000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
      <button className="button primary" type="submit">{editing ? "Save changes" : "Add application"}</button>
      <button className="button secondary" type="button" onClick={() => { setEditing(null); setForm(blank()); setEditorOpen(false); }}>Cancel</button>
      {editing ? <button className="button secondary" type="button" onClick={() => {
        if (!window.confirm(`Delete the application at ${editing.company}? Saved jobs are unchanged.`)) return;
        if (!change((current) => current.filter((record) => record.id !== editing.id))) { setMessage("Could not delete. Check browser storage."); return; }
        setEditing(null); setForm(blank()); setEditorOpen(false); setMessage("Application deleted.");
      }}>Delete application</button> : null}
    </form></div> : null}
    <p role="status">{message}</p>
    {view === "saved" ? <TrackerSavedJobs /> : <>
    <div className="tracker-status-tabs" role="group" aria-label="Filter applications by status">{["All", ...APPLICATION_STATUSES].map((status) => <button key={status} type="button" aria-pressed={filter === status} onClick={() => setFilter(status)}>{status}</button>)}</div>
    <div className="application-list application-table-scroll">
    <table className="application-table"><caption className="sr-only">Application records</caption><thead><tr><th scope="col">Company</th><th scope="col">Position</th><th scope="col">Location</th><th scope="col">Status</th><th scope="col">Edit</th></tr></thead><tbody>
    {applications.filter((record) => filter === "All" || effectiveStatus(record) === filter).map((record) => <tr key={record.id}>
      <td className="application-company">{record.company}</td><td className="application-position">{record.title || <span className="tracker-hint">Not set</span>}</td><td className="application-location">{record.location || <span className="tracker-hint">Not set</span>}</td>
      <td><select data-status={effectiveStatus(record)} aria-label={`Status for ${record.company}${record.title ? `, ${record.title}` : ""}`} value={effectiveStatus(record)} onChange={(event) => {
        const status = event.target.value as ApplicationStatus;
        if (!change((current) => current.map((item) => item.id === record.id ? { ...item, status } : item))) { setMessage("Could not save the status. Check browser storage."); return; }
        const synced = !record.jobId || update(record.jobId, status);
        setMessage(synced ? "Status updated." : "Record saved, but its saved-job status could not update. Please retry.");
      }}>{APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td>
      <td><button type="button" className="application-edit" onClick={() => { setEditing(record); setForm({ ...record, location: record.location ?? "", status: effectiveStatus(record) }); setEditorOpen(true); }}>Edit<span className="sr-only"> {record.company}{record.title ? `, ${record.title}` : ""}</span></button></td>
    </tr>)}
    {!applications.length ? <tr><td colSpan={5} className="application-table-empty">No applications yet. Add an application to get started.</td></tr> : applications.every((record) => filter !== "All" && effectiveStatus(record) !== filter) ? <tr><td colSpan={5} className="application-table-empty">No applications match this status.</td></tr> : null}
    </tbody></table>
    </div></>}
  </section>;
}
