import type { Metadata } from "next";
import { MethodologyStats } from "../MethodologyStats";
import { PageTransition } from "../PageTransition";
import { HeroGravity } from "../HeroGravity";
import { SiteFooter } from "../SiteFooter";

export const metadata: Metadata = {
  title: "Methodology | empluzzed",
  description: "How empluzzed finds, checks, filters, and refreshes job listings.",
};

const steps = [
  {
    number: "01",
    title: "Find broadly",
    copy: "I bring together reviewed public job lists, federal postings, and employer career boards. Supported employer boards are also refreshed directly, so coverage does not depend on community lists alone.",
  },
  {
    number: "02",
    title: "Clean up duplicates",
    copy: "Application links are cleaned up and duplicates are merged where there is a strong match. Different employer requisition IDs stay separate. Direct employer links are preferred.",
  },
  {
    number: "03",
    title: "Keep relevant roles",
    copy: "The board focuses on internships and early-career software, data, engineering, product, business, finance, IT, and related technical roles. Legal, healthcare, education, and general science careers are outside its scope. Check each posting for experience requirements.",
  },
  {
    number: "04",
    title: "Filter obvious problems",
    copy: "Listings that explicitly appear unpaid, volunteer, fee-based, equity-only, or commission-only are filtered out. Supported locations are the United States, Canada, and United Kingdom. The board starts with U.S. roles selected; metro filters are optional.",
  },
  {
    number: "05",
    title: "Check the company",
    copy: "Employer-board records and reviewed company information help decide what appears. Held or blocked companies stay out across sources. These checks are not a personal review or endorsement of every employer.",
  },
  {
    number: "06",
    title: "Check freshness",
    copy: "Refreshes are scheduled hourly. Employer-board records and rotating link checks help catch closed jobs. Recent healthy data may be kept during temporary failures, so a fresh snapshot does not mean every link was checked that hour.",
  },
];

export default function MethodologyPage() {
  return <PageTransition>
    <main className="board-page"><HeroGravity variant="board" />
      <section className="methodology-shell">
        <div className="methodology-hero">
          <p className="eyebrow">How the board works</p>
          <h1>Broad coverage.<br />Clear rules.</h1>
          <p>Here is how I decide what makes it onto the board.</p>
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
            <p>I filter obvious junk and check employer records, but I do not personally review every job or company. Treat listings as leads, not endorsements.</p>
            <p>Jobs close, links break, and posting dates can be unclear. Check the employer&apos;s page for availability, pay, location, and eligibility.</p>
            <p>If something looks off, trust your gut. Research the employer and never pay to apply.</p>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  </PageTransition>;
}
