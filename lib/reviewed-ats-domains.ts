// Exact employer-owned routes reviewed against the employer's public ATS
// response and careers site. This identifies a board, never a live vacancy.
const REVIEWED_ROUTES = [
  { host: "careers.formlabs.com", path: /^\/job\/\d{6,}(?:\/apply)?\/?$/, key: "formlabs", company: "Formlabs" },
  { host: "careers.roblox.com", path: /^\/jobs\/\d{6,}\/?$/, key: "roblox", company: "Roblox" },
  { host: "www.samsara.com", path: /^\/company\/careers\/roles\/\d{6,}\/?$/, key: "samsara", company: "Samsara" },
  { host: "www.akunacapital.com", path: /^\/careers\/job\/\d{6,}\/?$/, key: "akunacapital", company: "Akuna Capital" },
  { host: "akunacapital.com", path: /^\/careers\/job\/\d{6,}\/?$/, key: "akunacapital", company: "Akuna Capital" },
  { host: "careers.datadoghq.com", path: /^\/detail\/\d{6,}\/?$/, key: "datadog", company: "Datadog" },
  { host: "www.asana.com", path: /^\/jobs\/apply\/\d{6,}\/?$/, key: "asana", company: "Asana" },
];

export function reviewedGreenhouseBoard(value: string): { key: string; company: string } | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const route = REVIEWED_ROUTES.find(route => route.host === url.hostname && route.path.test(url.pathname));
    return route ? { key: route.key, company: route.company } : null;
  } catch {
    return null;
  }
}
