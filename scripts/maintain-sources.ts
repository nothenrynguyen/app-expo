import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { JobSource, SourceCatalog, SourceHealthRecord, SourceHealthState } from "../lib/source-catalog";
import { parseMarkdownSource } from "./sync-jobs";

type MaintenanceMode = "daily" | "weekly" | "monthly";
type GithubRepository = { full_name: string; default_branch: string; archived: boolean; pushed_at: string | null; name: string };

const ROOT = path.resolve(import.meta.dirname, "..");
const CATALOG_PATH = path.join(ROOT, "data/sources.json");
const HEALTH_PATH = path.join(ROOT, "data/source-health.json");
const REPORT_PATH = path.join(ROOT, "data/source-report.md");
const DISCOVERY_PATHS = ["README.md", "README-Off-Season.md", "OFFSEASON_README.md", "NEW_GRAD_USA.md"];

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return { accept: "application/vnd.github+json", "user-agent": "App-Expo-Source-Maintenance/0.1", ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

async function fetchText(url: string, github = false): Promise<string> {
  const response = await fetch(url, { headers: github ? githubHeaders() : { "user-agent": "App-Expo-Source-Maintenance/0.1" }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function fetchGithub<T>(pathName: string): Promise<T> {
  return JSON.parse(await fetchText(`https://api.github.com${pathName}`, true)) as T;
}

function emptyHealth(): SourceHealthRecord {
  return { status: "failed", lastCheckedAt: null, lastSuccessAt: null, lastRows: 0, consecutiveFailures: 0, consecutiveEmpty: 0, repositoryPushedAt: null, repositoryArchived: false, message: null };
}

async function countRows(source: JobSource): Promise<number> {
  const text = await fetchText(source.url);
  if (source.kind === "engine_json") return (JSON.parse(text) as { jobs?: unknown[] }).jobs?.length ?? 0;
  return parseMarkdownSource(text, source.name).length;
}

async function repositoryDetails(repository: string, cache: Map<string, GithubRepository | null>): Promise<GithubRepository | null> {
  if (cache.has(repository)) return cache.get(repository) ?? null;
  try {
    const details = await fetchGithub<GithubRepository>(`/repos/${repository}`);
    cache.set(repository, details);
    return details;
  } catch {
    cache.set(repository, null);
    return null;
  }
}

async function runDaily(catalog: SourceCatalog, state: SourceHealthState) {
  const now = new Date().toISOString();
  const repositoryCache = new Map<string, GithubRepository | null>();
  for (const source of catalog.sources.filter((item) => item.active)) {
    const previous = state.sources[source.id] ?? emptyHealth();
    const repository = await repositoryDetails(source.repository, repositoryCache);
    try {
      const rows = await countRows(source);
      const empty = rows === 0;
      state.sources[source.id] = {
        ...previous,
        status: empty ? "empty" : "healthy",
        lastCheckedAt: now,
        lastSuccessAt: empty ? previous.lastSuccessAt : now,
        lastRows: rows,
        consecutiveFailures: 0,
        consecutiveEmpty: empty ? previous.consecutiveEmpty + 1 : 0,
        repositoryPushedAt: repository?.pushed_at ?? previous.repositoryPushedAt,
        repositoryArchived: repository?.archived ?? previous.repositoryArchived,
        message: empty ? "The source returned no parseable jobs." : null,
      };
    } catch (error) {
      state.sources[source.id] = {
        ...previous,
        status: "failed",
        lastCheckedAt: now,
        consecutiveFailures: previous.consecutiveFailures + 1,
        repositoryPushedAt: repository?.pushed_at ?? previous.repositoryPushedAt,
        repositoryArchived: repository?.archived ?? previous.repositoryArchived,
        message: error instanceof Error ? error.message : "Unknown source failure",
      };
    }
  }
  state.updatedAt = now;
}

function sourceName(repository: GithubRepository, sourcePath: string, cycle: number): string {
  if (/off[-_]?season/i.test(sourcePath)) return `${repository.name} Off-Season ${cycle}`;
  if (/new_grad/i.test(sourcePath)) return `${repository.name} New Grad ${cycle}`;
  return `${repository.name} ${cycle}`;
}

async function runWeekly(catalog: SourceCatalog) {
  const existing = new Set(catalog.sources.map((source) => source.id.toLowerCase()));
  const highestCycle = Math.max(new Date().getUTCFullYear(), ...catalog.sources.map((source) => source.cycle ?? 0));
  const repositoryCache = new Map<string, GithubRepository | null>();
  for (const source of catalog.sources) {
    const repository = await repositoryDetails(source.repository, repositoryCache);
    if (!repository) continue;
    source.repository = repository.full_name;
    if (source.kind === "markdown" && source.path) {
      source.branch = repository.default_branch;
      source.url = `https://raw.githubusercontent.com/${repository.full_name}/${repository.default_branch}/${source.path}`;
    }
  }
  for (const owner of catalog.trustedOwners) {
    let repositories: GithubRepository[] = [];
    try {
      repositories = await fetchGithub<GithubRepository[]>(`/users/${owner}/repos?per_page=100&sort=updated`);
    } catch {
      continue;
    }
    for (const repository of repositories) {
      const cycle = Number(repository.name.match(/20\d{2}/)?.[0] ?? 0);
      if (repository.archived || cycle < highestCycle || !/(intern|college.jobs|new.grad)/i.test(repository.name)) continue;
      for (const sourcePath of DISCOVERY_PATHS) {
        const id = `github:${repository.full_name}:${sourcePath}`;
        if (existing.has(id.toLowerCase())) continue;
        const rawUrl = `https://raw.githubusercontent.com/${repository.full_name}/${repository.default_branch}/${sourcePath}`;
        try {
          const jobs = parseMarkdownSource(await fetchText(rawUrl), id);
          if (jobs.length < 5) continue;
          catalog.sources.push({
            id,
            name: sourceName(repository, sourcePath, cycle),
            kind: "markdown",
            url: rawUrl,
            repository: repository.full_name,
            path: sourcePath,
            branch: repository.default_branch,
            cycle,
            active: true,
            trustedCoverage: owner.toLowerCase() === "simplifyjobs" || (owner.toLowerCase() === "speedyapply" && /new_grad/i.test(sourcePath)),
          });
          existing.add(id.toLowerCase());
        } catch {
          // Missing and non-job README files are expected during discovery.
        }
      }
    }
  }
  catalog.sources.sort((a, b) => (b.cycle ?? 0) - (a.cycle ?? 0) || a.name.localeCompare(b.name));
}

function runMonthly(catalog: SourceCatalog, state: SourceHealthState) {
  const now = Date.now();
  for (const source of catalog.sources.filter((item) => item.active)) {
    const health = state.sources[source.id];
    if (!health) continue;
    const owner = source.repository.split("/")[0].toLowerCase();
    const hasNewerSuccessor = catalog.sources.some((candidate) => candidate.active && candidate.id !== source.id && candidate.repository.split("/")[0].toLowerCase() === owner && (candidate.cycle ?? 0) > (source.cycle ?? 0));
    const pushedAt = new Date(health.repositoryPushedAt ?? 0).getTime();
    const staleWithSuccessor = hasNewerSuccessor && Number.isFinite(pushedAt) && now - pushedAt > 120 * 86_400_000;
    const consistentlyBroken = health.consecutiveFailures >= 30 || health.consecutiveEmpty >= 14;
    const hasAlternative = catalog.sources.some((candidate) => candidate.active && candidate.id !== source.id && candidate.kind === source.kind)
      || (source.kind === "engine_json" && catalog.sources.filter((candidate) => candidate.active && candidate.kind === "markdown").length >= 3);
    if ((health.repositoryArchived && hasNewerSuccessor) || staleWithSuccessor || (consistentlyBroken && hasAlternative)) {
      source.active = false;
      state.sources[source.id] = { ...health, status: "retired", message: "Automatically retired after sustained source-health failure or replacement by a newer cycle." };
    }
  }
}

function report(catalog: SourceCatalog, state: SourceHealthState): string {
  const rows = catalog.sources.map((source) => {
    const health = state.sources[source.id] ?? emptyHealth();
    return `| ${source.active ? "Active" : "Retired"} | ${source.name.replace(/\|/g, "/")} | ${source.cycle ?? "Unknown"} | ${health.status} | ${health.lastRows} | ${health.lastSuccessAt ?? "Never"} |`;
  });
  return ["# App Expo source report", "", `Generated ${new Date().toISOString()}.`, "", "| Catalog | Source | Cycle | Health | Parsed jobs | Last success |", "| --- | --- | ---: | --- | ---: | --- |", ...rows, "", "Sources are retired only after sustained failures, repeated empty results, or replacement by a newer maintained cycle.", ""].join("\n");
}

async function main() {
  const modeArg = process.argv.find((argument) => argument.startsWith("--mode="))?.split("=")[1] ?? "daily";
  if (!(["daily", "weekly", "monthly"] as string[]).includes(modeArg)) throw new Error(`Unknown maintenance mode: ${modeArg}`);
  const mode = modeArg as MaintenanceMode;
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8")) as SourceCatalog;
  const state = await readFile(HEALTH_PATH, "utf8").then((value) => JSON.parse(value) as SourceHealthState).catch(() => ({ updatedAt: new Date(0).toISOString(), sources: {} } as SourceHealthState));
  if (mode === "daily") await runDaily(catalog, state);
  if (mode === "weekly") await runWeekly(catalog);
  if (mode === "monthly") {
    runMonthly(catalog, state);
    await writeFile(REPORT_PATH, report(catalog, state));
  }
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
  await writeFile(HEALTH_PATH, `${JSON.stringify(state, null, 2)}\n`);
  console.log(`Completed ${mode} source maintenance for ${catalog.sources.length} catalog entries.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
