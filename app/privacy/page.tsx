import type { Metadata } from "next";
import { SiteFooter } from "../SiteFooter";
import { HeroGravity } from "../HeroGravity";
import { validActivityEndpoint } from "@/lib/activity-contract";

export const metadata: Metadata = { title: "Privacy | empluzzed" };

export default function PrivacyPage() {
  const owned = validActivityEndpoint(process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT ?? "");
  return <main className="board-page"><HeroGravity variant="board" />
    <section className="methodology-shell privacy-notice">
      <p className="eyebrow">Privacy notice</p>
      <h1>Your browsing, your choice.</h1>
      <h2>TL;DR</h2>
      <p>I&apos;m applying to these jobs too. I built empluzzed for my own search, and figured other people might find it useful. Analytics helps me see what people actually use. And honestly, it would be pretty cool to put real numbers on my resume that I can back up.</p>
      <p>It&apos;s completely optional. Say no and everything still works. Your application records, notes, and search text stay out of analytics. The details are below if you want them.</p>
      <h2>Optional site analytics</h2>
      {owned ? <>
      <p>Analytics stays off until you choose Allow analytics. Saying no does not change how the site works. Change your choice in the footer. Do Not Track and Global Privacy Control also block collection.</p>
      <p>I use Cloudflare Workers and D1 to count page visits, broad referral and device categories, filter categories and result-count ranges, saves, unsaves, employer-link clicks, and application-add actions. Bulk additions count as one action. A link click does not mean someone applied. The Applications, Updates, and analytics pages are excluded from page-view tracking.</p>
      <p>With permission, your browser stores and sends a random ID for up to 180 days. The collector stores a keyed hash of it to estimate distinct and returning browsers. These are browser counts, not verified people: different devices, cleared storage, and expired IDs can count again. I do not fingerprint devices or link counts to accounts.</p>
      <p>No job IDs, company names, application contents or statuses, notes, search text, selected employer or location values, employer destinations, raw referrer URLs, page query strings or fragments are included. Only fixed page and event names, coarse categories, and random identifiers are accepted. Application records stay in your browser. Downloaded backups are saved wherever you choose.</p>
      <p>Cloudflare receives ordinary network information, including IP addresses and browser headers needed to handle requests. Our analytics database does not store IP addresses, raw browser headers, or raw event histories, and Worker invocation logging is disabled. This does not imply Cloudflare has no independent operational or security processing.</p>
      <p>Reports contain counts and feature-use summaries. Daily cleanup is configured to remove per-browser daily feature flags older than 90 days and delivery receipts older than seven days. These records can remain longer if cleanup fails. Minimal hashed browser identities, first and last observed dates, lifetime feature flags, and daily aggregate counts are retained until analytics is reset or removed, subject to storage limits. Cloudflare D1 Free currently provides seven days of recovery history, so deleted detail can remain in recovery data temporarily.</p>
      <p>Withdrawing permission removes the local analytics ID, cancels pending requests where possible and stops future sends. It does not erase counts already received. Requests already accepted cannot be recalled. Your previous page-view analytics choice does not grant permission for this expanded measurement.</p>
      <p>Reports require a private owner access key checked by the collector. There is no public data endpoint or shared reporting link. Counts cover only participating browsers and can be incomplete because of opt-outs, blockers, outages, collection safeguards and free-tier limits. Missing counts are not proof of no traffic.</p>
      </> : <>
      <p>When analytics is activated on the deployment, we use Vercel Web Analytics only after you choose Allow analytics in the first-visit panel or Analytics preferences. Declining or choosing Continue without analytics does not affect browsing, filtering, saving jobs, or opening employer application links. You can withdraw consent by opening Analytics preferences at the bottom of any page and choosing Decline analytics. Do Not Track and Global Privacy Control signals also block analytics.</p>
      <p>The site owner uses private aggregate reports to understand page visits and available traffic sources, plus device, browser, operating system, and approximate location statistics. We remove all page URL query strings and fragments, and allow only known public page paths. No raw search text, personal information entered on the site, saved job IDs, application notes, employer application URLs, or click events are sent by this integration.</p>
      <p>Vercel receives network requests, including the IP address and browser information needed to process them. Its documentation describes cookie-free analytics, a visitor hash derived from the request, and a visitor session discarded after 24 hours. This is not a claim that no device information is processed. We do not enable advertising, identity attribution, session replay, or cross-site tracking.</p>
      <p>Referrer information depends on the referring site and your browser. Initial page views with a referrer containing a path beyond the root, a query string, fragment, or credentials are suppressed because the tracking hook cannot redact that field separately. Later page transitions can still be counted. Campaign parameters are not collected. Counts exclude visitors who decline, blocking browsers, and periods when the provider pauses collection.</p>
      <p>The free plan guarantees one month of reporting history. Vercel states that it may retain data beyond that window. Reports are available only through the owner&apos;s Vercel account, with no public dashboard or sharing link.</p>
      </>}
      <h2>Your browser storage</h2>
      <p>Application backups are downloaded and imported entirely in your browser. Backup files contain tracker records, including links and notes, in plain text. Keep them private. Imports preserve existing records and do not upload the file to a server. Backups do not include separate board saves or analytics preferences.</p>
      <p>Applications lets you record jobs from any source, including company, location, position, status, application date, an optional link and notes. These records are stored in this browser profile on this device and are not uploaded or sent to analytics. Imported saved jobs become tracker records with statuses linked to the corresponding board jobs. Removing a tracker record does not unsave the board job; clearing site storage deletes all local records. People sharing a browser profile can access the same records.</p>
      <p>Saved titles, companies, and collections stay in your browser so you can recognize listings that leave the board. Unsaving removes these retained details. Older saves may lack details until the listing appears again.</p>
      <p>For saved jobs, you can record Saved, Applied, Interviewing, Offered or Rejected in this browser. These statuses are not uploaded or included in analytics. Opening an employer link does not change your status. Removing a saved job keeps its status for when you save it again. Clearing site storage deletes your saved IDs and statuses; they do not sync across devices.</p>
      <p>Your analytics choice is stored in this browser for up to 180 days.{owned ? " With permission, a separate random analytics browser ID also lasts up to 180 days. The owner dashboard can store a local preference excluding that browser from measurement." : ""} Clearing site storage resets the choice to off. If storage is unavailable, the choice and any analytics ID last only for the current page. Saved jobs and hidden-company preferences stay in your browser and do not sync across devices. They are not uploaded through analytics.</p>
      <h2>External services</h2>
      <p>Employer sites, LinkedIn, and any enabled company-logo service have their own privacy practices. Hosting requests may also be processed by Vercel independently of optional analytics.</p>
      <p>Read <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noreferrer">Vercel&apos;s analytics privacy documentation</a> and <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel&apos;s privacy policy</a>. For questions, <a href="https://www.linkedin.com/in/henrynguyen02/" target="_blank" rel="noreferrer">message me on LinkedIn</a>.</p>
      {owned ? <p>Read <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">Cloudflare&apos;s privacy policy</a> for hosting-provider processing.</p> : null}
    </section>
    <SiteFooter />
  </main>;
}
