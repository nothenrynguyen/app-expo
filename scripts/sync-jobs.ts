import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { evaluateCompanyQuality, type VerifiedCompany } from "../lib/company-quality";
import type { JobsSnapshot, PublicJob } from "../lib/jobs";
import {
  canonicalizeUrl,
  inferTerm,
  inferWorkMode,
  isEligibleUSLocation,
  jobIdentity,
  parsePostedAt,
  stableJobId,
  type CandidateJob,
} from "../lib/source-normalization";

type EngineJob = {
  company: string;
  title: string;
  season: string;
  category: string;
  location: string;
  url: string;
  posted_at: string;
  posted_at_source: "exact" | "date_only" | "relative_derived";
  sponsorship?: string | null;
  salary?: string | null;
  skills?: string[] | null;
  source: string;
  h1b_approvals?: number | null;
  remote?: boolean;
};

const ENGINE_URL = "https://zshah101.github.io/Automated-List-Of-Summer-2027-and-Fall-2026-Tech-Internships/api/jobs.json";

const MARKDOWN_SOURCES = [
  { name: "Simplify Summer 2027", url: "https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/README.md" },
  { name: "Simplify Off-Season 2027", url: "https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/README-Off-Season.md" },
  { name: "SpeedyApply Internships", url: "https://raw.githubusercontent.com/speedyapply/2027-SWE-College-Jobs/main/README.md" },
  { name: "SpeedyApply New Grad USA", url: "https://raw.githubusercontent.com/speedyapply/2027-SWE-College-Jobs/main/NEW_GRAD_USA.md" },
  { name: "Summer 2027 Tech Internships", url: "https://raw.githubusercontent.com/sndsh404/summer-2027-internships/main/README.md" },
  { name: "Vansh Summer 2027", url: "https://raw.githubusercontent.com/vanshb03/Summer2027-Internships/dev/README.md" },
  { name: "Vansh Off-Season 2027", url: "https://raw.githubusercontent.com/vanshb03/Summer2027-Internships/dev/OFFSEASON_README.md" },
];

function cleanText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " / ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractUrl(value: string): string | null {
  const markdown = value.match(/\[[^\]]*]\((https?:\/\/[^)\s]+)\)/i)?.[1];
  const html = value.match(/href=["'](https?:\/\/[^"']+)["']/i)?.[1];
  const raw = value.match(/https?:\/\/[^\s"'<>|)]+/i)?.[0];
  return canonicalizeUrl(markdown ?? html ?? raw ?? "");
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isDivider(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}/.test(line);
}

function findColumn(headers: string[], candidates: string[]): number {
  return headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate)));
}

