import { readFile } from "node:fs/promises";
import { getJobLocationMetadata } from "../lib/job-location-policy";
import { getSupportedJobRegions } from "../lib/job-locations";
import type { JobsSnapshot } from "../lib/jobs";
import { isInCollection } from "../lib/job-collections";

// Read-only: no source refresh, listing checks, or generated-data writes.
const snapshot: JobsSnapshot = JSON.parse(await readFile(process.argv[2] ?? "public/jobs.json", "utf8"));
const accepted = snapshot.jobs.filter((job) => getJobLocationMetadata(job).eligible);
const excluded = snapshot.jobs.filter((job) => !getJobLocationMetadata(job).eligible);
const unconfirmedUsTags = snapshot.jobs.filter((job) => job.regions?.includes("us") && !getSupportedJobRegions(job.location).includes("us"));
console.log(JSON.stringify({
  generatedAt: snapshot.generatedAt,
  total: snapshot.jobs.length,
  countryPolicyAccepted: accepted.length,
  countryPolicyExcluded: excluded.length,
  collections: Object.fromEntries((["internships", "fulltime"] as const).map((type) => [type, {
    before: snapshot.jobs.filter((job) => isInCollection(job, type)).length,
    after: accepted.filter((job) => isInCollection(job, type)).length,
  }])),
  unconfirmedUsTagCount: unconfirmedUsTags.length,
  unconfirmedUsTagExamples: unconfirmedUsTags.slice(0, 20).map(({ id, company, title, location }) => ({ id, company, title, location })),
  excludedExamples: excluded.slice(0, 20).map(({ company, title, location, workMode }) => ({ company, title, location, workMode })),
}, null, 2));
