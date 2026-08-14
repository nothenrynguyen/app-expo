import Link from "next/link";
import { LogoMark } from "./LogoMark";
import { LandingCollections } from "./LandingCollections";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <Link className="wordmark" href="/"><LogoMark />App Expo</Link>
        <div className="header-links"><a href="#about">About</a><Link href="/methodology">Methodology</Link><span className="header-note"><i />Live job board</span></div>
      </header>
      <section className="landing-shell">
        <p className="eyebrow">A no-friction job board</p>
        <h1>No sign-up. No BS. Here are the jobs.</h1>
        <p className="landing-copy">Refreshed hourly with direct applications from verified U.S. companies.</p>
        <div className="live-line"><i />Currently live</div>
        <LandingCollections />
        <section id="about" className="about-section">
          <div className="about-intro">
            <p className="eyebrow">About App Expo</p>
            <h2 className="about-statement">
              <span>One place to browse.</span>
              <span>One click to apply.</span>
            </h2>
          </div>
          <div className="about-copy">
            <p>I know. Another job aggregator.</p>
            <p>I got tired of checking a million repos just to make sure I wasn&apos;t missing anything. The nicer sites always seem to be tryna sell you something, make you log in, or collect your email. I don&apos;t want to put my email everywhere, bro.</p>
            <p>Some even make you <strong className="about-bold">click apply</strong>, redirect you to their own job page, pitch resume tailoring, and <span className="about-emphasis">then</span> make you click <span className="about-emphasis">manually apply.</span></p>
            <p className="about-punchline">Holy cardio.</p>
            <p>App Expo keeps it simple. We collect current openings from multiple sources, remove duplicates and obvious junk, and send you directly to the employer&apos;s application. No account. No popups. No detour.</p>
            <p>I made this for myself, but maybe you&apos;ll find it useful too. Good luck. You got this.</p>
          </div>
        </section>
      </section>
      <footer>App Expo · Free, direct, and intentionally selective.</footer>
    </main>
  );
}
