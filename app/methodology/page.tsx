import type { Metadata } from "next";
import { MethodologyStats } from "../MethodologyStats";
import { PageTransition } from "../PageTransition";
import { SiteFooter } from "../SiteFooter";

export const metadata: Metadata = {
  title: "Methodology | App Expo",
  description: "How App Expo finds, checks, filters, and refreshes job listings.",
};

const steps = [
  {
    number: "01",
    title: "Find broadly",
    copy: "We collect openings from maintained public job lists and use their application links to discover employer career boards. Supported Greenhouse, Lever, and Ashby boards are refreshed directly, and SmartRecruiters listings are checked against employer posting records.",
  },
  {
    number: "02",
    title: "Normalize and deduplicate",
    copy: "Tracking parameters are removed and application links are converted into stable identities. Strong company, title, and location matches can also join an aggregator copy to the direct employer listing. Separate employer requisition IDs remain separate, and the direct application is preferred.",
  },
  {
    number: "03",
    title: "Keep relevant roles",
    copy: "A role must clearly match one of the supported early-career areas. Software, data, product, hardware, quant, finance, business analyst, and IT/security roles are included. Public collections are then split by source category plus title and term signals.",
  },
  {
    number: "04",
    title: "Screen obvious risk",
    copy: "Listings that explicitly appear unpaid, volunteer, fee-based, equity-only, or commission-only are rejected. Locations are normalized and limited to the United States, Canada, and Europe, with United States selected by default.",
  },
  {
    number: "05",
    title: "Check the company",
    copy: "Reviewed company records, employee evidence, meaningful U.S. employment evidence, and curated coverage all contribute to admission. A persistent trust list can approve, hold, or block a company and its aliases across every source.",
  },
  {
    number: "06",
    title: "Check freshness",
    copy: "The job snapshot refreshes hourly from 5 a.m. through 5 p.m. in the America/New_York timezone. Direct ATS boards confirm whether roles still appear on the employer board, generic links rotate through daily checks, completed internship terms are removed, and exact-date internships older than 180 days are held out.",
  },
];

export default function MethodologyPage() {
  return <PageTransition>
    <main>
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
          <p className="eyebrow">Reality check</p>
          <h2>Is every listing perfect? lol no.</h2>
          <div>
            <p>I filter out a lot of obvious junk, but I&apos;m not personally investigating every company and every job. Some listings come from sources I trust, while others come directly from employer job boards that pass the project&apos;s checks. That still does not mean I can guarantee every company is amazing, trustworthy, or even real.</p>
            <p>Jobs also close randomly, career pages break, and some companies make it weirdly difficult to tell when something was posted. I refresh and recheck listings regularly, but a dead link or outdated opening might still sneak through.</p>
            <p>Basically, use App Expo to find opportunities faster. Do your own research before applying, and definitely do not send anyone money. I&apos;m still tightening the filters and improving the company checks as I go. If something looks off, trust your gut.</p>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  </PageTransition>;
}
