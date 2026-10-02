import type { Metadata } from "next";
import { SiteFooter } from "../SiteFooter";
import { HeroGravity } from "../HeroGravity";

export const metadata: Metadata = { title: "Privacy | App Expo" };

export default function PrivacyPage() {
  return <main className="board-page"><HeroGravity variant="board" />
    <section className="methodology-shell privacy-notice">
      <p className="eyebrow">Privacy notice</p>
      <h1>Your browsing, your choice.</h1>
      <p>App Expo is a free job board with account-free browsing. This notice describes optional site analytics and browser-local saved jobs.</p>
      <h2>Optional site analytics</h2>
      <p>When analytics is activated on the deployment, we use Vercel Web Analytics only after you choose Allow analytics in the first-visit panel or Analytics preferences. Declining or choosing Continue without analytics does not affect browsing, filtering, saving jobs, or opening employer application links. You can withdraw consent by opening Analytics preferences at the bottom of any page and choosing Decline analytics. Do Not Track and Global Privacy Control signals also block analytics.</p>
      <p>The site owner uses private aggregate reports to understand page visits and available traffic sources, plus device, browser, operating system, and approximate location statistics. We remove all page URL query strings and fragments, and allow only known public page paths. No raw search text, personal information entered on the site, saved job IDs, application notes, employer application URLs, or click events are sent by this integration.</p>
      <p>Vercel receives network requests, including the IP address and browser information needed to process them. Its documentation describes cookie-free analytics, a visitor hash derived from the request, and a visitor session discarded after 24 hours. This is not a claim that no device information is processed. We do not enable advertising, identity attribution, session replay, or cross-site tracking.</p>
      <p>Referrer information depends on the referring site and your browser. Initial page views with a referrer containing a path beyond the root, a query string, fragment, or credentials are suppressed because the tracking hook cannot redact that field separately. Later page transitions can still be counted. Campaign parameters are not collected. Counts exclude visitors who decline, blocking browsers, and periods when the provider pauses collection.</p>
      <p>The free plan guarantees one month of reporting history. Vercel states that it may retain data beyond that window. Reports are available only through the owner&apos;s Vercel account, with no public dashboard or sharing link.</p>
      <h2>Your browser storage</h2>
      <p>Application backups are downloaded and imported entirely in your browser. Backup files contain tracker records, including links and notes, in plain text. Keep them private. Imports preserve existing records and do not upload the file to a server. Backups do not include separate board saves or analytics preferences.</p>
      <p>Applications lets you record jobs from any source, including company, location, position, status, application date, an optional link and notes. These records are stored in this browser profile on this device and are not uploaded or sent to analytics. Imported saved jobs become independent tracker records. Removing a tracker record does not unsave the board job; clearing site storage deletes all local records. People sharing a browser profile can access the same records.</p>
      <p>We retain the title, company and collection of saved listings locally so you can still recognize a job after it disappears from the board. These details are not uploaded. Removing a saved job removes its retained listing details. Older saved IDs can gain details when their listings are available again; we cannot recover details of previously missing listings from an ID alone.</p>
      <p>For saved jobs, you can record Saved, Applied, Interviewing, Offered or Rejected in this browser. These statuses are not uploaded or included in analytics. Opening an employer link does not change your status. Removing a saved job keeps its status for when you save it again. Clearing site storage deletes your saved IDs and statuses; they do not sync across devices.</p>
      <p>We store only your analytics choice and its expiry in localStorage for 180 days, solely to remember this preference. Clearing site storage resets the choice to off. If storage is unavailable, the choice lasts only for the current page. Saved jobs are stored separately in your browser and are not uploaded through analytics.</p>
      <h2>External services</h2>
      <p>Employer links, LinkedIn, and any enabled company-logo service follow their own privacy practices. Hosting requests may also be processed by Vercel independently of optional analytics.</p>
      <p>Read <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noreferrer">Vercel&apos;s analytics privacy documentation</a> and <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel&apos;s privacy policy</a>. For questions about App Expo, contact <a href="https://henwoo.dev" target="_blank" rel="noreferrer">the site owner</a>.</p>
    </section>
    <SiteFooter />
  </main>;
}