export function parseMarkdownSource(markdown: string, source: string, now = new Date()): CandidateJob[] {
  const lines = markdown.split("\n");
  const jobs: CandidateJob[] = [];
  let lastCompany = "";
  let section = "Other";

  for (let index = 0; index < lines.length - 1; index += 1) {
    const heading = lines[index].match(/^\s*#{2,4}\s+(.+?)\s*#*\s*$/);
    if (heading) section = cleanText(heading[1]);
    if (!lines[index].includes("|") || !isDivider(lines[index + 1])) continue;

    const headers = splitRow(lines[index]).map((header) => cleanText(header).toLowerCase());
    const companyIndex = findColumn(headers, ["company", "employer", "organization"]);
    const titleIndex = findColumn(headers, ["position", "role", "title", "job"]);
    const locationIndex = findColumn(headers, ["location"]);
    const applyIndex = findColumn(headers, ["application", "apply", "posting", "link"]);
    const dateIndex = findColumn(headers, ["date posted", "posted", "added", "age", "date"]);
    if (companyIndex < 0 || titleIndex < 0 || applyIndex < 0 || dateIndex < 0) continue;

    index += 2;
    while (index < lines.length && lines[index].includes("|") && !isDivider(lines[index])) {
      const cells = splitRow(lines[index]);
      const rawCompany = cleanText(cells[companyIndex] ?? "");
      const company = /^↳|^same$/i.test(rawCompany) || !rawCompany ? lastCompany : rawCompany.replace(/^[^\p{L}\p{N}]+/u, "");
      if (company) lastCompany = company;
      const title = cleanText(cells[titleIndex] ?? "");
      const location = cleanText(cells[locationIndex] ?? "") || "Location not stated";
      const applyUrl = extractUrl(cells[applyIndex] ?? "");
      const posted = parsePostedAt(cleanText(cells[dateIndex] ?? ""), now);
      const rawText = cleanText(cells.join(" | "));
      const closed = /(?:🔒|\bclosed\b|\bexpired\b)/i.test(rawText);
      if (company && title && applyUrl && posted && !closed) {
        jobs.push({
          company,
          title,
          term: inferTerm(`${title} ${section}`),
          location,
          workMode: inferWorkMode(`${title} ${location} ${rawText}`),
          postedAt: posted.postedAt,
          postedAtSource: posted.source,
          applyUrl,
          category: /new grad/i.test(section) ? "New grad" : /quant/i.test(section) ? "Quant" : "Internship",
          salary: null,
          source,
          rawText,
        });
      }
      index += 1;
    }
  }

  const $ = load(markdown);
  $("table").each((_, table) => {
    const headers = $(table).find("thead th").map((__, cell) => cleanText($(cell).text()).toLowerCase()).get();
    const companyIndex = findColumn(headers, ["company", "employer", "organization"]);
    const titleIndex = findColumn(headers, ["position", "role", "title", "job"]);
    const locationIndex = findColumn(headers, ["location"]);
    const applyIndex = findColumn(headers, ["application", "apply", "posting", "link"]);
    const dateIndex = findColumn(headers, ["date posted", "posted", "added", "age", "date"]);
    if (companyIndex < 0 || titleIndex < 0 || applyIndex < 0 || dateIndex < 0) return;
    let htmlLastCompany = "";
    $(table).find("tbody tr").each((__, row) => {
      const cells = $(row).children("td").toArray();
      const cell = (cellIndex: number) => cells[cellIndex] ? $(cells[cellIndex]) : null;
      const rawCompany = cleanText(cell(companyIndex)?.text() ?? "");
      const company = /^↳|^same$/i.test(rawCompany) || !rawCompany ? htmlLastCompany : rawCompany.replace(/^[^\p{L}\p{N}]+/u, "");
      if (company) htmlLastCompany = company;
      const title = cleanText(cell(titleIndex)?.text() ?? "");
      const location = cleanText(cell(locationIndex)?.text() ?? "") || "Location not stated";
      const applyUrl = canonicalizeUrl(cell(applyIndex)?.find("a[href]").first().attr("href") ?? "");
      const posted = parsePostedAt(cleanText(cell(dateIndex)?.text() ?? ""), now);
      const rawText = cleanText(cells.map((item) => $(item).text()).join(" | "));
      const closed = /(?:🔒|\bclosed\b|\bexpired\b)/i.test(rawText) || $(row).is(".closed,.expired");
      if (company && title && applyUrl && posted && !closed) {
        jobs.push({
          company,
          title,
          term: inferTerm(title),
          location,
          workMode: inferWorkMode(`${title} ${location} ${rawText}`),
          postedAt: posted.postedAt,
          postedAtSource: posted.source,
          applyUrl,
          category: /new grad/i.test(title) ? "New grad" : /quant/i.test(title) ? "Quant" : "Internship",
          salary: null,
          source,
          rawText,
        });
      }
    });
  });
  return jobs;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "user-agent": "App-Expo/0.1" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function loadCandidates() {
  const health: JobsSnapshot["sourceHealth"] = [];
  const candidates: CandidateJob[] = [];
  const engineText = await fetchText(ENGINE_URL);
  const engine = JSON.parse(engineText) as { jobs: EngineJob[] };
  for (const job of engine.jobs) {
    const url = canonicalizeUrl(job.url);
    if (!url || !job.posted_at) continue;
    candidates.push({
      company: job.company,
      title: job.title,
      term: job.season || inferTerm(job.title),
      location: job.location || "Location not stated",
      workMode: job.remote ? "remote" : inferWorkMode(`${job.title} ${job.location}`),
      postedAt: new Date(job.posted_at).toISOString(),
      postedAtSource: job.posted_at_source,
      applyUrl: url,
      category: job.category || "Internship",
      salary: job.salary ?? null,
      source: "Internship Engine",
      h1bApprovals: job.h1b_approvals ?? null,
      rawText: `${job.title} ${job.location} ${job.sponsorship ?? ""} ${(job.skills ?? []).join(" ")}`,
    });
  }
  health.push({ name: "Internship Engine", status: "ok", rows: engine.jobs.length });

  const results = await Promise.allSettled(MARKDOWN_SOURCES.map(async (source) => ({
    source,
    jobs: parseMarkdownSource(await fetchText(source.url), source.name),
  })));
  results.forEach((result, index) => {
    const source = MARKDOWN_SOURCES[index];
    if (result.status === "fulfilled") {
      candidates.push(...result.value.jobs);
      health.push({ name: source.name, status: "ok", rows: result.value.jobs.length });
    } else {
      health.push({ name: source.name, status: "failed", rows: 0 });
    }
  });
  return { candidates, health };
}

async function main() {
  const root = path.resolve(import.meta.dirname, "..");
  const output = path.join(root, "public/jobs.json");
  const previous = await readFile(output, "utf8").then((value) => JSON.parse(value) as JobsSnapshot).catch(() => null);
  const previousByUrl = new Map(previous?.jobs.map((job) => [jobIdentity(job.applyUrl), job]) ?? []);
  const registry = JSON.parse(await readFile(path.join(root, "data/verified-companies.json"), "utf8")) as VerifiedCompany[];
  const { candidates, health } = await loadCandidates();
  const unhealthySources = health.filter((source) => source.status === "failed" || source.rows === 0);
  if (unhealthySources.length > 0) {
    throw new Error(
      `Refusing to replace the last known-good snapshot because these sources were unhealthy: ${unhealthySources.map((source) => source.name).join(", ")}`,
    );
  }
  const merged = new Map<string, PublicJob>();
  const quarantined: Array<{ company: string; title: string; reason: string; source: string; applyUrl: string }> = [];
  let rejectedCount = 0;

  for (const candidate of candidates) {
    if (!isEligibleUSLocation(candidate.location)) {
      rejectedCount += 1;
      continue;
    }
    const decision = evaluateCompanyQuality(
      { name: candidate.company, h1bApprovals: candidate.h1bApprovals },
      candidate.rawText,
      registry,
    );
    if (decision.status === "rejected") {
      rejectedCount += 1;
      continue;
    }
    if (decision.status === "quarantined") {
      quarantined.push({ company: candidate.company, title: candidate.title, reason: decision.reason, source: candidate.source, applyUrl: candidate.applyUrl });
      continue;
    }

    const canonical = canonicalizeUrl(candidate.applyUrl)!;
    const identity = jobIdentity(canonical)!;
    const existing = merged.get(identity);
    if (existing) {
      if (!existing.sources.includes(candidate.source)) existing.sources.push(candidate.source);
      const precision = { first_seen: 0, relative_derived: 1, date_only: 2, exact: 3 } as const;
      if (precision[candidate.postedAtSource] > precision[existing.postedAtSource]) {
        existing.postedAt = candidate.postedAt;
        existing.postedAtSource = candidate.postedAtSource;
      }
      continue;
    }
    const prior = previousByUrl.get(identity);
    const precision = { first_seen: 0, relative_derived: 1, date_only: 2, exact: 3 } as const;
    const keepPriorDate = prior && precision[prior.postedAtSource] >= precision[candidate.postedAtSource];
    merged.set(identity, {
      id: stableJobId(identity, candidate.company, candidate.title),
      company: candidate.company,
      title: candidate.title,
      term: candidate.term,
      location: candidate.location,
      workMode: candidate.workMode,
      postedAt: keepPriorDate ? prior.postedAt : candidate.postedAt,
      postedAtSource: keepPriorDate ? prior.postedAtSource : candidate.postedAtSource,
      applyUrl: canonical,
      linkedInUrl: decision.linkedInUrl,
      category: candidate.category,
      salary: candidate.salary,
      sources: [candidate.source],
      verifiedCompany: true,
    });
  }

  const jobs = [...merged.values()].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  if (jobs.length < 10) throw new Error(`Refusing to publish anomalous snapshot with only ${jobs.length} approved jobs.`);
  const snapshot: JobsSnapshot = { generatedAt: new Date().toISOString(), jobs, quarantinedCount: quarantined.length, sourceHealth: health };

  const materialSnapshot = { jobs: snapshot.jobs, quarantinedCount: snapshot.quarantinedCount, sourceHealth: snapshot.sourceHealth };
  const previousMaterial = previous && { jobs: previous.jobs, quarantinedCount: previous.quarantinedCount, sourceHealth: previous.sourceHealth };
  if (previousMaterial && JSON.stringify(materialSnapshot) === JSON.stringify(previousMaterial)) {
    console.log(`No material changes; retained ${jobs.length} published jobs.`);
    return;
  }

  await mkdir(path.join(root, "public"), { recursive: true });
  await mkdir(path.join(root, "data"), { recursive: true });
  const temporary = `${output}.tmp`;
  await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`);
  await rename(temporary, output);
  await writeFile(path.join(root, "data/quarantine.json"), `${JSON.stringify({ generatedAt: snapshot.generatedAt, rejectedCount, jobs: quarantined }, null, 2)}\n`);
  console.log(`Published ${jobs.length} jobs; quarantined ${quarantined.length}; rejected ${rejectedCount}.`);
}

await main();
