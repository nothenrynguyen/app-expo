import { normalizeCompanyName } from "./company-quality";

export type CompanyTier = "faang_plus" | "fortune_500";

// "FAANG+" is intentionally a practical job-search grouping, not an official ranking.
const FAANG_PLUS = new Set([
  "Alphabet", "Google", "Amazon", "Apple", "Meta", "Meta Platforms", "Netflix",
  "Microsoft", "Nvidia", "NVIDIA", "Adobe", "Oracle", "Salesforce", "Tesla", "Uber",
].map(normalizeCompanyName));

// Current 2026 Fortune 500 employers represented in the App Expo source snapshot.
// This list is maintained against Fortune's annual U.S. revenue ranking.
const FORTUNE_500 = new Set([
  "Allstate", "Amazon", "American Express", "Ameren", "Analog Devices", "Apple",
  "BlackRock", "Blackstone", "Boeing", "Charles Schwab", "Chevron", "Chevron Corporation",
  "Coca-Cola", "Commercial Metals", "ConocoPhillips", "Freddie Mac", "GE Vernova",
  "General Motors", "Global Partners", "Global Payments", "Hewlett Packard Enterprise",
  "Home Depot", "HP", "Intel", "Intuitive Surgical", "KBR", "KLA", "LPL Financial Holdings",
  "Mastercard", "McKesson", "Medline", "Micron Technology", "Microsoft", "Morgan Stanley",
  "Motorola Solutions", "Nike", "Northrop Grumman", "Northwestern Mutual", "NVIDIA",
  "Prudential Financial", "Rockwell Automation", "RTX", "Salesforce", "ServiceNow", "Solventum",
  "State Street", "Tesla", "Texas Instruments", "TJX", "Western Digital", "eBay", "CVS Health",
].map(normalizeCompanyName));

export function hasCompanyTier(company: string, tier: CompanyTier): boolean {
  const normalized = normalizeCompanyName(company);
  return tier === "faang_plus" ? FAANG_PLUS.has(normalized) : FORTUNE_500.has(normalized);
}
