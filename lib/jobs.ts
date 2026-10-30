export type PostedAtSource = "exact" | "date_only" | "relative_derived" | "first_seen";

export type PublicJob = {
  id: string;
  company: string;
  title: string;
  term: string;
  location: string;
  regions?: import("./job-locations").JobRegion[];
  metros?: import("./job-locations").JobMetro[];
  workMode: "remote" | "hybrid" | "in_person" | "unknown";
  postedAt: string;
  postedAtSource: PostedAtSource;
  applyUrl: string;
  linkedInUrl: string | null;
  category: string;
  roleTags?: import("./role-areas").RoleTag[];
  salary: string | null;
  sources: string[];
  verifiedCompany: boolean;
  employeeCount?: number | null;
  federal?: { retrievedAt: string; closes: string; citizenshipRequired: true | null; eligibility: string; qualifications?: string };
};

export type JobsSnapshot = {
  screening?: import("./ingestion/screening").ScreeningMetrics | null;
  generatedAt: string;
  jobs: PublicJob[];
  quarantinedCount: number;
  sourceHealth: Array<{ name: string; status: "ok" | "failed"; rows: number; outcome?: import("./ingestion/source-health").HealthOutcome }>;
};

export function daysAgo(postedAt: string, now = new Date()): number {
  const timestamp = new Date(postedAt).getTime();
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.floor((now.getTime() - timestamp) / 86_400_000));
}
