import type { PublicJob } from "../jobs";
import { opportunityIdentity } from "../source-normalization";
import type { ScreeningReason } from "./screening";

export type RemovalReason = ScreeningReason | "source-permission" | "application-unavailable" | "deduplicated" | "employer-board-unavailable" | "absent-from-employer-board" | "not-returned-by-sources" | "reason-unavailable";

export function buildListingChanges(input: {
  generatedAt: string;
  previousGeneratedAt: string | null;
  previous: PublicJob[];
  current: PublicJob[];
  acceptedBeforeDedup: PublicJob[];
  candidateUrls: Iterable<string>;
  outcomeFor: (url: string) => ScreeningReason | "application-unavailable" | "source-permission" | undefined;
  boardState: (job: PublicJob) => "unavailable" | "absent" | null;
}) {
  const identityFor = opportunityIdentity;
  const current = new Set(input.current.map(job => identityFor(job.applyUrl)));
  const previous = new Set(input.previous.map(job => identityFor(job.applyUrl)));
  const currentByIdentity = new Map(input.current.map(job => [identityFor(job.applyUrl), job]));
  const urlChanges = input.previous.flatMap(job => {
    const retained = currentByIdentity.get(identityFor(job.applyUrl));
    return retained && retained.applyUrl !== job.applyUrl ? [{ id: retained.id, previousUrl: job.applyUrl, applyUrl: retained.applyUrl }] : [];
  });
  const accepted = new Set(input.acceptedBeforeDedup.map(job => identityFor(job.applyUrl)));
  const candidates = new Set([...input.candidateUrls].map(identityFor));
  const counts: Partial<Record<RemovalReason, number>> = {};
  const removed = input.previous.filter(job => !current.has(identityFor(job.applyUrl))).map(job => {
    const identity = identityFor(job.applyUrl);
    const board = input.boardState(job);
    // Deduplication is established by actual acceptance before the dedup pass,
    // not inferred merely from a matching title or an absent source row.
    const reason: RemovalReason = accepted.has(identity) ? "deduplicated" : input.outcomeFor(job.applyUrl)
      ?? (board === "unavailable" ? "employer-board-unavailable" : board === "absent" ? "absent-from-employer-board"
        : !candidates.has(identity) ? "not-returned-by-sources" : "reason-unavailable");
    counts[reason] = (counts[reason] ?? 0) + 1;
    return { id: job.id, company: job.company, title: job.title, applyUrl: job.applyUrl, reason };
  });
  return { version: 1, generatedAt: input.generatedAt, previousGeneratedAt: input.previousGeneratedAt,
    added: input.current.filter(job => !previous.has(identityFor(job.applyUrl))).length,
    removedCount: removed.length, counts, removed, urlChanges };
}
