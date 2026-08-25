import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { load } from "cheerio";
import { discoverAtsBoard, fetchAtsBoard, type AtsBoardResult } from "../lib/ats-boards";
import { evaluateCompanyQuality, normalizeCompanyName, type CompanyTrustEntry, type VerifiedCompany } from "../lib/company-quality";
import { getFreshnessRejection } from "../lib/job-freshness";
import { isInCollection } from "../lib/job-collections";
import { buildJobsSummary } from "../lib/job-summary";
import { needsListingCheck, verifyListing, type ListingHealthFile } from "../lib/listing-health";
import { classifyRoleArea } from "../lib/role-areas";
import { applySmartRecruitersPosting, fetchSmartRecruitersPosting, parseSmartRecruitersJobUrl } from "../lib/smartrecruiters";
import type { JobSource, SourceCatalog } from "../lib/source-catalog";
import type { JobsSnapshot, PublicJob } from "../lib/jobs";
import {
  canonicalizeUrl,
  inferTerm,
  inferWorkMode,
  jobIdentity,
  normalizeDisplayText,
  parsePostedAt,
  stableJobId,
  type CandidateJob,
} from "../lib/source-normalization";
import { getSupportedJobRegions, normalizeJobLocation } from "../lib/job-locations";

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

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "user-agent": "App-Expo/0.1" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function inBatches<T, R>(items: T[], concurrency: number, task: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = { status: "fulfilled", value: await task(items[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }));
  return results;
}

async function loadCandidates(root: string, sources: JobSource[]) {
  const health: JobsSnapshot["sourceHealth"] = [];
  const candidates: CandidateJob[] = [];
  for (const engineSource of sources.filter((source) => source.kind === "engine_json")) {
    try {
      const engine = JSON.parse(await fetchText(engineSource.url)) as { jobs: EngineJob[] };
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
          source: engineSource.name,
          h1bApprovals: job.h1b_approvals ?? null,
          rawText: `${job.title} ${job.location} ${job.sponsorship ?? ""} ${(job.skills ?? []).join(" ")}`,
        });
      }
      health.push({ name: engineSource.name, status: "ok", rows: engine.jobs.length });
    } catch {
      health.push({ name: engineSource.name, status: "failed", rows: 0 });
    }
  }

  const markdownSources = sources.filter((source) => source.kind === "markdown");
  const results = await Promise.allSettled(markdownSources.map(async (source) => ({
    source,
    jobs: parseMarkdownSource(await fetchText(source.url), source.name),
  })));
  results.forEach((result, index) => {
    const source = markdownSources[index];
    if (result.status === "fulfilled") {
      candidates.push(...result.value.jobs);
      health.push({ name: source.name, status: "ok", rows: result.value.jobs.length });
    } else {
      health.push({ name: source.name, status: "failed", rows: 0 });
    }
  });

  const boards = new Map<string, NonNullable<ReturnType<typeof discoverAtsBoard>>>();
  for (const candidate of candidates) {
    const board = discoverAtsBoard(candidate.applyUrl, candidate.company, candidate.source);
    if (board && !boards.has(board.id)) boards.set(board.id, board);
  }
  const boardList = [...boards.values()];
  const boardFetches = await inBatches(boardList, 12, (board) => fetchAtsBoard(board));
  const boardResults = new Map<string, AtsBoardResult>();
  const boardRegistry = boardFetches.map((result, index) => {
    const board = boardList[index];
    if (result.status === "fulfilled") {
      boardResults.set(board.id, result.value);
      candidates.push(...result.value.jobs);
      return { provider: board.provider, key: board.key, company: board.company, status: "ok" as const, rows: result.value.liveIdentities.size };
    }
    return { provider: board.provider, key: board.key, company: board.company, status: "failed" as const, rows: 0 };
  });

  const smartRecruitersUrls = new Map<string, string>();
  for (const candidate of candidates) {
    const identity = jobIdentity(candidate.applyUrl);
    if (identity && parseSmartRecruitersJobUrl(candidate.applyUrl)) smartRecruitersUrls.set(identity, candidate.applyUrl);
  }
  const smartRecruitersEntries = [...smartRecruitersUrls];
  const smartRecruitersFetches = await inBatches(smartRecruitersEntries, 12, async ([identity, url]) => ({
    identity,
    posting: await fetchSmartRecruitersPosting(url),
  }));
  const smartRecruitersPostings = new Map(
    smartRecruitersFetches.flatMap((result) =>
      result.status === "fulfilled" && result.value.posting ? [[result.value.identity, result.value.posting] as const] : [],
    ),
  );
  for (let index = 0; index < candidates.length; index += 1) {
    const identity = jobIdentity(candidates[index].applyUrl);
    const posting = identity ? smartRecruitersPostings.get(identity) : null;
    if (posting) candidates[index] = applySmartRecruitersPosting(candidates[index], posting);
  }
  if (smartRecruitersEntries.length > 0) {
    console.log(`Verified ${smartRecruitersPostings.size} of ${smartRecruitersEntries.length} SmartRecruiters listings against employer records.`);
  }
  return { candidates, health, boardResults, boardRegistry };
}

