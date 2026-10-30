import { jobIdentity, opportunityIdentity } from "../source-normalization";

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
  const opportunities = new Map<string, ScreeningReason>();
  const decisions = new Map<string, Array<{ url: string; reason: ScreeningReason; detail: string | null }>>();
  let uncountedRecords = 0;
  return {
    decisionsFor(url: string) {
      return decisions.get(opportunityIdentity(url) ?? "") ?? [];
    },
    opportunityOutcomeFor(url: string): ScreeningReason | undefined {
      const identity = opportunityIdentity(url);
      return identity ? opportunities.get(identity) : undefined;
    },
    outcomeFor(url: string): ScreeningReason | undefined {
      const identity = jobIdentity(url);
      return identity ? destinations.get(identity) : undefined;
    },
    record(url: string, reason: ScreeningReason, detail?: string) {
      const opportunity = opportunityIdentity(url);
      if (opportunity) {
        const rows = decisions.get(opportunity) ?? [];
        if (!rows.some(row => row.url === url && row.reason === reason && row.detail === (detail ?? null))) rows.push({ url, reason, detail: detail ?? null });
        decisions.set(opportunity, rows);
        const current = opportunities.get(opportunity);
        if (!current || priority.indexOf(reason) < priority.indexOf(current)) opportunities.set(opportunity, reason);
      }
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
