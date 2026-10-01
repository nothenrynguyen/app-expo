import type { Metadata } from "next";
import "./globals.css";
import "./job-board.css";
import { SiteHeader } from "./SiteHeader";
import { AnalyticsControls } from "./AnalyticsControls";

export const metadata: Metadata = {
  title: "App Expo",
  description: "Fresh, verified early-career jobs with direct application links.",
  referrer: "strict-origin",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><SiteHeader />{children}<AnalyticsControls /></body>
    </html>
  );
}
