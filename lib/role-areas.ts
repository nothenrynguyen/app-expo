import type { PublicJob } from "./jobs";
import { isProcessManufacturingRole } from "./process-manufacturing";

export type RoleFamily = "all" | "software" | "data" | "engineering" | "business" | "finance-quant" | "it-security";

export type RoleTag =
  | "software-engineering"
  | "ai-ml-engineering"
  | "cloud-infrastructure"
  | "data-science"
  | "data-engineering"
  | "analytics"
  | "hardware-electrical"
  | "process-manufacturing"
  | "mechanical"
  | "civil-infrastructure"
  | "systems-test"
  | "materials-chemical"
  | "quality-reliability"
  | "product"
  | "business-analyst"
  | "operations-supply-chain"
  | "marketing-sales"
  | "design"
  | "finance"
  | "quant"
  | "it-support-network"
  | "cybersecurity";

export type RoleSelection = { family: RoleFamily; specialty: RoleTag | null };

type RoleDefinition = { value: RoleTag; label: string; family: Exclude<RoleFamily, "all"> };
type RoleCandidate = Pick<PublicJob, "title" | "category"> & { roleTags?: readonly string[] };

export const ROLE_FAMILIES: Array<{ value: RoleFamily; label: string }> = [
  { value: "all", label: "All Roles" },
  { value: "software", label: "Software" },
  { value: "data", label: "Data" },
  { value: "engineering", label: "Engineering" },
  { value: "business", label: "Business / Ops" },
  { value: "finance-quant", label: "Finance / Quant" },
  { value: "it-security", label: "IT / Security" },
];

export const ROLE_TAGS: RoleDefinition[] = [
  { value: "software-engineering", label: "Software Engineering", family: "software" },
  { value: "ai-ml-engineering", label: "AI / ML Engineering", family: "software" },
  { value: "cloud-infrastructure", label: "Cloud / Infrastructure", family: "software" },
  { value: "data-science", label: "Data Science", family: "data" },
  { value: "data-engineering", label: "Data Engineering", family: "data" },
  { value: "analytics", label: "Analytics / BI", family: "data" },
  { value: "hardware-electrical", label: "Electrical / Hardware", family: "engineering" },
  { value: "process-manufacturing", label: "Process / Manufacturing", family: "engineering" },
  { value: "mechanical", label: "Mechanical", family: "engineering" },
  { value: "civil-infrastructure", label: "Civil / Infrastructure", family: "engineering" },
  { value: "systems-test", label: "Systems / Test", family: "engineering" },
  { value: "materials-chemical", label: "Materials / Chemical", family: "engineering" },
  { value: "quality-reliability", label: "Quality / Reliability", family: "engineering" },
  { value: "product", label: "Product", family: "business" },
  { value: "business-analyst", label: "Business Analysis", family: "business" },
  { value: "operations-supply-chain", label: "Operations / Supply Chain", family: "business" },
  { value: "marketing-sales", label: "Marketing / Sales", family: "business" },
  { value: "design", label: "Design", family: "business" },
  { value: "finance", label: "Finance", family: "finance-quant" },
  { value: "quant", label: "Quant", family: "finance-quant" },
  { value: "it-support-network", label: "IT / Networking", family: "it-security" },
  { value: "cybersecurity", label: "Cybersecurity", family: "it-security" },
];

const roleTagValues = new Set<RoleTag>(ROLE_TAGS.map((role) => role.value));
const roleFamilyValues = new Set<RoleFamily>(ROLE_FAMILIES.map((family) => family.value));
const roleDefinitionByTag = new Map(ROLE_TAGS.map((role) => [role.value, role]));

export function isRoleFamily(value: string | null): value is RoleFamily {
  return value !== null && roleFamilyValues.has(value as RoleFamily);
}

export function isRoleTag(value: string | null): value is RoleTag {
  return value !== null && roleTagValues.has(value as RoleTag);
}

export function getRoleTagsForFamily(family: RoleFamily): RoleDefinition[] {
  return family === "all" ? [] : ROLE_TAGS.filter((role) => role.family === family);
}

