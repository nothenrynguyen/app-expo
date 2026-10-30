import { preserveWorkdayJobIds, collectJobIdAliases } from "../lib/ingestion/preserve-job-ids";
import publishedJobIdAliases from "../data/job-id-aliases.json";
import { workdayEvidenceKey, workdayRecoveryPolicy, recentWorkdayEvidence, updateWorkdayContinuity, type WorkdayContinuity } from "../lib/ingestion/workday-continuity";
import { reviewedFederalCoverage } from "../lib/ingestion/usajobs";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { discoverAtsBoard } from "../lib/ats-boards";
import { currentAtsExperienceConflict } from "../lib/ingestion/ats-eligibility";
import { evaluateCompanyQuality, normalizeCompanyDisplayName, normalizeCompanyName, type CompanyTrustEntry, type VerifiedCompany } from "../lib/company-quality";
import { inBatches } from "../lib/ingestion/concurrency";
import { scopedListingIsLive, selectBalancedScopedChecks, type ScopedListingCache } from "../lib/ingestion/scoped-listing-cache";
import { boardRecoveryPolicy, preserveLastKnownGoodJobs } from "../lib/ingestion/last-known-good";
import { loadCandidates } from "../lib/ingestion/load-candidates";
import { sourceReviewHoldIdentity } from "../lib/ingestion/source-review-holds";
import { buildSourceVerificationTargets, createSourceListingVerifier, sourceVerificationKey, sourceListingIsAllowed, type SourceVerificationTargets } from "../lib/ingestion/source-verification";
import { buildRefreshReport } from "../lib/ingestion/refresh-report";
import { createScreeningTracker } from "../lib/ingestion/screening";
import { buildListingChanges, formatListingChangesSummary } from "../lib/ingestion/listing-changes";
import { createListingChangeEvidence } from "../lib/ingestion/listing-change-evidence";
import { completeBoardHistory } from "../lib/ingestion/board-history";
import { assessCoverage, assertCoverageSafe } from "../lib/ingestion/coverage-guard";
import { buildReviewedEmployerCoverage } from "../lib/ingestion/reviewed-employer-coverage";
import { permissionHeldSourceNames } from "../lib/ingestion/source-permissions";
import { admitWithCurrentEmployerEvidence, continuityMatcher, type EmployerContinuity } from "../lib/ingestion/employer-continuity";
import { isRecoveryLive, recoveryEvidenceAt } from "../lib/ingestion/employer-recovery";
import { parseSmartRecruitersJobUrl } from "../lib/smartrecruiters";
import { isInCollection } from "../lib/job-collections";
import { deduplicateCrossSourceJobs } from "../lib/job-dedup";
import { getFreshnessRejection } from "../lib/job-freshness";
import { buildJobInsightsDay, updateJobInsightsHistory, type JobInsightsHistory } from "../lib/job-insights";
import { normalizeJobLocation } from "../lib/job-locations";
import { getJobLocationMetadata } from "../lib/job-location-policy";
import { buildJobsSummary } from "../lib/job-summary";
import type { JobsSnapshot, PublicJob } from "../lib/jobs";
import { isListingUnavailable, needsListingCheck, verifyListing, type ListingHealthFile } from "../lib/listing-health";
import { classifyRoleTags, getJobRoleTags } from "../lib/role-areas";
import type { SourceCatalog } from "../lib/source-catalog";
import { canonicalizeUrl, jobIdentity, opportunityIdentity, normalizeDisplayText, stableJobId } from "../lib/source-normalization";

