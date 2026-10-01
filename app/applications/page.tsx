import type { Metadata } from "next";
import { SiteFooter } from "../SiteFooter";
import { ApplicationTracker } from "./ApplicationTracker";
export const metadata: Metadata = { title: "My applications | App Expo" };
export default function ApplicationsPage() {
  return <><main className="methodology-shell"><p className="eyebrow">Your tracker</p><h1>My applications</h1><p>Track jobs from anywhere. Records and notes stay in this browser profile on this device. Clearing site storage deletes them. No account or syncing yet.</p><ApplicationTracker /></main><SiteFooter /></>;
}