export function getRoleSelection(roleParam: string | null, specialtyParam: string | null): RoleSelection {
  if (isRoleTag(roleParam)) return { family: roleDefinitionByTag.get(roleParam)!.family, specialty: roleParam };
  if (!isRoleFamily(roleParam)) return { family: "all", specialty: null };
  if (!isRoleTag(specialtyParam)) return { family: roleParam, specialty: null };
  const specialty = roleDefinitionByTag.get(specialtyParam)!;
  return specialty.family === roleParam ? { family: roleParam, specialty: specialtyParam } : { family: roleParam, specialty: null };
}

export function classifyRoleTags(job: Pick<PublicJob, "title" | "category">): RoleTag[] {
  const text = `${job.title} ${job.category}`.toLowerCase();
  const explicitEarlyCareer = /\b(?:intern(?:ship)?|co-?op|new grad(?:uate)?|early career|university grad(?:uate)?|entry[- ]level)\b/i.test(job.title);
  if (/\b(?:senior|sr\.?|staff|principal|director|head|lead)\b/i.test(job.title)) return [];
  if (/\bmanager\b/i.test(job.title) && !explicitEarlyCareer) return [];
  const tags = new Set<RoleTag>();
  const add = (tag: RoleTag, pattern: RegExp) => { if (pattern.test(text)) tags.add(tag); };
  const softwareContext = /\bsoftware\b|\bcloud\b|\bsite reliability\b|\bsre\b|\btooling\b|\bdevops\b|\bplatform\b|\bota\b|\bqa\b|\btest automation\b/.test(text);
  const physicalQualityContext = /\b(?:supplier|manufacturing|production|process|product|hardware|device|component|semiconductor|silicon|wafer|materials?|mechanical|electrical|industrial|factory)\b|\bquality systems?\b|\bquality control\b|\bfailure analysis\b/.test(text);

  add("product", /\bproduct\s+(?:manager|management)\b|\bproduct (?:intern|owner)\b|\bassociate product manager\b|\bapm\b/);
  add("quant", /\bquant(?:itative)?\b|\btrader\b|\btrading\b|\bsystematic\b|\balgorithmic trading\b/);
  add("data-science", /\bdata scien(?:ce|tist)\b|\bdecision scientist\b|\bmachine learning scientist\b|\bapplied scientist\b|\bstatistician\b/);
  add("data-engineering", /\bdata engineer(?:ing)?\b|\banalytics engineer(?:ing)?\b|\bdata platform engineer(?:ing)?\b|\bdata infrastructure\b/);
  add("analytics", /\bdata analyst\b|\banalytics?\b|\bstrategy\s*(?:&|and)\s*analyt|\bbusiness intelligence\b|\bbi analyst\b/);
  add("business-analyst", /\bbusiness (?:systems? )?analyst\b|\bstrategy analyst\b|\boperations analyst\b|\bprocess analyst\b|\bprogram analyst\b|\bmanagement analyst\b|\bconsulting analyst\b|\bsupply chain analyst\b|\bprocurement analyst\b|\bcommercial analyst\b|\bproject analyst\b|\bbusiness development analyst\b|\bmanagement consulting\b|\bbusiness operations\b|\bstrategy and operations\b/);
  add("operations-supply-chain", /\boperations?\b|\bsupply chain\b|\bprocurement\b|\blogistics\b|\binventory\b|\bproduction planning\b|\bvendor management\b/);
  add("marketing-sales", /\bmarketing\b|\bsales (?:intern|representative|development|operations|analyst|associate)\b|\baccount executive\b|\bcustomer success\b|\bcommunications? (?:intern|specialist|coordinator|associate)\b|\bpublic relations\b/);
  add("design", /\bux\b|\bui\b|\buser experience\b|\bproduct design(?:er| internship)?\b|\bgraphic design(?:er)?\b|\bindustrial design(?:er)?\b|\bvisual design(?:er)?\b/);
  add("finance", /\bfinance\b|\bfinancial\b|\baccount(?:ant|ing)\b|\binvestment\b|\bbanking\b|\btreasury\b|\baudit(?:or|ing)?\b|\btax\b|\bcontroller\b|\bfp&a\b|\bprivate equity\b|\bwealth management\b|\basset management\b|\bcapital markets\b|\bactuari(?:al|y)\b|\bunderwrit(?:er|ing)\b|\bcredit (?:analyst|risk|services)\b|\bmarket risk\b|\brisk (?:analyst|management|advisory|intern)\b|\bloan review\b|\bvaluation\b|\bcommercial banking\b|\bcorporate banking\b/);

  if (isProcessManufacturingRole(job)) tags.add("process-manufacturing");
  add("materials-chemical", /\bchemical engineer(?:ing)?\b|\bmaterials? (?:engineer(?:ing)?|science|scientist|and process engineering)\b|\bpolymer\b|\bmetallurg(?:y|ical|ist)\b|\bchemistry\b|\bchemical process\b/);
  if (!softwareContext && physicalQualityContext) add("quality-reliability", /\bquality engineer(?:ing)?\b|\breliability engineer(?:ing)?\b|\bfailure analysis\b|\bquality control\b|\bquality systems?\b|\bvalidation engineer(?:ing)?\b/);
  if (!/\b(?:technical )?program manager\b/.test(text)) add("hardware-electrical", /\bhardware (?:design |development |systems? |test |validation |verification |applications? )?engineer(?:ing)?\b|\bdevice engineer(?:ing)?\b|\belectrical engineer(?:ing)?\b|\belectronics engineer(?:ing)?\b|\bembedded systems? engineer(?:ing)?\b|\bfpga\b|\b(?:asic|rtl) (?:design|verification|validation|engineer(?:ing)?)\b|\bsilicon (?:design|validation|verification|engineer(?:ing)?)\b|\b(?:pre|post)[ -]?silicon\b|\bsemiconductor (?:design|test|process|product|engineer(?:ing)?)\b|\b(?:analog|mixed[ -]?signal|digital|logic|circuit|board|pcb|chip) design engineer(?:ing)?\b|\bdesign verification engineer(?:ing)?\b|\bsignal integrity engineer(?:ing)?\b|\bpower electronics engineer(?:ing)?\b|\brf engineer(?:ing)?\b|\brobotics hardware\b/);
  add("mechanical", /\bmechanical(?: [a-z&/-]+){0,3} engineer(?:ing)?\b|\bmechatronics?\b|\bthermal engineer(?:ing)?\b|\bstructural engineer(?:ing)?\b|\bpropulsion engineer(?:ing)?\b|\baerodynamics?\b/);
  add("civil-infrastructure", /\bcivil engineer(?:ing)?\b|\btransportation engineer(?:ing)?\b|\bgeotechnical\b|\bwater resources?\b|\bconstruction engineer(?:ing)?\b|\binfrastructure design\b/);
  if (!softwareContext) add("systems-test", /\bsystems? engineer(?:ing)?\b|\bintegration (?:and|&) test\b|\bintegration engineer(?:ing)?\b|\btest engineer(?:ing)?\b|\bverification engineer(?:ing)?\b|\bvalidation engineer(?:ing)?\b/);

  add("cybersecurity", /\bcyber ?security\b|\binformation security\b|\bsecurity operations\b|\bsoc analyst\b|\bred team\b|\bpenetration test(?:er|ing)?\b|\bapplication security\b/);
  add("it-support-network", /\binformation technology\b|\bit (?:support|systems?|infrastructure|operations?|applications?|database|service|technician|specialist|analyst|intern|co-?op|developer|engineer)\b|\bhelp desk\b|\bservice desk\b|\bdesktop support\b|\btechnical support\b|\btechnology support\b|\bsoftware support\b|\bsystems? (?:administrator|support|technician)\b|\binfrastructure analyst\b|\bdatabase administrator\b|\bnetwork(?:ing)? (?:strategy|planning|software|switch|observation|automation|security|engineering|engineer|operations|administrator|technician|analyst|infrastructure|systems?|support)\b|\bnoc (?:analyst|engineer|technician)\b/);

  add("ai-ml-engineering", /\bmachine learning engineer(?:ing)?\b|\bml engineer(?:ing)?\b|\bai(?:\/ml)?\b.*\bengineer\b|\bllm\b.*\bengineer\b|\bcomputer vision engineer\b|\bnlp engineer\b|\bmlops\b/);
  add("cloud-infrastructure", /\bdevops\b|\bsite reliability\b|\bsre\b|\bcloud engineer\b|\bcloud validation engineer\b|\binfrastructure engineer\b|\bplatform engineer\b/);
  add("software-engineering", /\bsoftware\b|\bdeveloper\b|\bdevelopment engineer\b|\bfront[ -]?end\b|\bback[ -]?end\b|\bfull[ -]?stack\b|\bweb engineer\b|\bmobile engineer\b|\bios engineer\b|\bandroid engineer\b|\bfirmware\b|\bembedded software\b|\bmachine learning engineer\b|\bml engineer\b|\bai(?:\/ml)?\b.*\bengineer\b|\bllm\b.*\bengineer\b|\bcomputer vision engineer\b|\bqa engineer\b|\bquality assurance\b|\btest automation\b|\btester\b|\bprogrammer\b/);

  return ROLE_TAGS.map((role) => role.value).filter((tag) => tags.has(tag));
}

