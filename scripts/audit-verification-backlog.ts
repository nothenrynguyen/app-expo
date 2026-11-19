import {readFile,writeFile,mkdir} from "node:fs/promises";
import {createScreeningTracker,type ScreeningReason} from "../lib/ingestion/screening";
import {buildVerificationBacklog} from "../lib/ingestion/verification-backlog";
import type {CandidateJob} from "../lib/source-normalization";

// Offline triage only. Quarantine rows do not contain full candidate bodies;
// this audit cannot establish new eligibility or publish any listing.
const snapshot=JSON.parse(await readFile("public/jobs.json","utf8"));
const quarantine=JSON.parse(await readFile("data/quarantine.json","utf8"));
const report=JSON.parse(await readFile("data/refresh-report.json","utf8"));
const tracker=createScreeningTracker();
for(const row of quarantine.jobs as Array<{applyUrl:string;reason:string}>) {
  const reason=row.reason;
  const outcome:ScreeningReason=/employer identity|availability could not|approval requires|reviewed employer page|positive employer evidence/i.test(reason)
    ?"pendingVerification":/marks this posting as closed/i.test(reason)?"closed":/already ended|original posting date/i.test(reason)?"expired":"role";
  tracker.record(row.applyUrl,outcome,reason);
}
const audit=buildVerificationBacklog({candidates:quarantine.jobs as CandidateJob[],acceptedUrls:snapshot.jobs.map((row:{applyUrl:string})=>row.applyUrl),
  outcomeFor:tracker.opportunityOutcomeFor,decisionsFor:tracker.decisionsFor});
const result={snapshotGeneratedAt:snapshot.generatedAt,quarantineRows:quarantine.jobs.length,
  currentCandidateBacklog:report.verificationBacklog,
  method:"Offline quarantine triage, excludes current public listings and recorded terminal exclusions. Quarantine is not a full candidate replay; use currentCandidateBacklog.total for the pipeline's authoritative pending total. No estimated yield is an eligibility approval.",
  quarantineTriage:audit};
await mkdir(".cache",{recursive:true});
await writeFile(".cache/verification-backlog-audit.json",JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({snapshot:result.snapshotGeneratedAt,currentCandidatePending:report.verificationBacklog.total,
  quarantineUniquePending:audit.total,blockers:audit.byBlocker,boards:audit.byBoard.slice(0,15)},null,2));
