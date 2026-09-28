import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { discoverAtsBoard } from "../lib/ats-boards";
import { evaluateCompanyQuality, normalizeCompanyDisplayName, normalizeCompanyName, type CompanyTrustEntry, type VerifiedCompany } from "../lib/company-quality";
import { inBatches } from "../lib/ingestion/concurrency";
import { preserveLastKnownGoodJobs } from "../lib/ingestion/last-known-good";
import { loadCandidates } from "../lib/ingestion/load-candidates";
import { buildRefreshReport } from "../lib/ingestion/refresh-report";
import { isInCollection } from "../lib/job-collections";
import { deduplicateCrossSourceJobs } from "../lib/job-dedup";
import { getFreshnessRejection } from "../lib/job-freshness";
import { buildJobInsightsDay, updateJobInsightsHistory, type JobInsightsHistory } from "../lib/job-insights";
import { classifyJobMetros, getSupportedJobRegions, normalizeJobLocation } from "../lib/job-locations";
import { buildJobsSummary } from "../lib/job-summary";
import type { JobsSnapshot, PublicJob } from "../lib/jobs";
import { needsListingCheck, verifyListing, type ListingHealthFile } from "../lib/listing-health";
import { classifyRoleTags, getJobRoleTags } from "../lib/role-areas";
import type { SourceCatalog } from "../lib/source-catalog";
import { canonicalizeUrl, jobIdentity, normalizeDisplayText, stableJobId } from "../lib/source-normalization";

