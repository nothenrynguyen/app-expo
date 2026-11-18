import { preserveWorkdayJobIds, collectJobIdAliases } from "../lib/ingestion/preserve-job-ids";
import { careerPageEvidenceAt, needsCareerPageEvidence } from "../lib/ingestion/reviewed-career-pages";
import { buildVerificationBacklog } from "../lib/ingestion/verification-backlog";
import { trustedWorkdayFeedPolicy, type TrustedFeedState } from "../lib/ingestion/trusted-workday-feed";
import { buildOutageHolds, validateOutageHolds } from "../lib/ingestion/outage-holds";
import { availabilityInventory } from "../lib/ingestion/availability-inventory";
import { lastVerificationAt, canRestoreHeldJob } from "../lib/ingestion/last-verification";
import { persistRefreshState } from "../lib/ingestion/refresh-state";
import { createWorkdayRequestGate } from "../lib/ingestion/workday-request-gate";
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
import { allSnapshotJobs, type JobsSnapshot, type PublicJob } from "../lib/jobs";
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
  const previousJobs = allSnapshotJobs(previous);
  const previousByUrl = new Map(previousJobs.map((job) => [opportunityIdentity(job.applyUrl), job]));
  const priorHeldById = new Map(previousJobs.filter(job => job.verification?.status === "awaiting")
    .flatMap(job => [job.id, ...(job.previousIds ?? [])].map(id => [publishedJobIdAliases[id as keyof typeof publishedJobIdAliases] ?? id, job] as const)));
  const registry = JSON.parse(await readFile(path.join(root, "data/verified-companies.json"), "utf8")) as VerifiedCompany[];
  const trustRegistry = JSON.parse(await readFile(path.join(root, "data/company-trust.json"), "utf8")) as CompanyTrustEntry[];
  const listingHealthPath = path.join(root, "data/listing-health.json");
  const listingHealth: ListingHealthFile = await readFile(listingHealthPath, "utf8")
    .then((value) => JSON.parse(value) as ListingHealthFile)
    .catch(() => ({} as ListingHealthFile));
  const {
    reviewedCareerRequests = 0,
    reviewedCareerObservations = [],
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
  } = await loadCandidates(root, activeSources, previousJobs);
  for(const observation of reviewedCareerObservations) {
    const id=jobIdentity(observation.url);
    const old=id?listingHealth[id]:undefined;
    if(id && (!old || Date.parse(old.checkedAt)<Date.parse(observation.checkedAt)
      || old.checkedAt===observation.checkedAt && observation.status==="closed")) listingHealth[id]=observation;
  }
  const retired = new Set(retiredBoardIds);
  const requestGate = createWorkdayRequestGate(workdaySchedule ?? {});
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
    return isRecoveryLive(candidate) || !!careerPageEvidenceAt(candidate) || !!workdayEvidence?.matches(candidate) || !!result && normalizeCompanyName(result.board.company) === normalizeCompanyName(candidate.company)
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
    if (identity && !needsCareerPageEvidence(candidate) && !isRecoveryLive(candidate) && candidate.source !== "Direct ATS (Workday)" && (!board || !boardResults.has(board.id))) genericUrls.set(identity, candidate.applyUrl);
  }
  const dueChecks = [...genericUrls]
    .filter(([, url]) => requestGate.canRequest(url))
    .filter(([identity]) => needsListingCheck(listingHealth[identity]))
    .sort(([a], [b]) => new Date(listingHealth[a]?.checkedAt ?? 0).getTime() - new Date(listingHealth[b]?.checkedAt ?? 0).getTime())
    .slice(0, Math.max(0,250-reviewedCareerRequests));
  const checked = await inBatches(dueChecks, 20, ([, url]) => verifyListing(url, startedAt, requestGate.fetch));
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
  const sourceTargets = buildSourceVerificationTargets(catalog.sources, verificationCandidates, previousJobs, savedSourceTargets);
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
    const evidence = recoveryEvidenceAt(candidate) ?? careerPageEvidenceAt(candidate);
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
  const publishedScopedIds = new Set(previousJobs.flatMap(job => [jobIdentity(job.applyUrl), sourceVerificationKey(job.applyUrl)]).filter((id): id is string => !!id));
  const scopedChecks = selectBalancedScopedChecks([...scopedUrls].filter(([, url]) => requestGate.canRequest(url)), scopedCache, new Date(), 150, publishedScopedIds);
  const verifySourceListing = createSourceListingVerifier({ boardResults, fetchImpl: requestGate.fetch });
  const postingChecks = new Map<string, Promise<boolean>>();
  const scopedResults = await inBatches(scopedChecks, 8, async ([identity, url]) => {
    if (!requestGate.canRequest(url)) throw new Error("Workday host is in cooldown");
    // The same exact URL may need both employer and source admission checks.
    // Share that observation without transferring evidence across job sites.
    if (!postingChecks.has(url)) postingChecks.set(url, verifySourceListing(url));
    return { identity, live: await postingChecks.get(url)! };
  });
  for (const result of scopedResults) if (result.status === "fulfilled") scopedCache[result.value.identity] = { status: result.value.live ? "live" : "unknown", checkedAt: startedAt.toISOString(), firstSeenAt: scopedCache[result.value.identity].firstSeenAt };
  const observationTime = new Date();
  const verifiedScopedIds = new Set([...scopedUrls.keys()].filter(identity => scopedListingIsLive(scopedCache[identity], observationTime)));
  const feedStatePath = path.join(root, "data/trusted-feed-observations.json");
  const feedState: TrustedFeedState = await readFile(feedStatePath, "utf8").then(value => JSON.parse(value))
    .catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return {}; throw error; });
  const feedPolicy = trustedWorkdayFeedPolicy({ sources: activeSources.filter(source => !permissionHeldSources.has(source.name)),
    diagnostics: sourceDiagnostics, boards: boardRegistry, candidates, state: feedState, now: observationTime });
  const fallbackAccepted = new Set<string>();
  const strictSourceIds = new Set(catalog.sources.filter(source => source.requireLiveListing && !source.workdayFeedFallback).map(source => source.id));
  const careerChecks=new Map(candidates.flatMap(row=>{const checkedAt=careerPageEvidenceAt(row);return checkedAt?[[opportunityIdentity(row.applyUrl)!,{company:row.company,checkedAt}] as const]:[];}));
  const lastPositiveAt = (job: PublicJob) => lastVerificationAt(job, observationTime, {
    workdayCache, workdayChecks, recoveryState: recoveryState ?? {}, listingHealth, scopedCache, boardResults,
    careerChecks,
  });
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
    if(needsCareerPageEvidence(candidate) && isListingUnavailable(listingHealth[jobIdentity(candidate.applyUrl)??""])) {
      screening.record(candidate.applyUrl,"closed");continue;
    }
    if (needsCareerPageEvidence(candidate) && !careerPageEvidenceAt(candidate)) {
      screening.record(candidate.applyUrl,"pendingVerification","The reviewed employer page must confirm the exact job, location and early-career qualifications.");
      continue;
    }
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
    // Availability fallback never promotes a quarantined employer. Every role,
    // location, freshness and employer gate above must already have passed.
    const strictSourceGate = sourceTargets[sourceVerificationKey(canonical) ?? ""]?.sourceIds.some(id => strictSourceIds.has(id));
    const feedEvidence = decision.status === "approved" && !strictSourceGate ? feedPolicy.evidenceFor(candidate) : undefined;
    const identity = jobIdentity(canonical)!;
    const candidateId = stableJobId(identity, candidate.company, candidate.title);
    const directPrior = previousByUrl.get(opportunityIdentity(canonical));
    const heldPrior = directPrior?.verification?.status === "awaiting" ? directPrior
      : priorHeldById.get(publishedJobIdAliases[candidateId as keyof typeof publishedJobIdAliases] ?? candidateId);
    let needsFeedRestoration = false;
    if (heldPrior?.verification?.status === "awaiting") {
      const positive = lastPositiveAt({...heldPrior, lastVerifiedAt: null, verification: undefined});
      needsFeedRestoration = !canRestoreHeldJob(heldPrior, positive, observationTime);
      if (needsFeedRestoration && !feedEvidence) {
        screening.record(candidate.applyUrl, "pendingVerification", "Fresh positive employer evidence is required to restore this held listing.");
        continue;
      }
    }
    const needsAvailability = (scopedUrls.has(identity) && !verifiedScopedIds.has(identity)) || !sourceListingIsAllowed(candidate.applyUrl, sourceTargets, verifiedScopedIds);
    if (needsAvailability && !feedEvidence) {
      screening.record(candidate.applyUrl, "pendingVerification", "Current employer listing availability could not be verified.");
      quarantined.push({ company: candidate.company, title: candidate.title, reason: "Current employer listing availability could not be verified.", source: candidate.source, applyUrl: candidate.applyUrl });
      continue;
    }
    const board = discoverAtsBoard(canonical, candidate.company, candidate.source);
    const authoritativeBoard = board ? boardResults.get(board.id) : null;
    if (authoritativeBoard && !authoritativeBoard.liveIdentities.has(identity)) {
      screening.record(candidate.applyUrl, authoritativeBoard.unverifiedIdentities?.has(identity) ? "pendingVerification" : "closed");
      rejectedCount += 1;
      continue;
    }
    if (!authoritativeBoard && !isRecoveryLive(candidate) && !careerPageEvidenceAt(candidate) && isListingUnavailable(listingHealth[identity])) {
      screening.record(candidate.applyUrl, "closed");
      rejectedCount += 1;
      continue;
    }
    const mergeIdentity = opportunityIdentity(candidate.applyUrl)!;
    const usedFeedFallback = !!feedEvidence && (needsAvailability || needsFeedRestoration);
    if (usedFeedFallback) fallbackAccepted.add(mergeIdentity);
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
      ...(usedFeedFallback ? { availabilityEvidence: feedEvidence } : {}),
      ...(candidate.federal ? { federal: candidate.federal } : {}),
    });
  }

  const recovery = boardRecoveryPolicy(boardRegistry, boardResults);
  const workdayRecovery = workdayRecoveryPolicy(boardRegistry, workdayChecks, workdayCache, startedAt);
  const failedSourceNames = new Set(unhealthySources.map(source => source.name));
  const acceptedVerificationKeys = new Set([...merged.values()].map(job => sourceVerificationKey(job.applyUrl)));
  if ((unhealthySources.length > 0 || recovery.hasFailures || workdayRecovery.hasFailures) && previous) {
    preservedFromLastHealthySnapshot = preserveLastKnownGoodJobs(merged, [...previousJobs, ...workdayRecovery.jobs], (prior) => {
      // Held jobs return only through normal admission with fresh evidence.
      // Outage recovery may not silently promote an old unverified listing.
      const positive = lastPositiveAt(prior);
      if (prior.verification?.status === "awaiting" || !positive || observationTime.getTime() - Date.parse(positive) >= 24 * 3600_000) return null;
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

  let jobs: PublicJob[] = preserveWorkdayJobIds(deduplicateCrossSourceJobs([...merged.values()]), previousJobs)
    .map((job) => ({ ...job, roleTags: getJobRoleTags(job), lastVerifiedAt: lastPositiveAt(job) }))
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

  const changeInput: Parameters<typeof buildListingChanges>[0] = {
    generatedAt: snapshot.generatedAt, previousGeneratedAt: previous?.generatedAt ?? null,
    currentSnapshotGeneratedAt: snapshot.generatedAt,
    previous: previousJobs, current: jobs, acceptedBeforeDedup: [...merged.values()],
    candidateUrls: candidates.map(candidate => candidate.applyUrl),
    outcomeFor: url => {
      const prior = previousByUrl.get(opportunityIdentity(url));
      if (reviewHoldIds.has(sourceReviewHoldIdentity(url))) return "employer";
      if (prior) {
        if (prior.sources.some(source => permissionHeldSources.has(source))) return "source-permission";
        if (getFreshnessRejection(prior)) return "expired";
        if (!getJobLocationMetadata(prior).eligible) return "location";
        if (!classifyRoleTags(prior).length) return "role";
        if (evaluateCompanyQuality({name: prior.company, title: prior.title, applyUrl: prior.applyUrl}, "", registry, trustRegistry).status === "rejected") return "employer";
      }
      const outcome = screening.opportunityOutcomeFor(url);
      if (outcome) return outcome;
      const terminal = workdayTerminalKeys.get(workdayEvidenceKey(url));
      if (terminal) return terminal === "closed" ? "closed" : "role";
      return listingHealth[jobIdentity(url) ?? ""]?.status === "unavailable" ? "application-unavailable" : undefined;
    },
    boardState(prior) {
      const board = discoverAtsBoard(prior.applyUrl, prior.company, "audit");
      if (!board) return null;
      if (retired.has(board.id)) return "absent";
      const currentBoard = boardResults.get(board.id);
      if (currentBoard?.unverifiedIdentities?.has(jobIdentity(prior.applyUrl) ?? "")) return "unavailable";
      if (currentBoard) return currentBoard.liveIdentities.has(jobIdentity(prior.applyUrl) ?? "") ? null : "absent";
      return boardRegistry.some(record => record.status === "failed" && record.provider === board.provider && record.key.toLowerCase() === board.key.toLowerCase()) ? "unavailable" : null;
    },
    evidenceFor: createListingChangeEvidence({ startedAt, generatedAt: snapshot.generatedAt, listingHealth,
      workdayChecks, boardRegistry, boardResults, sourceDiagnostics, retired, screeningFor: screening.decisionsFor }),
  };
  let proposedChanges = buildListingChanges(changeInput);
  const awaitingVerification = buildOutageHolds(previousJobs, proposedChanges, observationTime, lastPositiveAt);
  const publicationAliases = collectJobIdAliases([...jobs, ...awaitingVerification], publishedJobIdAliases);
  jobs = availabilityInventory(jobs, awaitingVerification, publicationAliases);
  snapshot.jobs = jobs;
  changeInput.current = jobs;
  proposedChanges = buildListingChanges(changeInput);
  validateOutageHolds(previousJobs, jobs, awaitingVerification, proposedChanges, observationTime, lastPositiveAt);
  snapshot.awaitingVerification = awaitingVerification;
  const trackedJobs = [...jobs, ...awaitingVerification];
  const materialSnapshot = { jobs: snapshot.jobs, awaitingVerification, quarantinedCount: snapshot.quarantinedCount, sourceHealth: snapshot.sourceHealth, screening: snapshot.screening };
  const previousMaterial = previous && { jobs: previous.jobs, awaitingVerification: previous.awaitingVerification ?? [], quarantinedCount: previous.quarantinedCount, sourceHealth: previous.sourceHealth, screening: previous.screening };
  const unchanged = !!previous && JSON.stringify(materialSnapshot) === JSON.stringify(previousMaterial);
  const listingChanges = {...buildListingChanges({...changeInput, current: trackedJobs,
    currentSnapshotGeneratedAt: unchanged ? previous!.generatedAt : snapshot.generatedAt}),
    availability: { current: jobs.length, awaitingVerification: awaitingVerification.length, tracked: trackedJobs.length },
    verificationTransitions: { held: awaitingVerification.filter(job => !previousByUrl.get(opportunityIdentity(job.applyUrl))?.verification).map(job => job.id),
      restored: jobs.filter(job => previousByUrl.get(opportunityIdentity(job.applyUrl))?.verification?.status === "awaiting").map(job => job.id) },
    outageEvidence: proposedChanges.removedOpportunities.filter(row => awaitingVerification.some(job => opportunityIdentity(job.applyUrl) === row.identity)) };
  const changeSummary = formatListingChangesSummary(listingChanges);
  console.log(changeSummary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, changeSummary);
  const coverage = { boards: boardCoverage, availability: listingChanges.availability,
    collections: assessCoverage(previousJobs, trackedJobs, listingChanges) };
  // Observations survive blocked publication. This preserves exact checkedAt
  // values, invalidations and queue progress, without changing admission rules.
  // Workday continuity is still limited to jobs that passed every admission
  // gate in this proposed snapshot, and terminal checks remove old evidence.
  const currentIdentities = new Set(candidates.map((candidate) => jobIdentity(candidate.applyUrl)).filter(Boolean));
  for (const identity of Object.keys(listingHealth)) {
    const age = startedAt.getTime() - new Date(listingHealth[identity].checkedAt).getTime();
    if (!currentIdentities.has(identity) && age > 30 * 86_400_000) delete listingHealth[identity];
  }
  for (const [identity, record] of Object.entries(scopedCache)) {
    if (!scopedUrls.has(identity) && startedAt.getTime() - Date.parse(record.checkedAt ?? record.firstSeenAt) > 30 * 86_400_000) delete scopedCache[identity];
  }
  await persistRefreshState(root, { listingHealth, scopedCache, sourceTargets,
    workdayContinuity: updateWorkdayContinuity(workdayCache, workdayChecks, jobs, startedAt),
    workdaySchedule: workdaySchedule ?? {}, recoveryState: recoveryState ?? {} });
  await writeFile(`${feedStatePath}.tmp`, `${JSON.stringify(feedPolicy.state, null, 2)}\n`);
  await rename(`${feedStatePath}.tmp`, feedStatePath);
  if (coverage.collections.some(row => row.largeDrop || row.blocked)) console.warn("Coverage alert:", JSON.stringify(coverage));
  try { assertCoverageSafe(coverage.collections); }
  catch (error) {
    await mkdir(path.join(root, ".cache"), { recursive: true });
    await writeFile(path.join(root, ".cache/refresh-blocked.json"), `${JSON.stringify({ coverage, listingChanges, refreshDiagnostics: { sources: sourceDiagnostics, boards: boardRegistry, verification: verificationDiagnostics, scopedQueue: { eligible: scopedUrls.size, selected: scopedChecks.length, publishedSelected: scopedChecks.filter(([id]) => publishedScopedIds.has(id)).length, verified: verifiedScopedIds.size, paused: [...scopedUrls.values()].filter(url => !requestGate.canRequest(url)).length } } }, null, 2)}\n`);
    throw error;
  }

  await mkdir(path.join(root, "data"), { recursive: true });
  // Public IDs only. Keep compatibility when an opening later leaves the feed.
  const jobIdAliases = collectJobIdAliases(trackedJobs, publicationAliases);
  await writeFile(path.join(root, "data/job-id-aliases.json"), `${JSON.stringify(jobIdAliases, null, 2)}\n`);
  await writeFile(path.join(root, "data/company-boards.json"), `${JSON.stringify(boardRegistry, null, 2)}\n`);
  await writeFile(path.join(root, "data/board-history.json"), `${JSON.stringify(completeBoardHistory(boardHistory, boardRegistry, startedAt), null, 2)}\n`);
  const refreshReport = { ...buildRefreshReport({
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
  }), verificationBacklog: buildVerificationBacklog({ candidates,
    acceptedUrls: [...jobs, ...merged.values()].map(job => job.applyUrl), outcomeFor: screening.opportunityOutcomeFor }), intake: {
    candidateRows: candidates.length,
    uniqueOpportunities: new Set(candidates.map(candidate => opportunityIdentity(candidate.applyUrl)).filter(Boolean)).size,
    duplicateRows: candidates.length - new Set(candidates.map(candidate => opportunityIdentity(candidate.applyUrl)).filter(Boolean)).size,
    trustedWorkdayFeed: { ...feedPolicy.counts, admitted: jobs.filter(job => fallbackAccepted.has(opportunityIdentity(job.applyUrl)!)).length },
    bySource: [...Map.groupBy(candidates, candidate => candidate.source)].map(([source, rows]) => ({
      source, rows: rows.length, uniqueOpportunities: new Set(rows.map(row => opportunityIdentity(row.applyUrl)).filter(Boolean)).size,
      workdayOpportunities: new Set(rows.map(row => workdayEvidenceKey(row.applyUrl)).filter(Boolean)).size,
    })).sort((a, b) => b.uniqueOpportunities - a.uniqueOpportunities),
  } };
  await writeFile(path.join(root, "data/refresh-report.json"), `${JSON.stringify(refreshReport, null, 2)}\n`);
  await writeFile(path.join(root, "data/listing-changes.json"), `${JSON.stringify(listingChanges, null, 2)}\n`);
  if (refreshReport.status === "failed") throw new Error("All sources failed; snapshot publication blocked.");
  if (refreshReport.status === "degraded" || awaitingVerification.length) {
    console.warn(`Refresh warning: healthy-source updates are ready; ${awaitingVerification.length} prior jobs remain held for verification.`);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY,
      `\n### Source availability warning\nRefresh completed with ${jobs.length} current listings. ${awaitingVerification.length} prior jobs are retained internally for verification and excluded from current results. Source warnings do not fail this run; code, publication and coverage failures still do.\n`);
  }

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
  const internships = { ...snapshot, jobs: snapshot.jobs.filter((job) => isInCollection(job, "internships")), awaitingVerification: awaitingVerification.filter(job => isInCollection(job, "internships")) };
  const fulltime = { ...snapshot, jobs: snapshot.jobs.filter((job) => isInCollection(job, "fulltime")), awaitingVerification: awaitingVerification.filter(job => isInCollection(job, "fulltime")) };
  await writeFile(path.join(root, "public/internships.json"), `${JSON.stringify(internships, null, 2)}\n`);
  await writeFile(path.join(root, "public/fulltime.json"), `${JSON.stringify(fulltime, null, 2)}\n`);
  await writeFile(path.join(root, "public/summary.json"), `${JSON.stringify(buildJobsSummary(snapshot, refreshReport), null, 2)}\n`);
  console.log(`Prepared ${jobs.length} current listings and ${awaitingVerification.length} awaiting verification; quarantined ${quarantined.length}; rejected ${rejectedCount}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
