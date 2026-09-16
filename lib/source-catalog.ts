export type JobSource = {
  id: string;
  name: string;
  kind: "engine_json" | "markdown" | "applyguy_json";
  url: string;
  repository: string;
  path?: string;
  branch?: string;
  cycle?: number;
  categories?: string[];
  expandAtsBoards?: boolean;
  active: boolean;
  trustedCoverage: boolean;
};

export type SourceCatalog = {
  trustedOwners: string[];
  sources: JobSource[];
};

export type SourceHealthRecord = {
  status: "healthy" | "empty" | "failed" | "retired";
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  lastRows: number;
  consecutiveFailures: number;
  consecutiveEmpty: number;
  repositoryPushedAt: string | null;
  repositoryArchived: boolean;
  message: string | null;
};

export type SourceHealthState = {
  updatedAt: string;
  sources: Record<string, SourceHealthRecord>;
};
