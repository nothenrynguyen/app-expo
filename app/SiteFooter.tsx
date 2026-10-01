import Link from "next/link";
import { AnalyticsPreferencesButton } from "./AnalyticsControls";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>App Expo · Free and direct.</span>
      <Link href="/privacy">Privacy</Link>
      <AnalyticsPreferencesButton />
      <Link className="feedback-link" href="/feedback">Feedback</Link>
      <span className="creator-credit">
        <span>made by</span>
        <a href="https://henwoo.dev" target="_blank" rel="noreferrer">
          <strong>henwoo</strong>
        </a>
      </span>
    </footer>
  );
}
