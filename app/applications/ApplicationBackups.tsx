"use client";
import { useRef, useState } from "react";
import { createApplicationBackup, MAX_BACKUP_BYTES, mergeApplicationBackup, readApplicationBackup } from "@/lib/application-backup";
import type { Application } from "@/lib/applications";
import { useApplications } from "../useApplications";
import { useApplicationStatuses } from "../useApplicationStatuses";

export function ApplicationBackups() {
  const { applications, change } = useApplications();
  const { statuses } = useApplicationStatuses();
  const [incoming, setIncoming] = useState<readonly Application[] | null>(null);
  const [message, setMessage] = useState("");
  const selection = useRef(0);
  const preview = incoming ? mergeApplicationBackup(applications, incoming) : null;
  return <section className="application-backups" aria-label="Application backups">
    <h2>Back up your applications</h2>
    <p>Download a JSON file to recover records or move them to another browser. It contains your links and notes in plain text, so keep it private. Only tracker records are included; board saves and analytics preferences are separate.</p>
    <button className="button secondary" type="button" disabled={!applications.length} onClick={() => {
      try {
        const records = applications.map((record) => ({ ...record, status: record.jobId ? statuses[record.jobId] ?? record.status : record.status }));
        const backup = createApplicationBackup(records);
        if (new TextEncoder().encode(backup).length > MAX_BACKUP_BYTES) { setMessage("Backup exceeds the 5 MB import limit. Shorten large notes before exporting."); return; }
        const url = URL.createObjectURL(new Blob([backup], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url; link.download = `app-expo-applications-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage("Backup download requested. Keep the file somewhere safe.");
      } catch { setMessage("Could not create the backup. Your records are unchanged."); }
    }}>Download backup</button>
    <label className="backup-file">Choose a backup to preview<input type="file" accept=".json,application/json" onChange={async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      const request = ++selection.current;
      setIncoming(null); setMessage("");
      if (!file) return;
      try {
        if (file.size > MAX_BACKUP_BYTES) throw new Error("Backup is too large. The limit is 5 MB.");
        const records = readApplicationBackup(await file.text());
        if (request === selection.current) setIncoming(records);
      } catch (error) { if (request === selection.current) setMessage(error instanceof Error ? error.message : "Could not read this backup."); }
    }} /></label>
    {preview && incoming ? <div>
      <h3>Import preview</h3>
      <p>{preview.added} new records. {preview.skipped} duplicates skipped. Existing records win when record IDs or App Expo job IDs match. Different manual IDs are kept, even if company and position match. Existing board statuses also take precedence.</p>
      <ul>{incoming.slice(0, 10).map((record) => <li key={record.id}>{record.company}: {record.title} ({record.status})</li>)}</ul>
      {incoming.length > 10 ? <p>Showing the first 10 of {incoming.length} records.</p> : null}
      <button type="button" className="button primary" disabled={!preview.added} onClick={() => {
        let added = 0;
        const success = change((current) => { const merged = mergeApplicationBackup(current, incoming); added = merged.added; return merged.applications; });
        setMessage(success ? `Imported ${added} records. Existing records were preserved.` : "Could not save the import. Your existing records are unchanged; check browser storage and try again.");
        if (success) setIncoming(null);
      }}>Import new records</button>
      <button type="button" className="button secondary" onClick={() => { selection.current++; setIncoming(null); setMessage("Import cancelled. Your records are unchanged."); }}>Cancel import</button>
    </div> : null}
    <p role="status">{message}</p>
  </section>;
}
