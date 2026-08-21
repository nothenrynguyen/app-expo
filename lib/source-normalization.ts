import { createHash } from "node:crypto";
import type { PostedAtSource, PublicJob } from "./jobs";

export type CandidateJob = Omit<PublicJob, "id" | "sources" | "verifiedCompany" | "linkedInUrl"> & {
  source: string;
  companyLinkedInUrl?: string | null;
  h1bApprovals?: number | null;
  rawText: string;
  sourceActive?: boolean;
};

const TRACKING_PARAMS = new Set(["ref", "referrer", "referral", "source", "trackingid", "gh_src"]);

export function normalizeDisplayText(value: string): string {
  return value.replace(/\s*\u2014\s*/g, " - ").replace(/\s+/g, " ").trim();
}

export function canonicalizeUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (!/^https?:$/.test(url.protocol)) return null;
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase() === "gh_jid") {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function jobIdentity(value: string): string | null {
  const canonical = canonicalizeUrl(value);
  if (!canonical) return null;
  const url = new URL(canonical);
  const workdayId = url.pathname.match(/_(JR\d+)/i)?.[1];
  const greenhouseId = url.pathname.match(/(?:jobs|job)\/(\d{6,})/i)?.[1];
  const greenhouseToken = /greenhouse\.io$/i.test(url.hostname) ? url.searchParams.get("token") : null;
  const microsoftId = url.searchParams.get("pid") ?? url.pathname.match(/job\/(\d{8,})/i)?.[1];
  const googleId = url.pathname.match(/results\/(\d{8,})/i)?.[1];
  const uuid = url.pathname.match(/\b([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/i)?.[1];
  const atsId = workdayId ?? greenhouseId ?? greenhouseToken ?? microsoftId ?? googleId ?? uuid;
  return atsId ? `${url.hostname}:${atsId.toLowerCase()}` : canonical.toLowerCase();
}

export function stableJobId(url: string, company: string, title: string): string {
  return createHash("sha256").update(`${url}|${company}|${title}`).digest("hex").slice(0, 24);
}

export function inferWorkMode(text: string): PublicJob["workMode"] {
  if (/\bhybrid\b/i.test(text)) return "hybrid";
  if (/\bremote\b/i.test(text)) return "remote";
  if (/\b(on[- ]?site|in[- ]person)\b/i.test(text)) return "in_person";
  return "unknown";
}

export function inferTerm(text: string): string {
  const match = text.match(/\b(spring|summer|fall|winter)\s+['’]?(20)?(\d{2})\b/i);
  if (match) return `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()} 20${match[3]}`;
  return "Not stated";
}

export function parsePostedAt(value: string, now = new Date()): { postedAt: string; source: PostedAtSource } | null {
  const clean = value.trim();
  if (!clean || clean === "-" || clean === "\u2014" || /undated/i.test(clean)) return null;
  const age = clean.match(/^(\d+)\s*(d|day|days|mo|month|months)$/i);
  if (age) {
    const count = Number(age[1]);
    const days = /^mo/i.test(age[2]) ? count * 30 : count;
    return { postedAt: new Date(now.getTime() - days * 86_400_000).toISOString(), source: "relative_derived" };
  }
  const withYear = /\b\d{4}\b/.test(clean) ? clean : `${clean}, ${now.getUTCFullYear()}`;
  const parsed = new Date(withYear);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() > now.getTime() + 86_400_000) return null;
  return { postedAt: parsed.toISOString(), source: /T|\d{1,2}:\d{2}/.test(clean) ? "exact" : "date_only" };
}
