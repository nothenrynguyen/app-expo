import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "../SiteFooter";
import { ApplicationTracker } from "./ApplicationTracker";
export const metadata: Metadata = { title: "Applications | empluzzed" };
export default function ApplicationsPage() {
  return <><main className="methodology-shell board-page"><p className="eyebrow">Your tracker</p><h1>Applications</h1><p className="tracker-hint">Keep track of your next move. Saved in this browser. <Link href="/privacy">Privacy details</Link></p><ApplicationTracker /></main><SiteFooter /></>;
}
