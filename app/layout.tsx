import type { Metadata } from "next";
import "./globals.css";
import "./job-board.css";
import { SiteHeader } from "./SiteHeader";

export const metadata: Metadata = {
  title: "App Expo",
  description: "Fresh, verified early-career jobs with direct application links.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><SiteHeader />{children}</body>
    </html>
  );
}
