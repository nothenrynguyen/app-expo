import { isInCollection } from "../job-collections";
import type { PublicJob } from "../jobs";
import type { buildListingChanges } from "./listing-changes";

export function assessCoverage(previous: PublicJob[], current: PublicJob[], changes: ReturnType<typeof buildListingChanges>) {
  return (["internships", "fulltime"] as const).map(collection => {
    const prior = previous.filter(job => isInCollection(job, collection));
    const ids = new Set(prior.map(job => job.id));
    const removed = changes.removed.filter(job => ids.has(job.id));
    const unexplained = removed.filter(job => ["not-returned-by-sources", "reason-unavailable"].includes(job.reason)).length;
    const count = current.filter(job => isInCollection(job, collection)).length;
    const largeDrop = prior.length - count >= Math.max(50, Math.ceil(prior.length * 0.05));
    const policyCut = largeDrop && (removed.length === 0 || removed.some(job => !["closed", "expired", "deduplicated", "absent-from-employer-board"].includes(job.reason)));
    return { collection, previous: prior.length, current: count, removed: removed.length, unexplained,
      largeDrop,
      blocked: policyCut || unexplained >= Math.max(25, Math.ceil(prior.length * 0.02)) };
  });
}

export function assertCoverageSafe(coverage: ReturnType<typeof assessCoverage>) {
  const blocked = coverage.filter(row => row.blocked);
  if (blocked.length) throw new Error(`Refusing unexplained or policy-driven coverage loss: ${blocked.map(row => `${row.collection}: ${row.unexplained} unexplained removals (${row.previous} -> ${row.current})`).join("; ")}. Inspect listing changes before publishing.`);
}
