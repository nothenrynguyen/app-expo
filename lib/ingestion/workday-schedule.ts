import type { HealthOutcome } from "./source-health";

export type WorkdaySchedule = Record<string, { nextAttemptAt: string; failures: number; reason: string }>;

export function workdayCooldown(state: WorkdaySchedule, host: string, now: Date) {
  const entry = state[host];
  return entry && Date.parse(entry.nextAttemptAt) > now.getTime() ? entry : null;
}

export function recordWorkdayAttempt(state: WorkdaySchedule, host: string, outcome: HealthOutcome,
  now: Date, reason: string, retryAfterMs = 0): void {
  if (outcome === "healthy" || outcome === "partial") { delete state[host]; return; }
  if (outcome === "cooldown") return;
  const failures = Math.min(10, (state[host]?.failures ?? 0) + 1);
  // Keep retries within the existing 24-hour listing-evidence lifetime. Access
  // denials get a full day; rate limits back off from two to twelve hours.
  const hours = /^(401|403)\b/.test(reason) ? 24 : Math.min(outcome === "rate_limited" ? 12 : 6, (outcome === "rate_limited" ? 2 : 1) * 2 ** (failures - 1));
  const delay = Math.max(hours * 3_600_000, Math.min(24 * 3_600_000, Math.max(0, retryAfterMs)));
  state[host] = { failures, reason, nextAttemptAt: new Date(now.getTime() + delay).toISOString() };
}
