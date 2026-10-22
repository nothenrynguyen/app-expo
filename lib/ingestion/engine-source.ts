type EngineJob = {
  company: string;
  title: string;
  season: string;
  category: string;
  location: string;
  url: string;
  posted_at: string;
  posted_at_source: "exact" | "date_only" | "relative_derived";
  sponsorship?: string | null;
  salary?: string | null;
  skills?: string[] | null;
  h1b_approvals?: number | null;
  remote?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Reject malformed feeds before conversion so the source failure can trigger recovery.
export function parseEngineJobs(text: string): EngineJob[] {
  const payload: unknown = JSON.parse(text);
  if (!isRecord(payload) || !Array.isArray(payload.jobs)) {
    throw new Error("Invalid engine feed: expected a jobs array");
  }
  const required = ["company", "title", "season", "category", "location", "url", "posted_at"];
  const jobs: EngineJob[] = [];
  for (const [index, row] of payload.jobs.entries()) {
    // Undated upstream listings were skipped by engineCandidate before validation existed.
    if (isRecord(row) && (row.posted_at == null || row.posted_at === "")) continue;
    if (!isRecord(row) || required.some(key => typeof row[key] !== "string") ||
        (typeof row.posted_at_source !== "string" || !["exact", "date_only", "relative_derived"].includes(row.posted_at_source)) ||
        ["sponsorship", "salary"].some(key => row[key] != null && typeof row[key] !== "string") ||
        (row.skills != null && (!Array.isArray(row.skills) || row.skills.some(skill => typeof skill !== "string"))) ||
        (row.h1b_approvals != null && (typeof row.h1b_approvals !== "number" || !Number.isFinite(row.h1b_approvals))) ||
        (row.remote !== undefined && typeof row.remote !== "boolean") ||
        (row.posted_at !== "" && !Number.isFinite(Date.parse(String(row.posted_at))))) {
      throw new Error(`Invalid engine feed: malformed job at index ${index}`);
    }
    jobs.push(row as EngineJob);
  }
  return jobs;
}
