import type { PublicJob } from "./jobs";

export type RoleArea = "all" | "software" | "data-science" | "product" | "quant" | "finance" | "business-analyst";

export const ROLE_AREAS: Array<{ value: RoleArea; label: string }> = [
  { value: "all", label: "All Roles" },
  { value: "software", label: "Software" },
  { value: "data-science", label: "Data Science / Analytics" },
  { value: "product", label: "Product Management" },
  { value: "quant", label: "Quant" },
  { value: "finance", label: "Finance" },
  { value: "business-analyst", label: "Business Analyst" },
];

export function isRoleArea(value: string | null): value is RoleArea {
  return ROLE_AREAS.some((area) => area.value === value);
}

export function classifyRoleArea(job: Pick<PublicJob, "title" | "category">): Exclude<RoleArea, "all"> {
  const text = `${job.title} ${job.category}`.toLowerCase();
  if (/\bproduct\s+(?:manager|management)\b|\bproduct intern\b/.test(text)) return "product";
  if (/\bquant(?:itative)?\b|\btrader\b|\btrading\b|\bsystematic\b/.test(text)) return "quant";
  if (/\bdata scien(?:ce|tist)\b|\bdata analyst\b|\banalytics?\b|\bbusiness intelligence\b|\bbi analyst\b|\bdecision scientist\b|\bmachine learning scientist\b|\bapplied scientist\b/.test(text)) return "data-science";
  if (/\bbusiness analyst\b|\bstrategy analyst\b|\boperations analyst\b|\bmanagement consulting\b/.test(text)) return "business-analyst";
  if (/\bfinance\b|\bfinancial\b|\baccounting\b|\binvestment\b|\bbanking\b|\btreasury\b|\baudit\b/.test(text)) return "finance";
  return "software";
}

export function matchesRoleArea(job: Pick<PublicJob, "title" | "category">, roleArea: RoleArea): boolean {
  return roleArea === "all" || classifyRoleArea(job) === roleArea;
}