async function main() {
  const root = path.resolve(import.meta.dirname, "..");
  const catalog = JSON.parse(await readFile(path.join(root, "data/sources.json"), "utf8")) as SourceCatalog;
  const activeSources = catalog.sources.filter((source) => source.active);
  const trustedCuratedSources = new Set(activeSources.filter((source) => source.trustedCoverage).map((source) => source.name));
  const output = path.join(root, "public/jobs.json");
  const previous = await readFile(output, "utf8").then((value) => JSON.parse(value) as JobsSnapshot).catch(() => null);
  const previousByUrl = new Map(previous?.jobs.map((job) => [jobIdentity(job.applyUrl), job]) ?? []);
  const registry = JSON.parse(await readFile(path.join(root, "data/verified-companies.json"), "utf8")) as VerifiedCompany[];
  const trustRegistry = JSON.parse(await readFile(path.join(root, "data/company-trust.json"), "utf8")) as CompanyTrustEntry[];
  const listingHealthPath = path.join(root, "data/listing-health.json");
  const listingHealth: ListingHealthFile = await readFile(listingHealthPath, "utf8")
    .then((value) => JSON.parse(value) as ListingHealthFile)
    .catch(() => ({} as ListingHealthFile));
  const { candidates, health, boardResults, boardRegistry } = await loadCandidates(root, activeSources);
  const unhealthySources = health.filter((source) => source.status === "failed" || source.rows === 0);
  const merged = new Map<string, PublicJob>();
  const quarantined: Array<{ company: string; title: string; reason: string; source: string; applyUrl: string }> = [];
  let rejectedCount = 0;

  const trustedCompanies = new Set(
    candidates
      .filter((candidate) => trustedCuratedSources.has(candidate.source))
      .map((candidate) => normalizeCompanyName(candidate.company)),
  );
  const genericUrls = new Map<string, string>();
  for (const candidate of candidates) {
    const identity = jobIdentity(candidate.applyUrl);
    const board = discoverAtsBoard(candidate.applyUrl, candidate.company, candidate.source);
    if (identity && (!board || !boardResults.has(board.id))) genericUrls.set(identity, candidate.applyUrl);
  }
  const dueChecks = [...genericUrls]
    .filter(([identity]) => needsListingCheck(listingHealth[identity]))
    .sort(([a], [b]) => new Date(listingHealth[a]?.checkedAt ?? 0).getTime() - new Date(listingHealth[b]?.checkedAt ?? 0).getTime())
    .slice(0, 250);
  const checked = await inBatches(dueChecks, 20, ([, url]) => verifyListing(url));
  for (const result of checked) {
    if (result.status === "fulfilled" && result.value) listingHealth[result.value[0]] = result.value[1];
  }

  for (const candidate of candidates) {
    const supportedRegions = getSupportedJobRegions(candidate.location);
    if (supportedRegions.length === 0) {
      rejectedCount += 1;
      continue;
    }
    if (!classifyRoleArea(candidate)) {
      quarantined.push({
        company: normalizeDisplayText(candidate.company),
        title: normalizeDisplayText(candidate.title),
        reason: "The role does not confidently match a supported App Expo category.",
        source: candidate.source,
        applyUrl: candidate.applyUrl,
      });
      continue;
    }
    const freshnessRejection = getFreshnessRejection(candidate);
    if (freshnessRejection) {
      quarantined.push({
        company: normalizeDisplayText(candidate.company),
        title: normalizeDisplayText(candidate.title),
        reason: freshnessRejection,
        source: candidate.source,
        applyUrl: candidate.applyUrl,
      });
      continue;
    }
    const decision = evaluateCompanyQuality(
      { name: candidate.company, h1bApprovals: candidate.h1bApprovals },
      candidate.rawText,
      registry,
      trustRegistry,
    );
    if (decision.status === "rejected") {
      rejectedCount += 1;
      continue;
    }
    if (decision.status === "quarantined") {
      if (trustedCuratedSources.has(candidate.source) || (candidate.source.startsWith("Direct ATS") && trustedCompanies.has(normalizeCompanyName(candidate.company)))) {
        // Simplify is our explicit coverage baseline. Its public, maintained lists retain
        // direct employer links; we still apply the non-U.S. and unpaid hard exclusions above.
      } else {
        quarantined.push({ company: normalizeDisplayText(candidate.company), title: normalizeDisplayText(candidate.title), reason: decision.reason, source: candidate.source, applyUrl: candidate.applyUrl });
        continue;
      }
    }

    const canonical = canonicalizeUrl(candidate.applyUrl)!;
    const identity = jobIdentity(canonical)!;
    const board = discoverAtsBoard(canonical, candidate.company, candidate.source);
    const authoritativeBoard = board ? boardResults.get(board.id) : null;
    if (authoritativeBoard && !authoritativeBoard.liveIdentities.has(identity)) {
      rejectedCount += 1;
      continue;
    }
    if (!authoritativeBoard && listingHealth[identity]?.status === "closed") {
      rejectedCount += 1;
      continue;
    }
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
      company: normalizeDisplayText(candidate.company),
      title: normalizeDisplayText(candidate.title),
      term: candidate.term,
      location: normalizeJobLocation(candidate.location),
      regions: supportedRegions,
      workMode: candidate.workMode,
      postedAt: keepPriorDate ? prior.postedAt : candidate.postedAt,
      postedAtSource: keepPriorDate ? prior.postedAtSource : candidate.postedAtSource,
      applyUrl: canonical,
      linkedInUrl: decision.linkedInUrl,
      category: candidate.category,
      salary: candidate.salary,
      sources: [candidate.source],
      verifiedCompany: true,
      employeeCount: decision.minimumEmployees,
    });
  }

  if (unhealthySources.length > 0 && previous) {
    for (const prior of previous.jobs) {
      const identity = jobIdentity(prior.applyUrl);
      const decision = evaluateCompanyQuality({ name: prior.company }, "", registry, trustRegistry);
      const freshnessRejection = getFreshnessRejection(prior);
      if (identity && classifyRoleArea(prior) && decision.status !== "rejected" && !freshnessRejection && !merged.has(identity)) {
        merged.set(identity, prior);
      }
    }
  }

  const jobs = [...merged.values()].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  if (jobs.length < 10) throw new Error(`Refusing to publish anomalous snapshot with only ${jobs.length} approved jobs.`);
  const snapshot: JobsSnapshot = { generatedAt: new Date().toISOString(), jobs, quarantinedCount: quarantined.length, sourceHealth: health };
  const closedPostingsCaught = Object.values(listingHealth).filter((entry) => entry.status === "closed").length;

  const currentIdentities = new Set(candidates.map((candidate) => jobIdentity(candidate.applyUrl)).filter(Boolean));
  for (const identity of Object.keys(listingHealth)) {
    const age = Date.now() - new Date(listingHealth[identity].checkedAt).getTime();
    if (!currentIdentities.has(identity) && age > 30 * 86_400_000) delete listingHealth[identity];
  }
  await mkdir(path.join(root, "data"), { recursive: true });
  await writeFile(listingHealthPath, `${JSON.stringify(listingHealth, null, 2)}\n`);
  await writeFile(path.join(root, "data/company-boards.json"), `${JSON.stringify(boardRegistry, null, 2)}\n`);

  const materialSnapshot = { jobs: snapshot.jobs, quarantinedCount: snapshot.quarantinedCount, sourceHealth: snapshot.sourceHealth };
  const previousMaterial = previous && { jobs: previous.jobs, quarantinedCount: previous.quarantinedCount, sourceHealth: previous.sourceHealth };
  if (previousMaterial && JSON.stringify(materialSnapshot) === JSON.stringify(previousMaterial)) {
    await writeFile(path.join(root, "public/summary.json"), `${JSON.stringify(buildJobsSummary(previous, { closedPostingsCaught }), null, 2)}\n`);
    console.log(`No material changes; retained ${jobs.length} published jobs.`);
    return;
  }

  await mkdir(path.join(root, "public"), { recursive: true });
  const temporary = `${output}.tmp`;
  await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`);
  await rename(temporary, output);
  await writeFile(path.join(root, "data/quarantine.json"), `${JSON.stringify({ generatedAt: snapshot.generatedAt, rejectedCount, jobs: quarantined }, null, 2)}\n`);
  const internships = { ...snapshot, jobs: snapshot.jobs.filter((job) => isInCollection(job, "internships")) };
  const fulltime = { ...snapshot, jobs: snapshot.jobs.filter((job) => isInCollection(job, "fulltime")) };
  await writeFile(path.join(root, "public/internships.json"), `${JSON.stringify(internships, null, 2)}\n`);
  await writeFile(path.join(root, "public/fulltime.json"), `${JSON.stringify(fulltime, null, 2)}\n`);
  await writeFile(path.join(root, "public/summary.json"), `${JSON.stringify(buildJobsSummary(snapshot, { closedPostingsCaught }), null, 2)}\n`);
  console.log(`Published ${jobs.length} jobs; quarantined ${quarantined.length}; rejected ${rejectedCount}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
