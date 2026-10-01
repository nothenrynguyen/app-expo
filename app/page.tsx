import { LandingCollections } from "./LandingCollections";
import { PageTransition } from "./PageTransition";
import { SiteFooter } from "./SiteFooter";
import { LandingHeadline } from "./LandingHeadline";
import { HeroGravity } from "./HeroGravity";

export default function Home() {
  return <PageTransition>
    <main className="home-page">
      <section className="landing-shell">
        <div className="landing-hero"><HeroGravity /><p className="eyebrow">Your next opportunity</p>
        <LandingHeadline />
        <p className="landing-copy">Direct applications. No sign-up. No detours.<br />Refreshed hourly from reviewed sources.</p>
        <div className="live-line"><i />Currently live</div>
        </div>
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
            <p>Some even make you <strong className="about-bold">click apply</strong>, redirect you to their own job page, pitch resume tailoring, <span className="about-emphasis">and then</span> make you click <span className="about-emphasis">manually apply.</span></p>
            <p className="about-punchline">Holy cardio.</p>
            <p>App Expo keeps it simple. We collect current openings from multiple sources, remove duplicates and obvious junk, and send you directly to the employer&apos;s application. No account. No detour.</p>
            <p>I made this for myself, but maybe you&apos;ll find it useful too. Good luck. You got this.</p>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  </PageTransition>;
}
