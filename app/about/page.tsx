import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../SiteFooter";

export const metadata: Metadata = { title: "About | App Expo", description: "How App Expo works, where listings come from, and how your data is handled." };

export default function AboutPage() {
  return <><main className="methodology-shell info-page"><p className="eyebrow">Behind the board</p><h1>About App Expo</h1><p className="info-intro">A free job board for early-career roles, with direct application links and no sign-up required.</p>
    <section className="info-section"><h2>How it works</h2><p>App Expo brings together internship and full-time listings, screens companies and roles, and prefers direct employer application links. Listings refresh throughout the day. A listing can change or close between refreshes, so always check the employer&apos;s page.</p><Link href="/methodology">Read the methodology</Link></section>
    <section className="info-section"><h2>Where the jobs come from</h2><p>Listings come from reviewed public job lists and employer career boards. Source credits, license reviews and coverage details are available in the source directory.</p><Link href="/sources">Explore data sources</Link></section>
    <section className="info-section"><h2>Your saved jobs and applications</h2><p>Save jobs to apply later, or track applications from any source. Records stay in this browser profile, with no account or cross-device sync yet. Download a backup before clearing site storage.</p><Link href="/applications">Open My applications</Link></section>
    <section className="info-section"><h2>Privacy and feedback</h2><p>Analytics is optional. Your application records and notes are excluded. You can change your analytics choice using the footer preferences button.</p><div className="info-links"><Link href="/privacy">Privacy details</Link><Link href="/feedback">Share feedback</Link></div></section>
  </main><SiteFooter /></>;
}
