import type { Metadata } from "next";
import Link from "next/link";
import { HeroGravity } from "../HeroGravity";
import { SiteFooter } from "../SiteFooter";

export const metadata: Metadata = {
  title: "Updates | empluzzed",
  description: "A timeline of meaningful improvements to empluzzed.",
};

// Dates reflect recorded project milestones, not every deployment or job refresh.
const updates = [
  { date: "2026-10-29", label: "October 29, 2026", title: "Broader student job coverage", description: "Expanded direct employer discovery and recovered current openings from employer records. Added more student disciplines, general engineering and graduate programs, corrected overly broad pay filtering, and strengthened safeguards against sudden coverage losses." },
  { date: "2026-10-28", label: "October 28, 2026", title: "Stronger source and coverage checks", description: "Added a licensed discovery source, corrected posting-date parsing, and improved employer availability checks. Feeds without recorded reuse permission are held out while coverage is rebuilt through reviewed sources." },
  { date: "2026-10-26", label: "October 26, 2026", title: "A home for project updates", description: "Added this timeline to share meaningful changes and milestones as empluzzed grows." },
  { date: "2026-10-23", label: "October 23, 2026", title: "A clearer picture of site activity", description: "Introduced optional activity analytics and a private dashboard to understand how the site is used and guide future improvements." },
  { date: "2026-10-19", label: "October 19, 2026", title: "More paths to opportunities", description: "Expanded non-software coverage with Keryx and added USAJOBS federal student and recent-graduate opportunities, with links to official application instructions." },
  { date: "2026-09-30", label: "September 30, 2026", title: "An application tracker", description: "Added a browser-local tracker for applications from any source, with statuses, dates, notes and downloadable backups." },
  { date: "2026-09-27", label: "September 27, 2026", title: "Broader early-career coverage", description: "Expanded the range of roles beyond software, including engineering, operations, marketing, civil infrastructure and customer-facing technical roles." },
  { date: "2026-09-22", label: "September 22, 2026", title: "Save jobs for later", description: "Added the ability to save interesting listings in your browser while you browse." },
  { date: "2026-09-19", label: "September 19, 2026", title: "More transparent sourcing", description: "Added a dedicated source transparency page and metro-area filters to make it easier to understand and narrow down listings." },
  { date: "2026-09-16", label: "September 16, 2026", title: "Three more community feeds", description: "Added Dreamwork Business Internships 2027, ApplyGuy Product Internships 2027 and Dreamwork New Grad US, bringing the catalog to 17 community feed entries at the time." },
  { date: "2026-08-12", label: "August 12, 2026", title: "A bigger, easier-to-filter job board", description: "Expanded the job board and added multi-select filters and prefiltered role views." },
  { date: "2026-08-11", label: "August 11, 2026", title: "The project begins", description: "The first version of the job aggregator was launched, starting the project that became empluzzed." },
];

export default function UpdatesPage() {
  return <><main className="board-page updates-page"><HeroGravity variant="board" />
    <section className="updates-hero">
      <p className="eyebrow">Updates</p>
      <h1>Always moving <span>forward.</span></h1>
      <p>A look at the milestones and improvements shaping empluzzed.</p>
      <p className="updates-latest">Latest milestone: <time dateTime={updates[0].date}>{updates[0].label}</time></p>
    </section>
    <section aria-label="Project milestones">
      <ol className="updates-list">
        {updates.map((update) => <li key={`${update.date}-${update.title}`}>
          <time dateTime={update.date}>{update.label}</time>
          <div><h2>{update.title}</h2><p>{update.description}</p></div>
        </li>)}
      </ol>
    </section>
    <p className="updates-more">Curious where listings come from? <Link href="/sources">Explore our sources</Link>.</p>
  </main><SiteFooter /></>;
}


