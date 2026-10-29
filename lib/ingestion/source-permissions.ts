import type { JobSource } from "../source-catalog";

export type PermissionReview = { repository: string; status: string; licenseUrl: string | null };

// A catalog switch alone cannot authorize importing an unreviewed repository.
export function assertSourcePermissions(sources: JobSource[], reviews: PermissionReview[]): void {
  const permitted = new Set(reviews.filter(review => review.status === "licensed" && review.licenseUrl?.startsWith(`https://github.com/${review.repository}/`)).map(review => review.repository.toLowerCase()));
  const unresolved = sources.filter(source => source.active && !permitted.has(source.repository.toLowerCase()));
  if (unresolved.length) throw new Error(`Source reuse permission review required: ${[...new Set(unresolved.map(source => source.repository))].join(", ")}`);
}

export function permissionHeldSourceNames(sources: JobSource[], reviews: PermissionReview[]): Set<string> {
  const unresolved = new Set(reviews.filter(review => review.status !== "licensed").map(review => review.repository.toLowerCase()));
  return new Set(sources.filter(source => unresolved.has(source.repository.toLowerCase())).map(source => source.name));
}
