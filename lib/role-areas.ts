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

export function classifyRoleArea(job: Pick<PublicJob, "title" | "category">): Exclude<RoleArea, "all"> | null {
  const text = `${job.title} ${job.category}`.toLowerCase();
  if (/\bproduct\s+(?:manager|management)\b|\bproduct (?:intern|owner)\b|\bassociate product manager\b|\bapm\b/.test(text)) return "product";
  if (/\bquant(?:itative)?\b|\btrader\b|\btrading\b|\bsystematic\b|\balgorithmic trading\b/.test(text)) return "quant";
  if (/\bdata scien(?:ce|tist)\b|\bdata engineer(?:ing)?\b|\bdata analyst\b|\banalytics?\b|\bbusiness intelligence\b|\bbi analyst\b|\bdecision scientist\b|\bmachine learning scientist\b|\bapplied scientist\b|\bstatistician\b/.test(text)) return "data-science";
  if (/\bbusiness analyst\b|\bstrategy analyst\b|\boperations analyst\b|\bmanagement consulting\b|\bbusiness operations\b|\bstrategy and operations\b/.test(text)) return "business-analyst";
  if (/\bfinance\b|\bfinancial\b|\baccount(?:ant|ing)\b|\binvestment\b|\bbanking\b|\btreasury\b|\baudit(?:or|ing)?\b|\btax\b|\bcontroller\b|\bfp&a\b|\bprivate equity\b|\bwealth management\b|\basset management\b/.test(text)) return "finance";
  if (/\bsoftware\b|\bdeveloper\b|\bdevelopment engineer\b|\bfront[ -]?end\b|\bback[ -]?end\b|\bfull[ -]?stack\b|\bweb engineer\b|\bmobile engineer\b|\bios engineer\b|\bandroid engineer\b|\bdevops\b|\bmlops\b|\bsite reliability\b|\bsre\b|\bcloud engineer\b|\binfrastructure engineer\b|\bplatform engineer\b|\bsecurity engineer\b|\bcyber ?security\b|\bred team\b|\bfirmware\b|\bembedded software\b|\bmachine learning engineer\b|\bml engineer\b|\bai(?:\/ml)?\b.*\bengineer\b|\bllm\b.*\bengineer\b|\bcomputer vision engineer\b|\bqa engineer\b|\bquality assurance\b|\btest automation\b|\btester\b|\bprogrammer\b/.test(text)) return "software";
  return null;
}

export function matchesRoleArea(job: Pick<PublicJob, "title" | "category">, roleArea: RoleArea): boolean {
  const classified = classifyRoleArea(job);
  return classified !== null && (roleArea === "all" || classified === roleArea);
}
