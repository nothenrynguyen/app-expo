export type PostedAtSource = "exact" | "date_only" | "relative_derived" | "first_seen";

export type PublicJob = {
  id: string;
  company: string;
  title: string;
  term: string;
  location: string;
  workMode: "remote" | "hybrid" | "in_person" | "unknown";
  postedAt: string;
  postedAtSource: PostedAtSource;
  applyUrl: string;
  linkedInUrl: string | null;
  category: string;
  salary: string | null;
  sources: string[];
  verifiedCompany: boolean;
};

export type JobsSnapshot = {
  generatedAt: string;
  jobs: PublicJob[];
  quarantinedCount: number;
  sourceHealth: Array<{ name: string; status: "ok" | "failed"; rows: number }>;
};

export function daysAgo(postedAt: string, now = new Date()): number {
  const timestamp = new Date(postedAt).getTime();
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.floor((now.getTime() - timestamp) / 86_400_000));
}
