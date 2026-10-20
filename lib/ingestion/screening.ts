import { jobIdentity } from "../source-normalization";

export type ScreeningReason = "closed" | "expired" | "location" | "role" | "employer" | "pendingVerification";
export type ScreeningMetrics = {
  version: 1;
  unit: "application_destinations";
  reviewed: number;
  accepted: number;
  excluded: number;
  pendingVerification: number;
  uncountedRecords: number;
  reasons: Record<Exclude<ScreeningReason, "pendingVerification">, number>;
};

// One final disposition per normalized destination. Confirmed exclusions take
// precedence over a pending review; acceptance through any source wins over all.
const priority: ScreeningReason[] = ["closed", "expired", "location", "role", "employer", "pendingVerification"];

export function createScreeningTracker() {
  const destinations = new Map<string, ScreeningReason>();
  let uncountedRecords = 0;
  return {
    outcomeFor(url: string): ScreeningReason | undefined {
      const identity = jobIdentity(url);
      return identity ? destinations.get(identity) : undefined;
    },
    record(url: string, reason: ScreeningReason) {
      const identity = jobIdentity(url);
      if (!identity) { uncountedRecords += 1; return; }
      const current = destinations.get(identity);
      if (!current || priority.indexOf(reason) < priority.indexOf(current)) destinations.set(identity, reason);
    },
    summarize(acceptedUrls: Iterable<string>): ScreeningMetrics {
      const accepted = new Set<string>();
      for (const url of acceptedUrls) {
        const identity = jobIdentity(url);
        if (identity) accepted.add(identity);
      }
      const reasons = { closed: 0, expired: 0, location: 0, role: 0, employer: 0 };
      let pendingVerification = 0;
      for (const [identity, reason] of destinations) {
        if (accepted.has(identity)) continue;
        if (reason === "pendingVerification") pendingVerification += 1;
        else reasons[reason] += 1;
      }
      const excluded = Object.values(reasons).reduce((sum, value) => sum + value, 0);
      return { version: 1, unit: "application_destinations", reviewed: accepted.size + excluded + pendingVerification,
        accepted: accepted.size, excluded, pendingVerification, uncountedRecords, reasons };
    },
  };
}
