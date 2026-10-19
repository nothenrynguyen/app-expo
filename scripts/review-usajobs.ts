import { readFile, mkdir, writeFile } from "node:fs/promises";
import { load } from "cheerio";
import { officialUsaJobsUrl, reviewUsaJobsPosting, type UsaJobsSeed } from "../lib/usajobs";
import { jobIdentity } from "../lib/source-normalization";

// Bounded official-page review. No credentials, public output or source activation.
const sample = JSON.parse(await readFile("docs/usajobs-expanded-pilot-result.json", "utf8"));
const seeds: UsaJobsSeed[] = sample.announcements;
if (!Array.isArray(seeds) || seeds.length > 60) throw new Error("Unexpected pilot size");
const baseline = JSON.parse(await readFile("public/jobs.json", "utf8"));
const identities = new Set(baseline.jobs.map((job: { applyUrl: string }) => jobIdentity(job.applyUrl)));
const rows = [];
let requests = 0;
for (const seed of seeds) {
  const url = officialUsaJobsUrl(seed.url);
  if (!url) { rows.push({ url: seed.url, status: "held", reason: "untrusted-url" }); continue; }
  try {
    const cached = process.argv.includes("--cached");
    let html: string;
    if (cached) {
      html = await readFile(`.cache/usajobs-review-pages/${url.split("/").at(-1)}.html`, "utf8");
    } else {
      requests++;
      const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15_000), headers: { "User-Agent": "empluzzed-source-review" } });
      if (!response.ok) { rows.push({ url, status: "held", reason: `http-${response.status}` }); if ([401, 403, 429].includes(response.status)) break; continue; }
      html = await response.text();
    }
    if (html.length > 3_000_000) throw new Error("Unexpected size");
    const result = reviewUsaJobsPosting(seed, html);
    await mkdir(".cache/usajobs-review-pages", { recursive: true });
    // Keep fetched public page fixtures ignored; never commit agency contact details.
    await writeFile(`.cache/usajobs-review-pages/${url.split("/").at(-1)}.html`, html);
    const $ = load(html);
    rows.push({ url, title: seed.title, agency: seed.agency, overlapsBoard: identities.has(jobIdentity(url)), ...result,
      officialTitle: $("title").text().replace(/\s+/g, " ").trim() });
  } catch { rows.push({ url, status: "held", reason: "request-or-schema-failed" }); }
}
const counts = rows.reduce<Record<string, number>>((acc, row) => { const key = row.status === "held" ? row.reason! : "candidate"; acc[key] = (acc[key] ?? 0) + 1; return acc; }, {});
await mkdir(".cache/usajobs-pilot", { recursive: true });
await writeFile(".cache/usajobs-pilot/selective-review.json", JSON.stringify({ reviewedAt: new Date().toISOString(), requests, sampled: seeds.length, reviewed: rows.length, counts, qualification: "Candidates still require employer admission, eligibility presentation and semantic duplicate review. No public listings changed.", rows }, null, 2) + "\n");
console.log(JSON.stringify({ requests, reviewed: rows.length, counts }));
