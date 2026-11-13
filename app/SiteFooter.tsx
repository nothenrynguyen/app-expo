import Link from "next/link";
import { AnalyticsPreferencesButton } from "./AnalyticsControls";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>empluzzed · Always free.</span>
      <Link href="/privacy">Privacy</Link>
      <AnalyticsPreferencesButton />
      <Link className="feedback-link" href="/feedback">Feedback</Link>
      <span className="creator-credit">
        <span>made by</span>
        <a href="https://www.linkedin.com/in/henrynguyen02/" target="_blank" rel="noreferrer">
          <strong>henwoo</strong>
        </a>
      </span>
    </footer>
  );
}
