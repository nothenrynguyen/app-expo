import { Suspense } from "react";
import { JobBoard } from "../JobBoard";
import { SiteFooter } from "../SiteFooter";

export default function JobsPage() {
  return (
    <main>
      <section className="board-shell">
        <div className="board-intro">
          <div><p className="eyebrow">Job board</p><h1>Current Full-Time Jobs</h1><p>No sign-up. No BS. Here are the jobs, updated every hour.</p></div>
          <div className="live-line compact"><i />Live · refreshed hourly</div>
        </div>
        <Suspense fallback={<p className="state-card">Loading verified jobs...</p>}><JobBoard type="fulltime" /></Suspense>
      </section>
      <SiteFooter />
    </main>
  );
}
