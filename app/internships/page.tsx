import { Suspense } from "react";
import { JobBoard } from "../JobBoard";
import { PageTransition } from "../PageTransition";
import { SiteFooter } from "../SiteFooter";

export default function InternshipsPage() {
  return <BoardPage title="Current Internships" description="No sign-up. No BS. Here are the jobs, updated every hour." type="internships" />;
}

function BoardPage({ title, description, type }: { title: string; description: string; type: "internships" | "fulltime" }) {
  return <PageTransition>
    <main>
      <section className="board-shell">
        <div className="board-intro">
          <div><p className="eyebrow">Job board</p><h1>{title}</h1><p>{description}</p></div>
          <div className="live-line compact"><i />Live · refreshed hourly</div>
        </div>
        <Suspense fallback={<p className="state-card">Loading verified jobs...</p>}><JobBoard type={type} /></Suspense>
      </section>
      <SiteFooter />
    </main>
  </PageTransition>;
}