export function getJobRoleTags(job: RoleCandidate): RoleTag[] {
  const stored = (job.roleTags ?? []).filter((tag): tag is RoleTag => isRoleTag(tag));
  return stored.length > 0 ? [...new Set(stored)] : classifyRoleTags(job);
}

export function matchesRoleSelection(job: RoleCandidate, selection: RoleSelection): boolean {
  const tags = getJobRoleTags(job);
  if (selection.family === "all") return tags.length > 0;
  if (selection.specialty) return tags.includes(selection.specialty);
  return tags.some((tag) => roleDefinitionByTag.get(tag)?.family === selection.family);
}

// Legacy exports keep historical insight snapshots and old inbound links readable.
export type RoleArea = "all" | "software" | "data-science" | "product" | "hardware" | "process-manufacturing" | "quant" | "finance" | "business-analyst" | "it-network";
export const ROLE_AREAS: Array<{ value: RoleArea; label: string }> = [
  { value: "all", label: "All Roles" }, { value: "software", label: "Software" }, { value: "data-science", label: "Data" },
  { value: "product", label: "Product" }, { value: "hardware", label: "Hardware" }, { value: "process-manufacturing", label: "Process / Manufacturing" },
  { value: "quant", label: "Quant" }, { value: "finance", label: "Finance" }, { value: "business-analyst", label: "Business Analyst" }, { value: "it-network", label: "IT / Security" },
];

export function classifyRoleArea(job: Pick<PublicJob, "title" | "category">): Exclude<RoleArea, "all"> | null {
  const tags = classifyRoleTags(job);
  if (tags.includes("product")) return "product";
  if (tags.includes("quant")) return "quant";
  if (tags.some((tag) => tag === "data-science" || tag === "data-engineering" || tag === "analytics")) return "data-science";
  if (tags.includes("business-analyst")) return "business-analyst";
  if (tags.includes("finance")) return "finance";
  if (tags.includes("process-manufacturing")) return "process-manufacturing";
  if (tags.includes("hardware-electrical")) return "hardware";
  if (tags.some((tag) => tag === "it-support-network" || tag === "cybersecurity")) return "it-network";
  if (tags.some((tag) => tag === "software-engineering" || tag === "ai-ml-engineering" || tag === "cloud-infrastructure")) return "software";
  return null;
}

export function matchesRoleArea(job: Pick<PublicJob, "title" | "category">, roleArea: RoleArea): boolean {
  const classified = classifyRoleArea(job);
  return classified !== null && (roleArea === "all" || classified === roleArea);
}
