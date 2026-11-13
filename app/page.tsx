import { LandingCollections } from "./LandingCollections";
import { PageTransition } from "./PageTransition";
import { SiteFooter } from "./SiteFooter";
import { LandingHeadline } from "./LandingHeadline";

export default function Home() {
  return <PageTransition>
    <main className="home-page">
      <section className="landing-shell">
        <div className="landing-intro">
        <div className="landing-hero"><p className="eyebrow">Your next opportunity</p>
        <LandingHeadline />
        <p className="landing-copy">Find your next role. No sign-up. Always free.<br />Hourly refreshes from reviewed sources.</p>
        <div className="live-line"><i />Currently live</div>
        </div>
        <LandingCollections />
        </div>
        <section id="about" className="about-section">
          <div className="about-intro">
            <p className="eyebrow">About empluzzed</p>
            <h2 className="about-statement">
              <span>One place to browse.</span>
              <span>Employer links preferred.</span>
            </h2>
          </div>
          <div className="about-copy">
            <p>Yeah, another job aggregator. I know.</p>
            <p>I&apos;m looking for jobs too. I got tired of checking a million repos, then finding sites that want an account or my email. Bro, I just want to see the jobs.</p>
            <p>You click apply, get another job page and a resume pitch, and then have to find the button to actually apply.</p>
            <p className="about-punchline">Holy cardio.</p>
            <p>So I put the jobs in one place, clean up duplicates, and link to the company when I can. Some links still go through another board. No account needed here.</p>
            <p>Made this for my own search. Hope it helps yours too. We got this.</p>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  </PageTransition>;
}