async function main() {
  const startedAt = new Date();
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
  const {
    candidates,
    health,
    sourceDiagnostics,
    boardResults,
    boardRegistry,
    verificationDiagnostics,
    pinnedCompanies,
  } = await loadCandidates(root, activeSources);
  const unhealthySources = health.filter((source) => source.status === "failed" || source.rows === 0);
  const merged = new Map<string, PublicJob>();
  const quarantined: Array<{ company: string; title: string; reason: string; source: string; applyUrl: string }> = [];
  let rejectedCount = 0;
  let preservedFromLastHealthySnapshot = 0;

  const trustedCompanies = new Set([
    ...candidates
      .filter((candidate) => trustedCuratedSources.has(candidate.source))
      .map((candidate) => normalizeCompanyName(candidate.company)),
    ...pinnedCompanies.map(normalizeCompanyName),
  ]);
  const genericUrls = new Map<string, string>();
  for (const candidate of candidates) {
    const identity = jobIdentity(candidate.applyUrl);
    const board = discoverAtsBoard(candidate.applyUrl, candidate.company, candidate.source);
    if (identity && candidate.source !== "Direct ATS (Workday)" && (!board || !boardResults.has(board.id))) genericUrls.set(identity, candidate.applyUrl);
  }
  const dueChecks = [...genericUrls]
    .filter(([identity]) => needsListingCheck(listingHealth[identity]))
    .sort(([a], [b]) => new Date(listingHealth[a]?.checkedAt ?? 0).getTime() - new Date(listingHealth[b]?.checkedAt ?? 0).getTime())
    .slice(0, 250);
  const checked = await inBatches(dueChecks, 20, ([, url]) => verifyListing(url));
  let completedListingChecks = 0;
  for (const result of checked) {
    if (result.status === "fulfilled" && result.value) {
      listingHealth[result.value[0]] = result.value[1];
      completedListingChecks += 1;
    }
  }

  for (const candidate of candidates) {
    const supportedRegions = getSupportedJobRegions(candidate.location);
    if (supportedRegions.length === 0) {
      rejectedCount += 1;
      continue;
    }
    const roleTags = classifyRoleTags(candidate);
    if (roleTags.length === 0) {
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
    const displayCompany = normalizeCompanyDisplayName(candidate.company, candidate.applyUrl);
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
        // Reviewed community lists and pinned employer boards are the explicit coverage baseline.
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
      existing.roleTags = [...new Set([...(existing.roleTags ?? []), ...roleTags])];
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
      company: normalizeDisplayText(displayCompany),
      title: normalizeDisplayText(candidate.title),
      term: candidate.term,
      location: normalizeJobLocation(candidate.location),
      regions: supportedRegions,
      metros: classifyJobMetros(candidate.location),
      workMode: candidate.workMode,
      postedAt: keepPriorDate ? prior.postedAt : candidate.postedAt,
      postedAtSource: keepPriorDate ? prior.postedAtSource : candidate.postedAtSource,
      applyUrl: canonical,
      linkedInUrl: decision.linkedInUrl,
      category: candidate.category,
      roleTags,
      salary: candidate.salary,
      sources: [candidate.source],
      verifiedCompany: true,
      employeeCount: decision.minimumEmployees,
    });
  }

  if (unhealthySources.length > 0 && previous) {
    preservedFromLastHealthySnapshot = preserveLastKnownGoodJobs(merged, previous.jobs, (prior) => {
      const decision = evaluateCompanyQuality({ name: prior.company }, "", registry, trustRegistry);
      const freshnessRejection = getFreshnessRejection(prior);
      const roleTags = classifyRoleTags(prior);
      if (roleTags.length === 0 || decision.status === "rejected" || freshnessRejection) return null;
      const location = normalizeJobLocation(prior.location);
      return {
        ...prior,
        company: normalizeCompanyDisplayName(prior.company, prior.applyUrl),
        location,
        regions: getSupportedJobRegions(location),
        metros: classifyJobMetros(location),
        roleTags,
      };
    });
  }

  const jobs = deduplicateCrossSourceJobs([...merged.values()])
    .map((job) => ({ ...job, roleTags: getJobRoleTags(job) }))
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  if (jobs.length < 10) throw new Error(`Refusing to publish anomalous snapshot with only ${jobs.length} approved jobs.`);
  const allSourcesUnhealthy = health.length > 0 && unhealthySources.length === health.length;
  const snapshot: JobsSnapshot = {
    generatedAt: new Date().toISOString(),
    jobs,
    quarantinedCount: allSourcesUnhealthy && previous ? previous.quarantinedCount : quarantined.length,
    sourceHealth: health,
  };
  const closedPostingsCaught = Object.values(listingHealth).filter((entry) => entry.status === "closed").length;

  const currentIdentities = new Set(candidates.map((candidate) => jobIdentity(candidate.applyUrl)).filter(Boolean));
  for (const identity of Object.keys(listingHealth)) {
    const age = Date.now() - new Date(listingHealth[identity].checkedAt).getTime();
    if (!currentIdentities.has(identity) && age > 30 * 86_400_000) delete listingHealth[identity];
  }
  await mkdir(path.join(root, "data"), { recursive: true });
  await writeFile(listingHealthPath, `${JSON.stringify(listingHealth, null, 2)}\n`);
  await writeFile(path.join(root, "data/company-boards.json"), `${JSON.stringify(boardRegistry, null, 2)}\n`);
  const refreshReport = buildRefreshReport({
    startedAt,
    sourceDiagnostics,
    boardDiagnostics: boardRegistry,
    verificationDiagnostics,
    candidates: candidates.length,
    accepted: jobs.length,
    quarantined: quarantined.length,
    rejected: rejectedCount,
    preservedFromLastHealthySnapshot,
    checksAttempted: dueChecks.length,
    checksCompleted: completedListingChecks,
    knownClosed: closedPostingsCaught,
  });
  await writeFile(path.join(root, "data/refresh-report.json"), `${JSON.stringify(refreshReport, null, 2)}\n`);

  await mkdir(path.join(root, "public"), { recursive: true });
  const insightsHistoryPath = path.join(root, "public/insights-history.json");
  const insightsHistory = await readFile(insightsHistoryPath, "utf8")
    .then((value) => JSON.parse(value) as JobInsightsHistory)
    .catch(() => ({ version: 1 as const, days: [] }));
  const nextInsightsHistory = updateJobInsightsHistory(insightsHistory, buildJobInsightsDay(snapshot, { closedPostingsCaught }));
  await writeFile(insightsHistoryPath, `${JSON.stringify(nextInsightsHistory, null, 2)}\n`);

  const materialSnapshot = { jobs: snapshot.jobs, quarantinedCount: snapshot.quarantinedCount, sourceHealth: snapshot.sourceHealth };
  const previousMaterial = previous && { jobs: previous.jobs, quarantinedCount: previous.quarantinedCount, sourceHealth: previous.sourceHealth };
  if (previousMaterial && JSON.stringify(materialSnapshot) === JSON.stringify(previousMaterial)) {
    await writeFile(path.join(root, "public/summary.json"), `${JSON.stringify(buildJobsSummary(previous, { closedPostingsCaught }), null, 2)}\n`);
    console.log(`No material changes; retained ${jobs.length} published jobs.`);
    return;
  }

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
