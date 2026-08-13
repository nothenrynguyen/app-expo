import Link from "next/link";
import { Suspense } from "react";
import { JobBoard } from "../JobBoard";
import { LogoMark } from "../LogoMark";

export default function JobsPage() {
  return (
    <main>
      <header className="site-header">
        <Link className="wordmark" href="/"><LogoMark />App Expo</Link>
        <Link className="back-link" href="/">All collections</Link>
      </header>
      <section className="board-shell">
        <div className="board-intro">
          <div><p className="eyebrow">Job board</p><h1>Current full-time jobs</h1><p>No sign-up. No BS. Here are the jobs, updated every hour.</p></div>
          <div className="live-line compact"><i />Live · refreshed hourly</div>
        </div>
        <Suspense fallback={<p className="state-card">Loading verified jobs...</p>}><JobBoard type="fulltime" /></Suspense>
      </section>
      <footer>App Expo · Free, direct, and intentionally selective.</footer>
    </main>
  );
}
