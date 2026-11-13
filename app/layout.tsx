import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "./job-board.css";
import { HeroGravity } from "./HeroGravity";
import { SiteHeader } from "./SiteHeader";
import { AnalyticsControls } from "./AnalyticsControls";

export const metadata: Metadata = {
  title: "empluzzed",
  description: "Find internships and early-career jobs, save your shortlist, and apply on employer sites.",
  referrer: "strict-origin",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><HeroGravity /><SiteHeader />{children}<AnalyticsControls /><Link className="admin-link" href="/analytics" prefetch={false}>admin</Link></body>
    </html>
  );
}
