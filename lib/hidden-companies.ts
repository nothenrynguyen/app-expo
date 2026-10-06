export const HIDDEN_COMPANIES_KEY = "app-expo:hidden-companies:v1";
export type HiddenCompany = { key: string; name: string };
export const EMPTY_HIDDEN_COMPANIES: readonly HiddenCompany[] = [];

// Exact normalized names only. Never match substrings or infer subsidiaries.
export function companyPreferenceKey(name: string): string {
  return name.normalize("NFKC").toLowerCase().replace(/&/g, " and ")
    .replace(/\b(incorporated|inc|llc|ltd|limited|corporation|corp)\b\.?/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function parseHiddenCompanies(raw: string | null): readonly HiddenCompany[] {
  if (!raw) return EMPTY_HIDDEN_COMPANIES;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return EMPTY_HIDDEN_COMPANIES;
    const companies = new Map<string, HiddenCompany>();
    for (const item of value) {
      if (!item || typeof item.name !== "string" || !item.name.trim() || item.name.length > 1000) continue;
      const key = companyPreferenceKey(item.name);
      if (key) companies.set(key, { key, name: item.name.trim() });
    }
    return [...companies.values()];
  } catch { return EMPTY_HIDDEN_COMPANIES; }
}
