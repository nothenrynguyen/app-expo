import { load } from "cheerio";
import type { JobSource } from "./source-catalog";
import {
  canonicalizeUrl,
  inferTerm,
  inferWorkMode,
  normalizeDisplayText,
  parsePostedAt,
  type CandidateJob,
} from "./source-normalization";

type ApplyGuyJob = {
  company?: string;
  title?: string;
  category?: string;
  location?: string;
  season?: string;
  posted?: string;
  listingUrl?: string;
};

function cleanText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " / ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_~`]+/g, "")
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
    const termIndex = findColumn(headers, ["term", "season"]);
    const applyIndex = findColumn(headers, ["application", "apply", "posting", "link"]);
    const dateIndex = findColumn(headers, ["date posted", "posted", "added", "age", "date"]);
    if (companyIndex < 0 || titleIndex < 0 || dateIndex < 0) continue;
    const effectiveApplyIndex = applyIndex >= 0 ? applyIndex : titleIndex;

    index += 2;
    while (index < lines.length && lines[index].includes("|") && !isDivider(lines[index])) {
      const cells = splitRow(lines[index]);
      const rawCompany = cleanText(cells[companyIndex] ?? "");
      const company = /^↳|^same$/i.test(rawCompany) || !rawCompany ? lastCompany : rawCompany.replace(/^[^\p{L}\p{N}]+/u, "");
      if (company) lastCompany = company;
      const title = cleanText(cells[titleIndex] ?? "");
      const location = cleanText(cells[locationIndex] ?? "") || "Location not stated";
      const applyUrl = extractUrl(cells[effectiveApplyIndex] ?? "");
      const posted = parsePostedAt(cleanText(cells[dateIndex] ?? ""), now);
      const rawText = cleanText(cells.join(" | "));
      const closed = /(?:🔒|\bclosed\b|\bexpired\b)/i.test(rawText);
      if (company && title && applyUrl && posted && !closed) {
        jobs.push({
          company,
          title,
          term: inferTerm(`${cleanText(cells[termIndex] ?? "")} ${title} ${section}`),
          location,
          workMode: inferWorkMode(`${title} ${location} ${rawText}`),
          postedAt: posted.postedAt,
          postedAtSource: posted.source,
          applyUrl,
          category: /new grad|early career/i.test(`${section} ${source}`) ? "New grad" : /quant/i.test(section) ? "Quant" : "Internship",
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
    const termIndex = findColumn(headers, ["term", "season"]);
    const applyIndex = findColumn(headers, ["application", "apply", "posting", "link"]);
    const dateIndex = findColumn(headers, ["date posted", "posted", "added", "age", "date"]);
    if (companyIndex < 0 || titleIndex < 0 || dateIndex < 0) return;
    const effectiveApplyIndex = applyIndex >= 0 ? applyIndex : titleIndex;
    let htmlLastCompany = "";
    $(table).find("tbody tr").each((__, row) => {
      const cells = $(row).children("td").toArray();
      const cell = (cellIndex: number) => cells[cellIndex] ? $(cells[cellIndex]) : null;
      const rawCompany = cleanText(cell(companyIndex)?.text() ?? "");
      const company = /^↳|^same$/i.test(rawCompany) || !rawCompany ? htmlLastCompany : rawCompany.replace(/^[^\p{L}\p{N}]+/u, "");
      if (company) htmlLastCompany = company;
      const title = cleanText(cell(titleIndex)?.text() ?? "");
      const location = cleanText(cell(locationIndex)?.text() ?? "") || "Location not stated";
      const applyUrl = canonicalizeUrl(cell(effectiveApplyIndex)?.find("a[href]").first().attr("href") ?? "");
      const posted = parsePostedAt(cleanText(cell(dateIndex)?.text() ?? ""), now);
      const rawText = cleanText(cells.map((item) => $(item).text()).join(" | "));
      const closed = /(?:🔒|\bclosed\b|\bexpired\b)/i.test(rawText) || $(row).is(".closed,.expired");
      if (company && title && applyUrl && posted && !closed) {
        jobs.push({
          company,
          title,
          term: inferTerm(`${cleanText(cell(termIndex)?.text() ?? "")} ${title}`),
          location,
          workMode: inferWorkMode(`${title} ${location} ${rawText}`),
          postedAt: posted.postedAt,
          postedAtSource: posted.source,
          applyUrl,
          category: /new grad|early career/i.test(`${title} ${source}`) ? "New grad" : /quant/i.test(title) ? "Quant" : "Internship",
          salary: null,
          source,
          rawText,
        });
      }
    });
  });
  return jobs;
}

export function parseApplyGuySource(payload: string, source: string, categories: string[] = []): CandidateJob[] {
  const parsed = JSON.parse(payload) as { jobs?: ApplyGuyJob[] };
  const allowedCategories = new Set(categories.map((category) => category.toLowerCase()));
  const jobs: CandidateJob[] = [];
  for (const job of parsed.jobs ?? []) {
    if (allowedCategories.size > 0 && !allowedCategories.has(String(job.category ?? "").toLowerCase())) continue;
    const applyUrl = canonicalizeUrl(job.listingUrl ?? "");
    const posted = job.posted ? parsePostedAt(job.posted) : null;
    const company = normalizeDisplayText(job.company ?? "");
    const title = normalizeDisplayText(job.title ?? "");
    const location = normalizeDisplayText(job.location ?? "") || "Location not stated";
    if (!applyUrl || new URL(applyUrl).hostname.endsWith("applyguy.ai") || !posted || !company || !title) continue;
    const season = normalizeDisplayText(job.season ?? "");
    const rawText = `${title} ${job.category ?? ""} ${location} ${season}`;
    jobs.push({
      company,
      title,
      term: season && !/not specified/i.test(season) ? season : inferTerm(rawText),
      location,
      workMode: inferWorkMode(rawText),
      postedAt: posted.postedAt,
      postedAtSource: posted.source,
      applyUrl,
      category: "Internship",
      salary: null,
      source,
      rawText,
    });
  }
  return jobs;
}

export function sourceAllowsAtsExpansion(sourceName: string, sources: JobSource[]): boolean {
  return sources.find((source) => source.name === sourceName)?.expandAtsBoards !== false;
}
