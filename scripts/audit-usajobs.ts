import { mkdir, readFile, writeFile } from "node:fs/promises";
import { jobIdentity } from "../lib/source-normalization";
import type { JobsSnapshot } from "../lib/jobs";

// Research only. Never writes public listings, source configuration or credentials.
const queries = [
  { name: "finance-students", series: "0501;0510;0511;0560", path: "student" },
  { name: "finance-graduates", series: "0501;0510;0511;0560", path: "graduates" },
  { name: "business-students", series: "1101;1102", path: "student" },
  { name: "business-graduates", series: "1101;1102", path: "graduates" },
];
const plan = queries.map(query => {
  const url = new URL("https://data.usajobs.gov/api/search");
  url.search = new URLSearchParams({ JobCategoryCode: query.series, HiringPath: query.path, ResultsPerPage: "25", Page: "1", Fields: "Full", SortField: "opendate", SortDirection: "Desc" }).toString();
  return { ...query, url: url.toString() };
});
if (process.argv.includes("--plan")) {
  console.log(JSON.stringify({ maxRequests: 4, maxRows: 100, automaticRetries: 0, plan }, null, 2));
} else if (!process.env.USAJOBS_API_KEY || !process.env.USAJOBS_EMAIL) {
  console.error("Pilot not run: configure USAJOBS_API_KEY and USAJOBS_EMAIL in ignored .env.local. No requests made.");
  process.exitCode = 1;
} else if (process.env.USAJOBS_PILOT_COST_REVIEWED !== "true") {
  console.error("Pilot not run: complete the documented zero-cost/access review first. No requests made.");
  process.exitCode = 1;
} else {
  const baseline: JobsSnapshot = JSON.parse(await readFile("public/jobs.json", "utf8"));
  const existing = new Set(baseline.jobs.map(job => jobIdentity(job.applyUrl)));
  const announcements = new Map<string, { title: string; agency: string; url: string; location: string; closes: string; paths: string[]; overlapsBoard: boolean }>();
  const diagnostics = [];
  let complete = true;
  for (const query of plan) {
    try {
      const response = await fetch(query.url, {
        headers: { Host: "data.usajobs.gov", "User-Agent": process.env.USAJOBS_EMAIL!, "Authorization-Key": process.env.USAJOBS_API_KEY!, Accept: "application/json" },
        redirect: "error", signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) {
        diagnostics.push({ query: query.name, status: response.status });
        complete = false;
        break; // Stop on authentication, limits or any other HTTP failure. No retries.
      }
      const data = await response.json();
      const items = data?.SearchResult?.SearchResultItems;
      if (!Array.isArray(items) || items.length > 25) throw new Error("Unexpected response");
      diagnostics.push({ query: query.name, sampled: items.length, matched: data.SearchResult.SearchResultCountAll });
      for (const item of items) {
        const job = item?.MatchedObjectDescriptor;
        if (!job || typeof job.PositionURI !== "string" || typeof job.PositionTitle !== "string") continue;
        const url = new URL(job.PositionURI);
        if (url.protocol !== "https:" || !["www.usajobs.gov", "usajobs.gov"].includes(url.hostname) || url.username || url.password) continue;
        const identity = jobIdentity(url.toString());
        if (!identity) continue;
        const prior = announcements.get(identity);
        announcements.set(identity, {
          title: job.PositionTitle, agency: String(job.OrganizationName ?? ""), url: url.toString(),
          location: String(job.PositionLocationDisplay ?? ""), closes: String(job.ApplicationCloseDate ?? ""),
          paths: [...new Set([...(prior?.paths ?? []), query.path])], overlapsBoard: existing.has(identity),
        });
      }
    } catch {
      // Never print raw fetch errors, headers, response bodies or contact information.
      diagnostics.push({ query: query.name, status: "request-or-schema-failed" });
      complete = false;
      break;
    }
  }
  await mkdir(".next/usajobs-pilot", { recursive: true });
  const rows = [...announcements.values()];
  await writeFile(".next/usajobs-pilot/report.json", JSON.stringify({ retrievedAt: new Date().toISOString(), baselineGeneratedAt: baseline.generatedAt, complete, diagnostics, uniqueSampled: rows.length, absentFromBoard: rows.filter(row => !row.overlapsBoard).length, qualification: "Discovery sample only. Location, career level, citizenship, hiring eligibility, closure and source admission require review before publication.", announcements: rows }, null, 2) + "\n");
  console.log(`Saved ${rows.length} unique sampled announcements to .next/usajobs-pilot/report.json. No public listings changed.`);
  if (!complete) process.exitCode = 1;
}
