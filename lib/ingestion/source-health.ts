export type HealthOutcome = "healthy" | "partial" | "rate_limited" | "unavailable" | "cooldown";
export type HealthCounts = { total: number; healthy: number; partial: number; rate_limited: number; unavailable: number; cooldown: number };

export function countHealth(records: Array<{ status: "ok" | "failed"; outcome?: HealthOutcome; detailFailures?: number }>): HealthCounts {
  const counts: HealthCounts = { total: records.length, healthy: 0, partial: 0, rate_limited: 0, unavailable: 0, cooldown: 0 };
  for (const record of records) counts[record.outcome ?? (record.status === "failed" ? "unavailable" : record.detailFailures ? "partial" : "healthy")]++;
  return counts;
}

export function healthDescription(counts: HealthCounts): string {
  return [counts.partial && `${counts.partial} partial`, counts.rate_limited && `${counts.rate_limited} rate limited`,
    counts.unavailable && `${counts.unavailable} unavailable`, counts.cooldown && `${counts.cooldown} cooling down`].filter(Boolean).join(", ");
}
