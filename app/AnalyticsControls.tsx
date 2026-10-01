"use client";

import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  beforeAnalyticsSend, browserPrivacySignalEnabled, getAnalyticsConsent,
  setAnalyticsConsent, subscribeAnalyticsConsent,
} from "@/lib/analytics";

const enabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true" && process.env.NODE_ENV === "production";
const serverConsent = () => "unset" as const;
const serverSignal = () => false;
const subscribeReady = () => () => {};

export function AnalyticsControls() {
  const consent = useSyncExternalStore(subscribeAnalyticsConsent, getAnalyticsConsent, serverConsent);
  const privacySignal = useSyncExternalStore(subscribeAnalyticsConsent, browserPrivacySignalEnabled, serverSignal);
  const pathname = usePathname();
  const ready = useSyncExternalStore(subscribeReady, () => true, serverSignal);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const showChoice = preferencesOpen || (ready && enabled && consent === "unset" && !privacySignal);
  return (
    <>
      {enabled && consent === "allowed" && !privacySignal ? (
        <Analytics mode="production" debug={false} route={pathname} path={pathname} beforeSend={beforeAnalyticsSend} />
      ) : null}
      <div className="analytics-preferences-link"><button className="button secondary" type="button" aria-expanded={showChoice} aria-controls="analytics-preferences" onClick={() => setPreferencesOpen(!preferencesOpen)}>Analytics preferences</button></div>
      {showChoice ? <section id="analytics-preferences" className="analytics-controls analytics-prompt" aria-label="Analytics preferences">
        <div>
          <strong>Optional analytics</strong>
          <p>Allow Vercel to measure page visits, available referrals, and device and approximate location statistics to help improve App Expo. No search text or saved jobs are sent. Your choice is stored in this browser for 180 days. <Link href="/privacy">Privacy notice</Link></p>
          <p role="status">{!enabled ? "Analytics is not activated on this deployment. " : ""}{privacySignal ? "Your browser privacy signal blocks analytics." : consent === "allowed" ? "Analytics allowed. You can decline at any time." : consent === "denied" ? "Analytics declined." : "Analytics stays off unless you allow it."}</p>
        </div>
        <div className="analytics-actions">
          <button type="button" className="button secondary" disabled={privacySignal || consent === "allowed"} onClick={() => { setAnalyticsConsent("allowed"); setPreferencesOpen(false); }}>Allow analytics</button>
          <button type="button" className="button secondary" onClick={() => { setAnalyticsConsent("denied"); setPreferencesOpen(false); }}>{consent === "unset" ? "Continue without analytics" : "Decline analytics"}</button>
          {consent !== "unset" ? <button type="button" className="button secondary" onClick={() => setPreferencesOpen(false)}>Close</button> : null}
        </div>
      </section> : null}
    </>
  );
}
