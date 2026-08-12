import Link from "next/link";
import { LogoMark } from "./LogoMark";
import { LandingCollections } from "./LandingCollections";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <Link className="wordmark" href="/"><LogoMark />App Expo</Link>
        <div className="header-links"><a href="#about">About</a><span className="header-note"><i />Live job board</span></div>
      </header>
      <section className="landing-shell">
        <p className="eyebrow">A no-friction job board</p>
        <h1>No sign-up. No BS. Here are the jobs.</h1>
        <p className="landing-copy">Updated every hour with direct applications from verified U.S. companies.</p>
        <div className="live-line"><i />Live listings refresh hourly from 5 a.m. to 5 p.m. EST</div>
        <LandingCollections />
        <section id="about" className="about-section">
          <div>
            <p className="eyebrow">About App Expo</p>
            <h2>One place to browse. One click to apply.</h2>
          </div>
          <div className="about-copy">
            <p>Checking a pile of internship lists and job pages is annoying. The nicer aggregators often add another layer of friction, or try to sell you something, before they let you apply.</p>
            <p>App Expo takes the opposite approach: we collect current openings from many maintained sources, remove duplicates, and send you directly to the employer&apos;s application page. No account. No popups. No detour.</p>
            <p>We also screen listings for clear red flags such as unpaid work and clearly non-U.S. roles, and use company verification rules alongside curated source coverage to keep the board useful instead of noisy.</p>
          </div>
        </section>
      </section>
      <footer>App Expo · Free, direct, and intentionally selective.</footer>
    </main>
  );
}
