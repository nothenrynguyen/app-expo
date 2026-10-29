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
    if (Number.isFinite(checked) && checked <= now.getTime()) return checked + FRESH_MS;
    const seen = record?.firstSeenAt ? Date.parse(record.firstSeenAt) : NaN;
    return Number.isFinite(seen) && seen <= now.getTime() ? seen : now.getTime();
  };
  return entries.filter(([id]) => due(id) <= now.getTime()).sort(([a], [b]) => due(a) - due(b) || a.localeCompare(b)).slice(0, limit);
}

// Source admission and employer admission share a budget, but neither queue may
// starve the other when a newly reviewed source adds many verification leads.
export function selectBalancedScopedChecks(entries: Array<[string, string]>, cache: ScopedListingCache, now: Date, limit = 150): Array<[string, string]> {
  const due = selectScopedChecks(entries, cache, now, entries.length);
  const source = due.filter(([id]) => id.startsWith("source:"));
  const employer = due.filter(([id]) => !id.startsWith("source:"));
  const reserved = Math.floor(limit / 2);
  const selected = [...source.slice(0, reserved), ...employer.slice(0, reserved)];
  const ids = new Set(selected.map(([id]) => id));
  return [...selected, ...due.filter(([id]) => !ids.has(id))].slice(0, limit);
}
