import { employerBoardIdentity } from "./reviewed-employer-coverage";
import { sourceVerificationKey } from "./source-verification";
import type { PublicJob } from "../jobs";
import type { BoardRefreshDiagnostic } from "./types";
export type WorkdayCheck = {url: string; status: "live" | "unknown" | "closed" | "ineligible"};
export type WorkdayContinuity = Record<string, {checkedAt: string; job: PublicJob}>;
export function workdayEvidenceKey(url: string) {
  const board = employerBoardIdentity(url);
  const identity = sourceVerificationKey(url);
  return board?.startsWith("workday:") && identity ? `${board}|${identity}` : null;
}
export function recentWorkdayEvidence(cache: WorkdayContinuity, now: Date): WorkdayContinuity {
  return Object.fromEntries(Object.entries(cache).filter(([key, entry]) => {
    const age = now.getTime() - Date.parse(entry.checkedAt);
    return key === workdayEvidenceKey(entry.job.applyUrl) && age >= 0 && age < 24 * 60 * 60_000;
  }));
}
export function workdayRecoveryPolicy(records: BoardRefreshDiagnostic[], checks: WorkdayCheck[], cache: WorkdayContinuity, now: Date) {
  const recent = recentWorkdayEvidence(cache, now);
  const failed = new Set(records.filter(r => r.provider === "workday" && r.status === "failed" && r.id && !/^(404|410)\b/.test(r.message ?? "")).map(r => r.id));
  const unknown = new Set(checks.filter(c => c.status === "unknown").map(c => workdayEvidenceKey(c.url)).filter(key => key !== null));
  const terminal = new Set(checks.filter(c => c.status === "closed" || c.status === "ineligible").map(c => workdayEvidenceKey(c.url)).filter(key => key !== null));
  const affected = (job: PublicJob) => failed.has(employerBoardIdentity(job.applyUrl) ?? "") || unknown.has(workdayEvidenceKey(job.applyUrl) ?? "");
  return {hasFailures: failed.size > 0 || unknown.size > 0, affected,
    mayRecover: (job: PublicJob) => !!recent[workdayEvidenceKey(job.applyUrl) ?? ""] && affected(job) && !terminal.has(workdayEvidenceKey(job.applyUrl) ?? ""),
    terminal: (job: PublicJob) => terminal.has(workdayEvidenceKey(job.applyUrl) ?? ""),
    jobs: Object.values(recent).map(entry => entry.job)};
}
export function updateWorkdayContinuity(cache: WorkdayContinuity, checks: WorkdayCheck[], accepted: PublicJob[], now: Date) {
  const next = recentWorkdayEvidence(cache, now);
  const jobs = new Map(accepted.map(job => [workdayEvidenceKey(job.applyUrl), job]));
  for (const check of checks) {
    const key = workdayEvidenceKey(check.url);
    if (!key) continue;
    if (check.status === "closed" || check.status === "ineligible") delete next[key];
    else if (check.status === "live") {
      if (jobs.has(key)) next[key] = {checkedAt: now.toISOString(), job: jobs.get(key)!};
      else delete next[key];
    }
  }
  for (const check of checks) if (check.status === "closed" || check.status === "ineligible") {const key = workdayEvidenceKey(check.url); if (key) delete next[key];}
  return next;
}
