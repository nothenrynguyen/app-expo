// Browser-safe opportunity identity. Locale and slug changes are aliases, but
// different hosts, career sites and requisitions must never share evidence.
export function workdayOpportunityIdentity(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || !/^[a-z0-9-]+\.wd\d+\.myworkdayjobs\.com$/i.test(url.hostname)) return null;
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const job = parts.findIndex(part => part.toLowerCase() === "job");
    if (job < 1 || job !== parts.length - 3) return null;
    const site = parts[job - 1].toLowerCase();
    const match = parts.at(-1)!.match(/_((?:JR-?\d+|\d{2}WD\d+|\d{6,}|R-\d+|R\d{2}-\d{4,}|R\d{5,}|RQ\d+|REQ-\d{4}-\d+|REQ-?\d+|REF\d+[A-Z]|DT-\d+|HR\d+|J\d+|Q\d{3}[A-Z]{2,}\d+))(?:-\d+)?$/i);
    return match ? `workday:${url.hostname.toLowerCase()}:${site}:${match[1].toLowerCase()}` : null;
  } catch { return null; }
}
