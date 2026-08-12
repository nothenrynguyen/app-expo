import { JobBoard } from "./JobBoard";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="wordmark"><span className="mark">A</span>App Expo</div>
        <a href="#jobs">Browse jobs</a>
      </header>
      <section className="hero">
        <p className="eyebrow">Direct applications. Verified companies.</p>
        <h1>Fresh early-career jobs without the detours.</h1>
        <p>Every listing opens the employer’s real application page. No account gate, no popup maze, and unknown companies stay out until they are verified.</p>
      </section>
      <section id="jobs" className="board-shell">
        <div className="board-heading">
          <div><p className="eyebrow">Job board</p><h2>Open roles</h2></div>
          <p>Newest postings appear first.</p>
        </div>
        <JobBoard />
      </section>
      <footer>App Expo · Free, direct, and intentionally selective.</footer>
    </main>
  );
}
