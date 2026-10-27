import type { Metadata } from "next";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { SiteFooter } from "../SiteFooter";
import "./analytics.css";

export const metadata: Metadata = {
  title: "Activity | empluzzed",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function AnalyticsPage() {
  return <main className="analytics-page"><AnalyticsDashboard /><SiteFooter /></main>;
}
