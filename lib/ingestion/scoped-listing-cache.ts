export type ScopedListingRecord = { status: "live" | "unknown"; checkedAt: string | null; firstSeenAt: string };
export type ScopedListingCache = Record<string, ScopedListingRecord>;
const FRESH_MS = 24 * 60 * 60 * 1000;

export function scopedListingIsLive(record: ScopedListingRecord | undefined, now: Date): boolean {
  const timestamp = record?.checkedAt ? Date.parse(record.checkedAt) : NaN;
  return record?.status === "live" && Number.isFinite(timestamp) && timestamp <= now.getTime() && now.getTime() - timestamp < FRESH_MS;
}

// First-seen timestamps make the bounded queue fair across refreshes. Failed
// checks enter the back of the queue until their next scheduled attempt.
export function selectScopedChecks(entries: Array<[string, string]>, cache: ScopedListingCache, now: Date, limit = 150): Array<[string, string]> {
  const due = (id: string) => {
    const record = cache[id];
    const checked = record?.checkedAt ? Date.parse(record.checkedAt) : NaN;
    // Renew positive evidence halfway through its lifetime. Admission still
    // expires at 24 hours; unknown checks retain their existing daily cadence.
    if (Number.isFinite(checked) && checked <= now.getTime()) return checked + (record.status === "live" ? FRESH_MS / 2 : FRESH_MS);
    const seen = record?.firstSeenAt ? Date.parse(record.firstSeenAt) : NaN;
    return Number.isFinite(seen) && seen <= now.getTime() ? seen : now.getTime();
  };
  return entries.filter(([id]) => due(id) <= now.getTime()).sort(([a], [b]) => due(a) - due(b) || a.localeCompare(b)).slice(0, limit);
}

// Source admission and employer admission share a budget, but neither queue may
// starve the other when a newly reviewed source adds many verification leads.
export function selectBalancedScopedChecks(entries: Array<[string, string]>, cache: ScopedListingCache, now: Date, limit = 150, published: Set<string> = new Set()): Array<[string, string]> {
  const due = selectScopedChecks(entries, cache, now, entries.length);
  const source = due.filter(([id]) => id.startsWith("source:"));
  const employer = due.filter(([id]) => !id.startsWith("source:"));
  const reserved = Math.floor(limit / 2);
  const prioritize = (rows: Array<[string, string]>, budget: number) => {
    const maintenance = rows.filter(([id]) => published.has(id));
    const discovery = rows.filter(([id]) => !published.has(id));
    const selected = [...maintenance.slice(0, Math.ceil(budget * 0.8)), ...discovery.slice(0, Math.floor(budget * 0.2))];
    const ids = new Set(selected.map(([id]) => id));
    return [...selected, ...rows.filter(([id]) => !ids.has(id))].slice(0, budget);
  };
  const selected = [...prioritize(source, reserved), ...prioritize(employer, reserved)];
  const ids = new Set(selected.map(([id]) => id));
  return [...selected, ...prioritize(due.filter(([id]) => !ids.has(id)), limit - selected.length)];
}
