// Exact employer-owned routes reviewed against the employer's public ATS
// response and careers site. This identifies a board, never a live vacancy.
const REVIEWED_ROUTES = [
  { host: "block.xyz", path: /^\/careers\/jobs\/\d{6,}\/?$/, key: "block", company: "Block" },
  { host: "www.okta.com", path: /^\/company\/careers\/opportunity\/\d{6,}\/?$/, key: "okta", company: "Okta" },
  { host: "www.qualtrics.com", path: /^\/careers\/us\/en\/job\/\d{6,}\/?$/, key: "qualtrics", company: "Qualtrics" },
  { host: "www.brex.com", path: /^\/careers\/\d{6,}\/?$/, key: "brex", company: "Brex" },
  { host: "www.mongodb.com", path: /^\/careers\/job\/?$/, key: "mongodb", company: "MongoDB", queryId: true },
  { host: "www.jumptrading.com", path: /^\/hr\/job\/?$/, key: "jumptrading", company: "Jump Trading", queryId: true },
  { host: "stripe.com", path: /^\/jobs\/search\/?$/, key: "stripe", company: "Stripe", queryId: true },
  { host: "careers.withwaymo.com", path: /^\/jobs\/?$/, key: "waymo", company: "Waymo", queryId: true },
  { host: "careers.formlabs.com", path: /^\/job\/\d{6,}(?:\/apply)?\/?$/, key: "formlabs", company: "Formlabs" },
  { host: "careers.roblox.com", path: /^\/jobs\/\d{6,}\/?$/, key: "roblox", company: "Roblox" },
  { host: "www.samsara.com", path: /^\/company\/careers\/roles\/\d{6,}\/?$/, key: "samsara", company: "Samsara" },
  { host: "www.akunacapital.com", path: /^\/careers\/job\/\d{6,}\/?$/, key: "akunacapital", company: "Akuna Capital" },
  { host: "akunacapital.com", path: /^\/careers\/job\/\d{6,}\/?$/, key: "akunacapital", company: "Akuna Capital" },
  { host: "careers.datadoghq.com", path: /^\/detail\/\d{6,}\/?$/, key: "datadog", company: "Datadog" },
  { host: "www.asana.com", path: /^\/jobs\/apply\/\d{6,}\/?$/, key: "asana", company: "Asana" },
];

// Block's current API emits HTTP links. Its employer server redirects these
// exact posting routes to the identical HTTPS path. No other host is upgraded.
export function reviewedAtsApplicationUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" && url.hostname === "block.xyz" && !url.username && !url.password && !url.port
      && /^\/careers\/jobs\/\d{6,}\/?$/.test(url.pathname)) {
      url.protocol = "https:";
      return url.href;
    }
  } catch { /* Invalid links still fail normal URL validation. */ }
  return value;
}

export function reviewedGreenhouseBoard(value: string): { key: string; company: string } | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const route = REVIEWED_ROUTES.find(route => route.host === url.hostname && route.path.test(url.pathname)
      && (!route.queryId || url.searchParams.getAll("gh_jid").length === 1 && /^\d{6,}$/.test(url.searchParams.get("gh_jid") ?? "")));
    return route ? { key: route.key, company: route.company } : null;
  } catch {
    return null;
  }
}

// Only these routes need the query parameter to identify a posting. On routes
// whose path already identifies the posting, it remains redundant tracking.
export function reviewedGreenhouseQueryId(value: string): string | null {
  if (!reviewedGreenhouseBoard(value)) return null;
  const url = new URL(value);
  return REVIEWED_ROUTES.some(route => route.queryId && route.host === url.hostname && route.path.test(url.pathname))
    ? url.searchParams.get("gh_jid") : null;
}
