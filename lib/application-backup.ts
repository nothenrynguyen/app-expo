import { parseApplications, type Application } from "./applications";

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
export function createApplicationBackup(applications: readonly Application[], now = new Date()) {
  return JSON.stringify({ format: "app-expo-applications", version: 1, exportedAt: now.toISOString(), applications }, null, 2);
}
export function readApplicationBackup(raw: string): readonly Application[] {
  if (new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES) throw new Error("Backup is too large. The limit is 5 MB.");
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error("This file is not valid JSON."); }
  if (!value || value.format !== "app-expo-applications" || value.version !== 1 || !Array.isArray(value.applications)) throw new Error("Choose an App Expo application backup with version 1.");
  if (value.applications.length > 10000) throw new Error("Backup exceeds the 10,000 application limit.");
  const applications = parseApplications(JSON.stringify(value.applications));
  if (applications.length !== value.applications.length) throw new Error("Backup contains invalid records or repeated IDs. Nothing was imported.");
  return applications;
}
export function mergeApplicationBackup(existing: readonly Application[], incoming: readonly Application[]) {
  const ids = new Set(existing.map((record) => record.id));
  const jobs = new Set(existing.map((record) => record.jobId).filter(Boolean));
  const added: Application[] = [];
  for (const record of incoming) {
    if (ids.has(record.id) || (record.jobId && jobs.has(record.jobId))) continue;
    added.push(record); ids.add(record.id);
    if (record.jobId) jobs.add(record.jobId);
  }
  return { applications: [...existing, ...added], added: added.length, skipped: incoming.length - added.length };
}
