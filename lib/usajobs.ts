import { load } from "cheerio";
import { getJobLocationMetadata } from "./job-location-policy";
import { classifyRoleTags } from "./role-areas";
import { inferTerm, normalizeDisplayText, type CandidateJob } from "./source-normalization";

export type UsaJobsSeed = { url: string; title: string; agency: string };
export type UsaJobsReview = { status: "candidate"; candidate: CandidateJob; closes: string; citizenshipRequired: true | null } | { status: "held"; reason: string };

export function officialUsaJobsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["www.usajobs.gov", "usajobs.gov"].includes(url.hostname) || url.username || url.password || url.port) return null;
    const id = url.pathname.match(/^\/job\/(\d+)\/?$/)?.[1];
    return id ? `https://www.usajobs.gov/job/${id}` : null;
  } catch { return null; }
}

function postingDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const us = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const parts = iso ? [iso[1], iso[2], iso[3]] : us ? [us[3], us[1], us[2]] : null;
  if (!parts) return null;
  const date = parts.join("-");
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null;
}

// Conservative conversion of an official page into a candidate, not employer approval.
export function reviewUsaJobsPosting(seed: UsaJobsSeed, html: string, now = new Date()): UsaJobsReview {
  const hold = (reason: string): UsaJobsReview => ({ status: "held", reason });
  const url = officialUsaJobsUrl(seed.url);
  if (!url) return hold("untrusted-url");
  const $ = load(html);
  $("script:not([type='application/ld+json']), style, template, nav, footer, #agencycontact, #agency-modal, #help_content").remove();
  const records = $("script[type='application/ld+json']").toArray().flatMap(element => {
    try { const item = JSON.parse($(element).text()); return Array.isArray(item) ? item : [item]; } catch { return []; }
  });
  const job = records.find(item => item?.["@type"] === "JobPosting");
  if (!job || !$("#joa-summary").length || !$("#joa-requirements").length) return hold("missing-official-posting-structure");
  const text = (value: unknown) => typeof value === "string" ? normalizeDisplayText(load(value).text()) : "";
  const title = text(job.title);
  const agency = typeof job.hiringOrganization === "string" ? text(job.hiringOrganization) : text(job.hiringOrganization?.name);
  const header = normalizeDisplayText($("#joa-header").text());
  const namedAgency = normalizeDisplayText(seed.agency);
  const agencyInHeader = namedAgency.length > 0 && (` ${header} `).includes(` ${namedAgency} `);
  if (title !== normalizeDisplayText(seed.title) || (agency !== namedAgency && !agencyInHeader)) return hold("posting-identity-mismatch");
  const summary = normalizeDisplayText($("#joa-summary").text());
  const requirements = normalizeDisplayText($("#joa-requirements").text());
  const main = normalizeDisplayText($("main").text());
  if (!/Accepting applications/i.test(main) || /This job (?:has )?closed|no longer accepting applications/i.test(main)) return hold("not-accepting-applications");
  const closes = postingDate(job.validThrough);
  const posted = postingDate(job.datePosted);
  if (!closes || !posted || posted > now.toISOString().slice(0, 10)) return hold("unverified-posting-dates");
  // Date-only closing times are uncertain on the closing day; hold rather than assume open.
  if (closes <= now.toISOString().slice(0, 10)) return hold("closed-or-closing-today");
  if (/\b(supervisory|supervisor|senior|chief|director)\b/i.test(title)) return hold("seniority");
  if (/public notice|may or may not|vacancies as they occur|resume (?:pool|bank)|register of eligibles/i.test(main)) return hold("standing-recruitment-notice");
  if (/unpaid|without compensation|student volunteer/i.test(summary)) return hold("unpaid");
  if ((new Date(closes).getTime() - new Date(posted).getTime()) / 86_400_000 > 180) return hold("extended-recruitment-window");
  const pay = job.baseSalary?.value;
  const min = Number(pay?.minValue ?? pay?.value);
  const max = Number(pay?.maxValue ?? pay?.value);
  if (!(min > 0) || !(max >= min) || job.baseSalary?.currency !== "USD") return hold("unverified-paid-compensation");
  const early = /\b(intern(?:ship)?|student trainee|recent graduate|developmental)\b/i.test(title) || /formal .{0,30}intern|summer scholar|seeking juniors/i.test(summary);
  if (!early) return hold("unverified-career-level");
  if (!/(?:\b\d+|few|many) vacanc(?:y|ies)\b/i.test(main)) return hold("unverified-vacancy");
  const places = Array.isArray(job.jobLocation) ? job.jobLocation : [job.jobLocation];
  const locations: string[] = places.map((place: { address?: { addressLocality?: string; addressRegion?: string; addressCountry?: string } }) => {
    const address = place?.address;
    if (!address) return "";
    const country = typeof address.addressCountry === "string" ? address.addressCountry : "";
    return [address.addressLocality, address.addressRegion, country].filter(Boolean).join(", ").trim();
  });
  if (!locations.length || locations.some(location => !location || !getJobLocationMetadata({ location }).eligible)) return hold("unverified-or-ineligible-location");
  const qualificationText = `${text(job.qualifications)} ${text(job.educationRequirements)}`.trim();
  const qualifications = qualificationText.length > 4000 ? `${qualificationText.slice(0, 4000).replace(/\s+\S*$/, "")}…` : qualificationText;
  const candidate: CandidateJob = {
    company: namedAgency, title, term: inferTerm(`${title} ${summary}`), location: [...new Set(locations)].join("; "),
    workMode: "unknown", postedAt: `${posted}T00:00:00.000Z`, postedAtSource: "date_only", applyUrl: url,
    category: /intern|student trainee/i.test(title) || /summer scholar/i.test(summary) ? "Internship" : "New grad",
    salary: `USD ${min.toLocaleString("en-US")}${max === min ? "" : ` - ${max.toLocaleString("en-US")}`} / ${String(pay.unitText ?? "unspecified")}`,
    source: "USAJOBS selective review", rawText: `${title} ${summary}`,
    federal: { qualifications, retrievedAt: now.toISOString(), closes, citizenshipRequired: /u\.?s\.? citizen(?:ship)?|united states citizen/i.test(requirements) ? true : null,
      eligibility: `${/intern|student trainee/i.test(title) || /summer scholar/i.test(summary) ? "Student" : "Recent-graduate"} eligibility applies. Check grade, education, clearance and application requirements on the official announcement.` },
  };
  candidate.roleTags = classifyRoleTags(candidate);
  if (!candidate.roleTags.length) return hold("unverified-role-category");
  return { status: "candidate", candidate, closes, citizenshipRequired: /u\.?s\.? citizen(?:ship)?|united states citizen/i.test(requirements) ? true : null };
}
