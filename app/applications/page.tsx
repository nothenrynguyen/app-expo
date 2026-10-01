import type { Metadata } from "next";
import { SiteFooter } from "../SiteFooter";
import { ApplicationTracker } from "./ApplicationTracker";
export const metadata: Metadata = { title: "Applications | App Expo" };
export default function ApplicationsPage() {
  return <><main className="methodology-shell"><p className="eyebrow">Your tracker</p><h1>Applications</h1><p className="tracker-hint">Keep track of your next move. Saved in this browser. <a href="/privacy">Privacy details</a></p><ApplicationTracker /></main><SiteFooter /></>;
}
