import type { Metadata } from "next";
import Link from "next/link";
import { HeroGravity } from "../HeroGravity";
import { SiteFooter } from "../SiteFooter";

export const metadata: Metadata = {
  title: "Updates | empluzzed",
  description: "Monthly highlights of improvements to empluzzed.",
};

// Monthly summaries cover meaningful changes, not routine job refreshes.
const updates = [
  { date: "2026-10", label: "October 2026", title: "More opportunities and a clearer experience", description: "Expanded student and new-grad coverage, added federal opportunities, and strengthened employer and listing checks. Introduced optional activity analytics, hourly job refreshes, and this updates page." },
  { date: "2026-09", label: "September 2026", title: "Tools for your job search", description: "Added saved jobs and an application tracker with statuses, notes, and downloadable backups. Broadened early-career roles, introduced metro-area filters, and made listing sources easier to explore." },
  { date: "2026-08", label: "August 2026", title: "The project begins", description: "Launched the first version of the job board that became empluzzed. Expanded the initial listings and added multi-select filters and prefiltered role views to make browsing easier." },
];

export default function UpdatesPage() {
  return <><main className="board-page updates-page"><HeroGravity variant="board" />
    <section className="updates-hero">
      <p className="eyebrow">Updates</p>
      <h1>Always moving <span>forward.</span></h1>
      <p>A monthly look at the improvements shaping empluzzed.</p>
      <p className="updates-latest">Latest update: <time dateTime={updates[0].date}>{updates[0].label}</time></p>
    </section>
    <section aria-label="Monthly updates">
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


