import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "../LogoMark";
import { MethodologyStats } from "../MethodologyStats";
import { SiteFooter } from "../SiteFooter";

export const metadata: Metadata = {
  title: "Methodology | App Expo",
  description: "How App Expo finds, checks, filters, and refreshes job listings.",
};

const steps = [
  {
    number: "01",
    title: "Find broadly",
    copy: "We collect openings from multiple maintained job lists and use their direct application links to discover employer career boards. We also refresh supported Greenhouse, Lever, Ashby, and SmartRecruiters listings directly.",
  },
  {
    number: "02",
    title: "Normalize and deduplicate",
    copy: "Tracking parameters are removed and application links are converted into stable identities. If several sources point to the same role, the board keeps one listing and preserves the strongest available posting date.",
  },
  {
    number: "03",
    title: "Keep relevant roles",
    copy: "A title must clearly match one of the supported early-career areas. Software, data, product, quant, finance, and business analyst roles are included. Unmatched roles are quarantined instead of being quietly labeled as software.",
  },
  {
    number: "04",
    title: "Screen obvious risk",
    copy: "Listings that explicitly appear unpaid, volunteer, fee-based, equity-only, or commission-only are rejected. Clearly foreign-only roles are removed. A missing location is treated as unknown, not automatically rejected.",
  },
  {
    number: "05",
    title: "Check the company",
    copy: "Reviewed company records, employee evidence, meaningful U.S. employment evidence, and curated coverage all contribute to admission. A persistent trust list can approve, hold, or block a company and its aliases across every source.",
  },
  {
    number: "06",
    title: "Check freshness",
    copy: "Scheduled source refreshes run hourly from 5 a.m. to 5 p.m. EST. SmartRecruiters status and original release dates are checked directly. Other links rotate through daily checks, and internships with an exact employer date older than 180 days are held out.",
  },
];

export default function MethodologyPage() {
  return (
    <main>
      <header className="site-header">
        <Link className="wordmark" href="/"><LogoMark />App Expo</Link>
        <div className="header-links"><Link href="/internships">Internships</Link><Link href="/jobs">Full-time</Link></div>
      </header>
      <section className="methodology-shell">
        <div className="methodology-hero">
          <p className="eyebrow">How the board works</p>
          <h1>Broad coverage.<br />Clear rules.</h1>
          <p>The short version: App Expo tries to find a lot without pretending every source is perfect. These are the rules between a scraped listing and the job you actually see.</p>
        </div>
        <MethodologyStats />
        <section className="methodology-grid" aria-label="Listing methodology">
          {steps.map((step) => (
            <article className="methodology-card" key={step.number}>
              <span>{step.number}</span>
              <h2>{step.title}</h2>
              <p>{step.copy}</p>
            </article>
          ))}
        </section>
        <section className="limitations">
          <p className="eyebrow">What this does not guarantee</p>
          <h2>Useful, not magically perfect.</h2>
          <div>
            <p>A curated source can surface a company that has not received an individual manual review. Employee counts and direct LinkedIn records are not available for every company yet.</p>
            <p>A job can close between checks, employer pages can block automated requests, and some career systems expose imperfect dates. Temporary errors do not automatically delete a listing because outages happen.</p>
            <p>The rules will keep getting stricter as the company trust registry and direct employer coverage improve. Until then, treat App Expo as a heavily screened discovery tool, not a promise about any employer.</p>
          </div>
        </section>
        <div className="methodology-cta"><p>See something that looks wrong?</p><span>A lightweight reporting system is next.</span><Link href="/internships">Browse current internships</Link></div>
      </section>
      <SiteFooter />
    </main>
  );
}
