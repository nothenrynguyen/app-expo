import type { Metadata } from "next";
import { SiteFooter } from "../SiteFooter";
import { ApplicationTracker } from "./ApplicationTracker";
export const metadata: Metadata = { title: "My applications | App Expo" };
export default function ApplicationsPage() {
  return <><main className="methodology-shell"><p className="eyebrow">Your tracker</p><h1>My applications</h1><p className="tracker-hint">Saved jobs and applications, in one place. Stored in this browser only. <a href="/privacy">Storage and privacy details</a></p><ApplicationTracker /></main><SiteFooter /></>;
}
