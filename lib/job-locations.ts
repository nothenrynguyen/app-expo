export const JOB_REGIONS = [
  ["us", "United States"],
  ["canada", "Canada"],
  ["europe", "Europe"],
] as const;

export type JobRegion = (typeof JOB_REGIONS)[number][0];
type DetectedJobRegion = JobRegion | "asia" | "australia_nz" | "latin_america" | "other_unknown";

const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
]);

const STATE_NAMES: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

const CITY_NORMALIZATIONS: Array<[RegExp, string]> = [
  [/^chicago$/i, "Chicago, IL"],
  [/^dallas$/i, "Dallas, TX"],
  [/^austin(?:, texas)?$/i, "Austin, TX"],
  [/^seattle$/i, "Seattle, WA"],
  [/^(?:new york|nyc)$/i, "New York, NY"],
  [/^san francisco$/i, "San Francisco, CA"],
  [/^sf$/i, "San Francisco, CA"],
  [/^palo alto$/i, "Palo Alto, CA"],
  [/^mountain view$/i, "Mountain View, CA"],
  [/^toronto$/i, "Toronto, ON, Canada"],
  [/^montreal$/i, "Montreal, QC, Canada"],
  [/^vancouver$/i, "Vancouver, BC, Canada"],
  [/^london$/i, "London, United Kingdom"],
  [/^amsterdam$/i, "Amsterdam, Netherlands"],
  [/^auckland(?:, nz)?$/i, "Auckland, New Zealand"],
];

const REGION_PATTERNS: Array<[DetectedJobRegion, RegExp]> = [
  ["canada", /\b(canada|canadian|toronto|montreal|vancouver|ottawa|calgary|edmonton|quebec|ontario)\b/i],
  ["europe", /\b(united kingdom|england|scotland|wales|ireland|germany|france|spain|italy|netherlands|switzerland|sweden|norway|denmark|finland|poland|portugal|belgium|austria|czechia|romania|greece|london|amsterdam|berlin|paris|dublin|madrid|barcelona|munich|zurich|stockholm|oslo|copenhagen|helsinki|warsaw|lisbon|brussels|vienna|prague)\b/i],
  ["asia", /\b(india|singapore|china|japan|south korea|korea|taiwan|hong kong|indonesia|malaysia|philippines|thailand|vietnam|israel|uae|united arab emirates|bangalore|bengaluru|hyderabad|mumbai|delhi|tokyo|seoul|tel aviv|dubai)\b/i],
  ["australia_nz", /\b(australia|australian|new zealand|auckland|wellington|sydney|melbourne|brisbane|perth)\b|\bNZ\b/i],
  ["latin_america", /\b(mexico|brazil|argentina|chile|colombia|peru|costa rica|panama|uruguay|guatemala|mexico city|sao paulo|rio de janeiro|buenos aires|bogota|santiago)\b/i],
];

export function normalizeJobLocation(location: string): string {
  const clean = location
    .replace(/^\d+\s+locations?/i, "")
    .replace(/^SF(?=[A-Z][a-z])/, "San Francisco, CA; ")
    .replace(/\bCanada(?=[A-Z][a-z])/g, "Canada; ")
    .replace(/,\s*([A-Z]{2})(?=[A-Z][a-z])/g, ", $1; ")
    .replace(/\s+/g, " ")
    .trim() || "Location not stated";
  for (const [pattern, replacement] of CITY_NORMALIZATIONS) {
    if (pattern.test(clean)) return replacement;
  }
  return clean
    .replace(/,?\s+(?:United States of America|United States|USA|US)$/i, "")
    .replace(/,\s*(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)$/i, (match, state: string) => {
      const entry = Object.entries(STATE_NAMES).find(([name]) => name.toLowerCase() === state.toLowerCase());
      return entry ? `, ${entry[1]}` : match;
    });
}

export function classifyJobRegions(location: string): DetectedJobRegion[] {
  const normalized = normalizeJobLocation(location);
  const regions = new Set<DetectedJobRegion>();
  for (const [region, pattern] of REGION_PATTERNS) {
    if (pattern.test(normalized)) regions.add(region);
  }
  if (/\b(united states|usa|u\.s\.|remote\s*(?:-|in)?\s*(?:us|united states))\b/i.test(location)) regions.add("us");
  const codes = normalized.toUpperCase().match(/\b[A-Z]{2}\b/g) ?? [];
  if (codes.some((code) => US_STATE_CODES.has(code))) regions.add("us");
  if (regions.size === 0) regions.add("other_unknown");
  return [...regions];
}

export function getSupportedJobRegions(location: string): JobRegion[] {
  return classifyJobRegions(location).filter((region): region is JobRegion => region === "us" || region === "canada" || region === "europe");
}

export function formatSnapshotAge(generatedAt: string, now = new Date()): string {
  const elapsed = now.getTime() - new Date(generatedAt).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 60_000) return "0 minutes ago";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
