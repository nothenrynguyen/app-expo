import Link from "next/link";
import { Suspense } from "react";
import { JobBoard } from "../JobBoard";
import { LogoMark } from "../LogoMark";

export default function InternshipsPage() {
  return <BoardPage title="Current internships" description="No sign-up. No BS. Here are the jobs, updated every hour." type="internships" />;
}

function BoardPage({ title, description, type }: { title: string; description: string; type: "internships" | "fulltime" }) {
  return (
    <main>
      <header className="site-header">
        <Link className="wordmark" href="/"><LogoMark />App Expo</Link>
        <div className="header-links"><Link href="/methodology">Methodology</Link><Link className="back-link" href="/">All collections</Link></div>
      </header>
      <section className="board-shell">
        <div className="board-intro">
          <div><p className="eyebrow">Job board</p><h1>{title}</h1><p>{description}</p></div>
          <div className="live-line compact"><i />Live · refreshed hourly</div>
        </div>
        <Suspense fallback={<p className="state-card">Loading verified jobs...</p>}><JobBoard type={type} /></Suspense>
      </section>
      <footer>App Expo · Free, direct, and intentionally selective.</footer>
    </main>
  );
}
