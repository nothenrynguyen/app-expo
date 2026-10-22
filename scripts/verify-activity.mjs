import { readFile } from "node:fs/promises";

// Read-only production smoke check. Does not manufacture visitor activity.
const endpoint = new URL(process.argv[2] ?? "https://invalid.example/collect");
if (endpoint.protocol !== "https:" || endpoint.pathname !== "/collect" || endpoint.search || endpoint.hash || endpoint.username || endpoint.password || endpoint.hostname === "invalid.example") throw new Error("Pass the actual HTTPS /collect URL as the first argument.");
const site = new URL(process.argv[3] ?? "https://empluzzed.fyi");
if (site.protocol !== "https:" || site.pathname !== "/" || site.search || site.hash || site.username || site.password) throw new Error("Site must be an HTTPS origin.");
const token = (await readFile(new URL("../.cache/activity-owner-key.txt", import.meta.url), "utf8")).trim();
if (!/^[A-Za-z0-9_-]{43,128}$/.test(token)) throw new Error("Local owner key is missing or malformed.");
const safeFetch = (url, init = {}) => fetch(url, { ...init, redirect: "error", signal: AbortSignal.timeout(15000) });
const reportURL = new URL("/report?range=30d", endpoint);
const denied = await safeFetch(reportURL);
if (denied.status !== 401 || denied.headers.get("cache-control") !== "no-store") throw new Error("Unauthenticated reporting did not fail closed.");
const evil = await safeFetch(reportURL, { headers: { Origin: "https://untrusted.example", Authorization: `Bearer ${token}` } });
if (evil.status !== 403) throw new Error("Unexpected reporting origin was not blocked.");
const report = await safeFetch(reportURL, { headers: { Origin: site.origin, Authorization: `Bearer ${token}` } });
if (!report.ok || report.headers.get("access-control-allow-origin") !== site.origin) throw new Error("Private report or CORS verification failed.");
const data = await report.json();
if (data.version !== 1 || !data.totals || !Array.isArray(data.daily)) throw new Error("Private report schema failed verification.");
const invalid = await safeFetch(endpoint, { method: "POST", headers: { Origin: site.origin, "Content-Type": "application/json" }, body: JSON.stringify({ notes: "verification-invalid-payload" }) });
if (invalid.status !== 400) throw new Error("Collection is disabled or invalid event rejection failed.");
const dashboard = await safeFetch(new URL("/analytics", site));
if (!dashboard.ok || !(await dashboard.text()).includes("noindex")) throw new Error("Production dashboard shell is missing or indexable.");
console.log("PASS: private report authentication, rejected origin, report schema, invalid-event rejection, and production dashboard shell. No visitor events were created.");
console.log("Still verify consent, a real consenting action, dashboard receipt and withdrawal in a browser before recording a production completion receipt.");
