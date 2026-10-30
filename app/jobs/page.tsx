import { Suspense } from "react";
import { JobBoard } from "../JobBoard";
import { PageTransition } from "../PageTransition";
import { SiteFooter } from "../SiteFooter";
import { HeroGravity } from "../HeroGravity";

export default function JobsPage() {
  return <PageTransition>
    <main className="board-page">
      <HeroGravity variant="board" />
      <section className="board-shell">
        <div className="board-intro">
          <div><p className="eyebrow">Job board</p><h1>Current Early Career Jobs</h1><p>No sign-up. No BS. Here are the jobs, with hourly refreshes.</p></div>
        </div>
        <Suspense fallback={<p className="state-card">Loading jobs...</p>}><JobBoard type="fulltime" /></Suspense>
      </section>
      <SiteFooter />
    </main>
  </PageTransition>;
}