async function main() {
  const startedAt = new Date();
  const root = path.resolve(import.meta.dirname, "..");
  const catalog = JSON.parse(await readFile(path.join(root, "data/sources.json"), "utf8")) as SourceCatalog;
  const activeSources = catalog.sources.filter((source) => source.active);
  const licenses = JSON.parse(await readFile(path.join(root, "data/source-licenses.json"), "utf8"));
  const permissionHeldSources = permissionHeldSourceNames(catalog.sources, licenses.repositories);
  const reviewHoldIds = new Set(activeSources.flatMap(source => source.reviewHolds ?? []).map(hold => sourceReviewHoldIdentity(hold.url)).filter(Boolean));
  const trustedCuratedSources = new Set(activeSources.filter((source) => source.trustedCoverage).map((source) => source.name));
  const output = path.join(root, "public/jobs.json");
  const previous = await readFile(output, "utf8").then((value) => JSON.parse(value) as JobsSnapshot).catch(() => null);
  const previousByUrl = new Map(previous?.jobs.map((job) => [opportunityIdentity(job.applyUrl), job]) ?? []);
  const registry = JSON.parse(await readFile(path.join(root, "data/verified-companies.json"), "utf8")) as VerifiedCompany[];
  const trustRegistry = JSON.parse(await readFile(path.join(root, "data/company-trust.json"), "utf8")) as CompanyTrustEntry[];
  const listingHealthPath = path.join(root, "data/listing-health.json");
  const listingHealth: ListingHealthFile = await readFile(listingHealthPath, "utf8")
    .then((value) => JSON.parse(value) as ListingHealthFile)
    .catch(() => ({} as ListingHealthFile));
  const {
    candidates,
    preScreened = [],
    health,
    sourceDiagnostics,
    boardResults,
    boardRegistry,
    verificationDiagnostics,
    pinnedCompanies,
    boardHistory,
    boardCoverage,
    recoveryState,
    workdayChecks = [],
    workdayEvidence,
    workdaySchedule,
    retiredBoardIds = [],
  } = await loadCandidates(root, activeSources, previous?.jobs ?? []);
  const retired = new Set(retiredBoardIds);
  const usesRetiredBoard = (job: PublicJob) => {
    const board = discoverAtsBoard(job.applyUrl, job.company, "Retirement check");
    return !!board && retired.has(board.id);
  };
  const workdayCache: WorkdayContinuity = await readFile(path.join(root, "data/workday-continuity.json"), "utf8").then(value => JSON.parse(value)).catch((error: NodeJS.ErrnoException) => {if (error.code === "ENOENT") return {}; throw error;});
  const continuityData = JSON.parse(await readFile(path.join(root, "data/employer-continuity.json"), "utf8")) as EmployerContinuity;
  const hasPriorAdmission = continuityMatcher(continuityData);
  const continuityLive = (candidate: import("../lib/source-normalization").CandidateJob) => {
    if (!hasPriorAdmission(candidate)) return false;
    if (isRecoveryLive(candidate)) return true;
    if (workdayEvidence?.matches(candidate)) return true;
    const board = discoverAtsBoard(candidate.applyUrl, candidate.company, candidate.source);
    if (board && boardResults.get(board.id)?.liveIdentities.has(jobIdentity(candidate.applyUrl) ?? "")) return true;
    return !!parseSmartRecruitersJobUrl(candidate.applyUrl) && candidate.sourceActive === true;
  };
  const currentBoardEvidence = (candidate: import("../lib/source-normalization").CandidateJob) => {
    const board = discoverAtsBoard(candidate.applyUrl, candidate.company, candidate.source);
    const result = board && boardResults.get(board.id);
    return isRecoveryLive(candidate) || !!workdayEvidence?.matches(candidate) || !!result && normalizeCompanyName(result.board.company) === normalizeCompanyName(candidate.company)
      && result.liveIdentities.has(jobIdentity(candidate.applyUrl) ?? "");
  };
  const unhealthySources = health.filter((source) => source.status === "failed" || source.rows === 0);
  const merged = new Map<string, PublicJob>();
  const quarantined: Array<{ company: string; title: string; reason: string; source: string; applyUrl: string }> = [];
  let rejectedCount = 0;
  const screening = createScreeningTracker();
  for (const record of preScreened) screening.record(record.url, record.outcome);
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
    if (identity && !isRecoveryLive(candidate) && candidate.source !== "Direct ATS (Workday)" && (!board || !boardResults.has(board.id))) genericUrls.set(identity, candidate.applyUrl);
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

  // Persist recent positive employer evidence separately from generic HTTP checks.
  // Failed checks immediately invalidate older positive evidence; unchecked or stale
  // candidates remain pending. The oldest attempts receive the next bounded slots.
  const scopedCachePath = path.join(root, "data/scoped-listing-health.json");
  const scopedCache: ScopedListingCache = await readFile(scopedCachePath, "utf8").then(value => JSON.parse(value) as ScopedListingCache).catch(() => ({}));
  const scopedUrls = new Map<string, string>();
  const sourceTargetsPath = path.join(root, "data/source-verification-targets.json");
  const savedSourceTargets = await readFile(sourceTargetsPath, "utf8")
    .then(value => JSON.parse(value) as SourceVerificationTargets)
    .catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return {}; throw error; });
  const verificationCandidates = candidates.filter(candidate => {
    const decision = evaluateCompanyQuality({ name: candidate.company, h1bApprovals: candidate.h1bApprovals, title: candidate.title, applyUrl: candidate.applyUrl }, candidate.rawText, registry, trustRegistry);
    return getJobLocationMetadata(candidate).eligible && classifyRoleTags(candidate).length > 0 && !getFreshnessRejection(candidate)
      && (decision.status === "approved" || decision.coverageExceptionAllowed && (currentBoardEvidence(candidate) || continuityLive(candidate) || trustedCompanies.has(normalizeCompanyName(candidate.company))));
  });
  const sourceTargets = buildSourceVerificationTargets(catalog.sources, verificationCandidates, previous?.jobs ?? [], savedSourceTargets);
  for (const candidate of candidates) {
    const decision = evaluateCompanyQuality({ name: candidate.company, h1bApprovals: candidate.h1bApprovals, title: candidate.title, applyUrl: candidate.applyUrl }, candidate.rawText, registry, trustRegistry);
    const identity = jobIdentity(candidate.applyUrl);
    if (decision.status === "approved" && decision.requireLiveListing && identity && getJobLocationMetadata(candidate).eligible && classifyRoleTags(candidate).length > 0 && !getFreshnessRejection(candidate)) scopedUrls.set(identity, candidate.applyUrl);
  }
  for (const [key, target] of Object.entries(sourceTargets)) scopedUrls.set(key, target.url);
  for (const entry of Object.values(recentWorkdayEvidence(workdayCache, startedAt))) {
    for (const key of [jobIdentity(entry.job.applyUrl), sourceVerificationKey(entry.job.applyUrl)]) {
      if (key && (!scopedCache[key]?.checkedAt || Date.parse(scopedCache[key].checkedAt!) <= Date.parse(entry.checkedAt))) scopedCache[key] = {status: "live", checkedAt: entry.checkedAt, firstSeenAt: scopedCache[key]?.firstSeenAt ?? entry.checkedAt};
    }
  }
  for (const check of workdayChecks) for (const key of [jobIdentity(check.url), sourceVerificationKey(check.url)]) {
    if (key && check.status !== "unknown") scopedCache[key] = {status: check.status === "live" ? "live" : "unknown", checkedAt: startedAt.toISOString(), firstSeenAt: scopedCache[key]?.firstSeenAt ?? startedAt.toISOString()};
  }
  for (const identity of scopedUrls.keys()) if (!scopedCache[identity]) scopedCache[identity] = { status: "unknown", checkedAt: null, firstSeenAt: startedAt.toISOString() };
  for (const candidate of candidates) {
    const evidence = recoveryEvidenceAt(candidate);
    if (!evidence) continue;
    for (const key of [jobIdentity(candidate.applyUrl), sourceVerificationKey(candidate.applyUrl)]) {
      if (key && scopedUrls.has(key)) scopedCache[key] = {status: "live", checkedAt: evidence, firstSeenAt: scopedCache[key].firstSeenAt};
    }
  }
  // The same current authoritative board response can establish exact listing
  // membership for both gates. Do not queue redundant detail requests or keep
  // yesterday's positive result when today's official board omits the vacancy.
  for (const [identity, url] of scopedUrls) {
    const board = discoverAtsBoard(url, "Scoped availability", "Scoped availability");
    const result = board && boardResults.get(board.id);
    if (result) scopedCache[identity] = {status: result.liveIdentities.has(jobIdentity(url) ?? "") ? "live" : "unknown", checkedAt: startedAt.toISOString(), firstSeenAt: scopedCache[identity].firstSeenAt};
  }
  const scopedChecks = selectBalancedScopedChecks([...scopedUrls], scopedCache, startedAt);
  const verifySourceListing = createSourceListingVerifier({ boardResults });
  const scopedResults = await inBatches(scopedChecks, 8, async ([identity, url]) => ({ identity, live: await verifySourceListing(url) }));
  for (const result of scopedResults) if (result.status === "fulfilled") scopedCache[result.value.identity] = { status: result.value.live ? "live" : "unknown", checkedAt: startedAt.toISOString(), firstSeenAt: scopedCache[result.value.identity].firstSeenAt };
  const verifiedScopedIds = new Set([...scopedUrls.keys()].filter(identity => scopedListingIsLive(scopedCache[identity], startedAt)));
  for (const [provider, sourceGuard] of [["scoped_employer", false], ["source_listing", true]] as const) {
    const matches = (identity: string) => Boolean(sourceTargets[identity]) === sourceGuard;
    if ([...scopedUrls.keys()].some(matches)) verificationDiagnostics.push({ provider, attempted: scopedChecks.filter(([identity]) => matches(identity)).length, verified: scopedResults.filter(result => result.status === "fulfilled" && matches(result.value.identity) && result.value.live).length });
  }

  const reviewedCoverageSources = new Set(activeSources.filter(source => source.kind === "keryx_markdown").map(source => source.name));
  const reviewedCoverage = buildReviewedEmployerCoverage(candidates, trustedCuratedSources, registry, trustRegistry, candidate => {
    const identity = jobIdentity(candidate.applyUrl);
    const board = discoverAtsBoard(candidate.applyUrl, candidate.company, candidate.source);
    const authoritative = board ? boardResults.get(board.id) : null;
    return !sourceListingIsAllowed(candidate.applyUrl, sourceTargets, verifiedScopedIds)
      || (!!identity && (authoritative ? !authoritative.liveIdentities.has(identity) : isListingUnavailable(listingHealth[identity])));
  });

  const workdayTerminalKeys = new Map(workdayChecks.filter(check => check.status === "closed" || check.status === "ineligible").map(check => [workdayEvidenceKey(check.url), check.status] as const).filter(([key]) => key !== null));
  for (const candidate of candidates) {
    const terminal = workdayTerminalKeys.get(workdayEvidenceKey(candidate.applyUrl));
    if (terminal) {screening.record(candidate.applyUrl, terminal === "closed" ? "closed" : "role"); rejectedCount += 1; continue;}
    if (currentAtsExperienceConflict(candidate, boardResults)) {
      const reason = "Current employer qualifications conflict with description-only early-career evidence.";
      screening.record(candidate.applyUrl, "role", reason);
      quarantined.push({company: candidate.company, title: candidate.title, source: candidate.source, applyUrl: candidate.applyUrl, reason});
      continue;
    }
    const locationMetadata = getJobLocationMetadata(candidate);
    if (!locationMetadata.eligible) {
      screening.record(candidate.applyUrl, "location");
      rejectedCount += 1;
      continue;
    }
    const roleTags = classifyRoleTags(candidate);
    if (roleTags.length === 0) {
      screening.record(candidate.applyUrl, "role");
      quarantined.push({
        company: normalizeDisplayText(candidate.company),
        title: normalizeDisplayText(candidate.title),
        reason: "The role does not confidently match a supported empluzzed category.",
        source: candidate.source,
        applyUrl: candidate.applyUrl,
      });
      continue;
    }
    const freshnessRejection = getFreshnessRejection(candidate);
    if (freshnessRejection) {
      screening.record(candidate.applyUrl, candidate.sourceActive === false ? "closed" : "expired");
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
    let decision = evaluateCompanyQuality(
      { name: candidate.company, h1bApprovals: candidate.h1bApprovals, title: candidate.title, applyUrl: candidate.applyUrl },
      candidate.rawText,
      registry,
      trustRegistry,
    );
    const continuityAdmission = decision.status === "quarantined" && decision.coverageExceptionAllowed === true && (currentBoardEvidence(candidate) || continuityLive(candidate));
    decision = admitWithCurrentEmployerEvidence(decision, continuityAdmission);
    if (decision.status === "rejected") {
      screening.record(candidate.applyUrl, "employer");
      rejectedCount += 1;
      continue;
    }
    if (decision.status === "quarantined") {
      const inherited = reviewedCoverageSources.has(candidate.source) ? reviewedCoverage(candidate) : undefined;
      if (decision.coverageExceptionAllowed && (inherited || reviewedFederalCoverage(candidate) || trustedCuratedSources.has(candidate.source) || (candidate.source.startsWith("Direct ATS") && trustedCompanies.has(normalizeCompanyName(candidate.company))))) {
        // Reviewed feeds/boards and exact reviewed federal announcements provide coverage evidence.
        if (inherited) decision = { ...inherited, status: "approved", reason: "Matched current reviewed employer coverage on the same ATS board." };
      } else {
        screening.record(candidate.applyUrl, "pendingVerification", decision.reason);
        quarantined.push({ company: normalizeDisplayText(candidate.company), title: normalizeDisplayText(candidate.title), reason: decision.reason, source: candidate.source, applyUrl: candidate.applyUrl });
        continue;
      }
    }

    const canonical = canonicalizeUrl(candidate.applyUrl)!;
    const identity = jobIdentity(canonical)!;
    if ((scopedUrls.has(identity) && !verifiedScopedIds.has(identity)) || !sourceListingIsAllowed(candidate.applyUrl, sourceTargets, verifiedScopedIds)) {
      screening.record(candidate.applyUrl, "pendingVerification", "Current employer listing availability could not be verified.");
      quarantined.push({ company: candidate.company, title: candidate.title, reason: "Current employer listing availability could not be verified.", source: candidate.source, applyUrl: candidate.applyUrl });
      continue;
    }
    const board = discoverAtsBoard(canonical, candidate.company, candidate.source);
    const authoritativeBoard = board ? boardResults.get(board.id) : null;
    if (authoritativeBoard && !authoritativeBoard.liveIdentities.has(identity)) {
      screening.record(candidate.applyUrl, "closed");
      rejectedCount += 1;
      continue;
    }
    if (!authoritativeBoard && !isRecoveryLive(candidate) && isListingUnavailable(listingHealth[identity])) {
      screening.record(candidate.applyUrl, "closed");
      rejectedCount += 1;
      continue;
    }
    const mergeIdentity = opportunityIdentity(candidate.applyUrl)!;
    const existing = merged.get(mergeIdentity);
    if (existing) {
      if (candidate.federal) existing.federal = candidate.federal;
      if (!existing.sources.includes(candidate.source)) existing.sources.push(candidate.source);
      existing.roleTags = [...new Set([...(existing.roleTags ?? []), ...roleTags])];
      const precision = { first_seen: 0, relative_derived: 1, date_only: 2, exact: 3 } as const;
      if (precision[candidate.postedAtSource] > precision[existing.postedAtSource]) {
        existing.postedAt = candidate.postedAt;
        existing.postedAtSource = candidate.postedAtSource;
      }
      continue;
    }
    const prior = previousByUrl.get(mergeIdentity);
    const precision = { first_seen: 0, relative_derived: 1, date_only: 2, exact: 3 } as const;
    const keepPriorDate = prior && precision[prior.postedAtSource] >= precision[candidate.postedAtSource];
    merged.set(mergeIdentity, {
      id: stableJobId(identity, candidate.company, candidate.title),
      company: normalizeDisplayText(displayCompany),
      title: normalizeDisplayText(candidate.title),
      term: candidate.term,
      location: normalizeJobLocation(candidate.location),
      regions: locationMetadata.regions,
      metros: locationMetadata.metros,
      workMode: candidate.workMode,
      postedAt: keepPriorDate ? prior.postedAt : candidate.postedAt,
      postedAtSource: keepPriorDate ? prior.postedAtSource : candidate.postedAtSource,
      applyUrl: canonical,
      linkedInUrl: decision.linkedInUrl,
      category: candidate.category,
      roleTags,
      salary: candidate.salary,
      sources: [candidate.source],
      verifiedCompany: !continuityAdmission,
      employeeCount: decision.minimumEmployees,
      ...(candidate.federal ? { federal: candidate.federal } : {}),
    });
  }

  const recovery = boardRecoveryPolicy(boardRegistry, boardResults);
  const workdayRecovery = workdayRecoveryPolicy(boardRegistry, workdayChecks, workdayCache, startedAt);
  const failedSourceNames = new Set(unhealthySources.map(source => source.name));
  const acceptedVerificationKeys = new Set([...merged.values()].map(job => sourceVerificationKey(job.applyUrl)));
  if ((unhealthySources.length > 0 || recovery.hasFailures || workdayRecovery.hasFailures) && previous) {
    preservedFromLastHealthySnapshot = preserveLastKnownGoodJobs(merged, [...previous.jobs, ...workdayRecovery.jobs], (prior) => {
      if (currentAtsExperienceConflict(prior, boardResults)) return null;
      if (workdayRecovery.mayRecover(prior) && acceptedVerificationKeys.has(sourceVerificationKey(prior.applyUrl))) return null;
      // Recovery cannot carry unlicensed feed material forward during failures.
      if (prior.sources.some(source => permissionHeldSources.has(source))) return null;
      if (!recovery.mayRecover(prior, failedSourceNames) && !workdayRecovery.mayRecover(prior)) return null;
      if (reviewHoldIds.has(sourceReviewHoldIdentity(prior.applyUrl))) return null;
      if (!sourceListingIsAllowed(prior.applyUrl, sourceTargets, verifiedScopedIds)) return null;
      // A board outage recovers only that board, not unrelated missing inputs.
      if (unhealthySources.length === 0 && !recovery.affected(prior) && !workdayRecovery.mayRecover(prior)) return null;
      const decision = evaluateCompanyQuality({ name: prior.company, title: prior.title, applyUrl: prior.applyUrl }, "", registry, trustRegistry);
      if (decision.requireLiveListing && !scopedListingIsLive(scopedCache[jobIdentity(prior.applyUrl) ?? ""], startedAt)) return null;
      const freshnessRejection = getFreshnessRejection(prior);
      const roleTags = classifyRoleTags(prior);
      if (roleTags.length === 0 || decision.status === "rejected"
        || (decision.status === "quarantined" && !decision.coverageExceptionAllowed) || freshnessRejection) return null;
      const locationMetadata = getJobLocationMetadata(prior);
      if (!locationMetadata.eligible) return null;
      const location = normalizeJobLocation(prior.location);
      return {
        ...prior,
        company: normalizeCompanyDisplayName(prior.company, prior.applyUrl),
        location,
        regions: locationMetadata.regions,
        metros: locationMetadata.metros,
        roleTags,
      };
    }, (prior) => {
      return usesRetiredBoard(prior) || recovery.confirmedClosed(prior) || workdayRecovery.terminal(prior) || (!workdayRecovery.mayRecover(prior) && isListingUnavailable(listingHealth[jobIdentity(prior.applyUrl) ?? ""]));
    });
  }

  const jobs = preserveWorkdayJobIds(deduplicateCrossSourceJobs([...merged.values()]), previous?.jobs ?? [])
    .map((job) => ({ ...job, roleTags: getJobRoleTags(job) }))
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  if (jobs.length < 10) throw new Error(`Refusing to publish anomalous snapshot with only ${jobs.length} approved jobs.`);
  const allSourcesUnhealthy = health.length > 0 && unhealthySources.length === health.length;
  const snapshot: JobsSnapshot = {
    // Include accepted aliases before cross-source deduplication and recovered
    // jobs so neither can be counted as excluded through another source.
    screening: allSourcesUnhealthy ? null : screening.summarize([...merged.values()].map((job) => job.applyUrl)),
    generatedAt: new Date().toISOString(),
    jobs,
    quarantinedCount: allSourcesUnhealthy && previous ? previous.quarantinedCount : quarantined.length,
    sourceHealth: health,
  };
  const closedPostingsCaught = Object.values(listingHealth).filter((entry) => entry.status === "closed").length;

  const materialSnapshot = { jobs: snapshot.jobs, quarantinedCount: snapshot.quarantinedCount, sourceHealth: snapshot.sourceHealth, screening: snapshot.screening };
  const previousMaterial = previous && { jobs: previous.jobs, quarantinedCount: previous.quarantinedCount, sourceHealth: previous.sourceHealth, screening: previous.screening };
  const unchanged = !!previous && JSON.stringify(materialSnapshot) === JSON.stringify(previousMaterial);

  const listingChanges = buildListingChanges({
    generatedAt: snapshot.generatedAt, previousGeneratedAt: previous?.generatedAt ?? null,
    currentSnapshotGeneratedAt: unchanged ? previous!.generatedAt : snapshot.generatedAt,
    previous: previous?.jobs ?? [], current: jobs, acceptedBeforeDedup: [...merged.values()],
    candidateUrls: candidates.map(candidate => candidate.applyUrl),
    outcomeFor: url => {
      const outcome = screening.opportunityOutcomeFor(url);
      if (outcome) return outcome;
      const terminal = workdayTerminalKeys.get(workdayEvidenceKey(url));
      if (terminal) return terminal === "closed" ? "closed" : "role";
      const prior = previousByUrl.get(opportunityIdentity(url));
      if (prior?.sources.some(source => permissionHeldSources.has(source))) return "source-permission";
      return listingHealth[jobIdentity(url) ?? ""]?.status === "unavailable" ? "application-unavailable" : undefined;
    },
    boardState(prior) {
      const board = discoverAtsBoard(prior.applyUrl, prior.company, "audit");
      if (!board) return null;
      if (retired.has(board.id)) return "absent";
      const currentBoard = boardResults.get(board.id);
      if (currentBoard) return currentBoard.liveIdentities.has(jobIdentity(prior.applyUrl) ?? "") ? null : "absent";
      return boardRegistry.some(record => record.status === "failed" && record.provider === board.provider && record.key.toLowerCase() === board.key.toLowerCase()) ? "unavailable" : null;
    },
    evidenceFor: createListingChangeEvidence({ startedAt, generatedAt: snapshot.generatedAt, listingHealth,
      workdayChecks, boardRegistry, boardResults, sourceDiagnostics, retired, screeningFor: screening.decisionsFor }),
  });
  const changeSummary = formatListingChangesSummary(listingChanges);
  console.log(changeSummary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, changeSummary);
  const coverage = { boards: boardCoverage, collections: assessCoverage(previous?.jobs ?? [], jobs, listingChanges) };
  // Persist retry facts even when the proposed snapshot is rejected. These do
  // not grant admission; accepted continuity and publication remain gated.
  if (workdaySchedule) await writeFile(path.join(root, "data/workday-schedule.json"), `${JSON.stringify(workdaySchedule, null, 2)}\n`);
  if (recoveryState && Object.keys(recoveryState).length) await writeFile(path.join(root, "data/employer-recovery-state.json"), `${JSON.stringify(recoveryState, null, 2)}\n`);
  if (coverage.collections.some(row => row.largeDrop || row.blocked)) console.warn("Coverage alert:", JSON.stringify(coverage));
  try { assertCoverageSafe(coverage.collections); }
  catch (error) {
    await mkdir(path.join(root, ".cache"), { recursive: true });
    await writeFile(path.join(root, ".cache/refresh-blocked.json"), `${JSON.stringify({ coverage, listingChanges, refreshDiagnostics: { sources: sourceDiagnostics, boards: boardRegistry } }, null, 2)}\n`);
    throw error;
  }

  const currentIdentities = new Set(candidates.map((candidate) => jobIdentity(candidate.applyUrl)).filter(Boolean));
  for (const identity of Object.keys(listingHealth)) {
    const age = Date.now() - new Date(listingHealth[identity].checkedAt).getTime();
    if (!currentIdentities.has(identity) && age > 30 * 86_400_000) delete listingHealth[identity];
  }
  await mkdir(path.join(root, "data"), { recursive: true });
  // Public IDs only. Keep compatibility when an opening later leaves the feed.
  const jobIdAliases = collectJobIdAliases(jobs, publishedJobIdAliases);
  await writeFile(path.join(root, "data/job-id-aliases.json"), `${JSON.stringify(jobIdAliases, null, 2)}\n`);
  await writeFile(path.join(root, "data/workday-continuity.json"), `${JSON.stringify(updateWorkdayContinuity(workdayCache, workdayChecks, jobs, startedAt), null, 2)}\n`);
  for (const [identity, record] of Object.entries(scopedCache)) {
    if (!scopedUrls.has(identity) && startedAt.getTime() - Date.parse(record.checkedAt ?? record.firstSeenAt) > 30 * 86_400_000) delete scopedCache[identity];
  }
  if (Object.keys(scopedCache).length) await writeFile(scopedCachePath, `${JSON.stringify(scopedCache, null, 2)}\n`);
  await writeFile(sourceTargetsPath, `${JSON.stringify(sourceTargets, null, 2)}\n`);
  await writeFile(listingHealthPath, `${JSON.stringify(listingHealth, null, 2)}\n`);
  await writeFile(path.join(root, "data/company-boards.json"), `${JSON.stringify(boardRegistry, null, 2)}\n`);
  await writeFile(path.join(root, "data/board-history.json"), `${JSON.stringify(completeBoardHistory(boardHistory, boardRegistry, startedAt), null, 2)}\n`);
  const refreshReport = buildRefreshReport({
    listingChanges: { path: "data/listing-changes.json", reconciliation: listingChanges.reconciliation, categoryCounts: listingChanges.categoryCounts },
    coverage,
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
    screening: snapshot.screening,
  });
  await writeFile(path.join(root, "data/refresh-report.json"), `${JSON.stringify(refreshReport, null, 2)}\n`);
  await writeFile(path.join(root, "data/listing-changes.json"), `${JSON.stringify(listingChanges, null, 2)}\n`);

  await mkdir(path.join(root, "public"), { recursive: true });
  const insightsHistoryPath = path.join(root, "public/insights-history.json");
  const insightsHistory = await readFile(insightsHistoryPath, "utf8")
    .then((value) => JSON.parse(value) as JobInsightsHistory)
    .catch(() => ({ version: 1 as const, days: [] }));
  const nextInsightsHistory = updateJobInsightsHistory(insightsHistory, buildJobInsightsDay(snapshot, { closedPostingsCaught }));
  await writeFile(insightsHistoryPath, `${JSON.stringify(nextInsightsHistory, null, 2)}\n`);

  if (unchanged) {
    await writeFile(path.join(root, "public/summary.json"), `${JSON.stringify(buildJobsSummary(snapshot, refreshReport), null, 2)}\n`);
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
  await writeFile(path.join(root, "public/summary.json"), `${JSON.stringify(buildJobsSummary(snapshot, refreshReport), null, 2)}\n`);
  console.log(`Published ${jobs.length} jobs; quarantined ${quarantined.length}; rejected ${rejectedCount}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
