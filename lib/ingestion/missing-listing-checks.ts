import { needsListingCheck, type ListingHealthFile } from "../listing-health";

// Eligibility for a diagnostic GET only, never employer or vacancy approval.
// These public native routes contain an exact posting ID. Aggregators, short
// links and internal portals cannot supply employer-closure evidence here.
export function isNativeDiagnosticUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    if (/^[a-z0-9-]+\.bamboohr\.com$/.test(url.hostname)) return /^\/careers\/\d+\/?$/.test(url.pathname);
    if (/^careers-[a-z0-9-]+\.icims\.com$/.test(url.hostname)) return /^\/jobs\/\d+\/[^/]+\/?$/.test(url.pathname);
    if (url.hostname === "jobs.dayforcehcm.com") return /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?[^/]+\/candidateportal\/jobs\/\d+\/?$/i.test(url.pathname);
    if (/^[a-z0-9-]+\.fa\.[a-z0-9]+\.oraclecloud\.com$/.test(url.hostname))
      return /^\/hcmUI\/CandidateExperience\/en(?:-[A-Z]{2})?\/sites\/[^/]+\/job\/\d+\/?$/.test(url.pathname);
  } catch { /* Invalid links remain outside this bounded diagnostic lane. */ }
  return false;
}

export function selectGenericListingChecks(entries: Array<[string, string]>, health: ListingHealthFile,
  now: Date, limit: number, missingPublished = new Set<string>()) {
  if (!Number.isInteger(limit) || limit < 0 || limit > 250) throw new Error("Invalid generic listing-check budget");
  const due = [...new Map(entries)].filter(([id]) => needsListingCheck(health[id], now))
    .sort(([a], [b]) => Date.parse(health[a]?.checkedAt ?? "1970-01-01") - Date.parse(health[b]?.checkedAt ?? "1970-01-01") || a.localeCompare(b));
  const maintenance = due.filter(([id]) => missingPublished.has(id));
  const other = due.filter(([id]) => !missingPublished.has(id));
  const selected = [...maintenance.slice(0, Math.ceil(limit * 0.8)), ...other.slice(0, Math.floor(limit * 0.2))];
  const chosen = new Set(selected.map(([id]) => id));
  for (const row of [...maintenance, ...other]) if (selected.length < limit && !chosen.has(row[0])) {
    selected.push(row); chosen.add(row[0]);
  }
  return selected;
}
