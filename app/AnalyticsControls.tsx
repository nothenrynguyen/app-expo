"use client";

import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ActivityTracking } from "./ActivityTracking";
import { activityConfigured, stopActivityCollection } from "@/lib/activity-client";
import {
  beforeAnalyticsSend, browserPrivacySignalEnabled, getAnalyticsConsent,
  setAnalyticsConsent, subscribeAnalyticsConsent,
} from "@/lib/analytics";

const enabled = (activityConfigured || process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true") && process.env.NODE_ENV === "production";
const serverConsent = () => "unset" as const;
const serverSignal = () => false;
const subscribeReady = () => () => {};
const OPEN_PREFERENCES = "app-expo:open-analytics-preferences";

export function AnalyticsPreferencesButton() {
  return <button className="button secondary footer-preferences" type="button" aria-controls="analytics-preferences" onClick={() => window.dispatchEvent(new Event(OPEN_PREFERENCES))}>Analytics preferences</button>;
}

export function AnalyticsControls() {
  const consent = useSyncExternalStore(subscribeAnalyticsConsent, getAnalyticsConsent, serverConsent);
  const privacySignal = useSyncExternalStore(subscribeAnalyticsConsent, browserPrivacySignalEnabled, serverSignal);
  const pathname = usePathname();
  const ready = useSyncExternalStore(subscribeReady, () => true, serverSignal);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  useEffect(() => {
    const open = () => setPreferencesOpen(true);
    window.addEventListener(OPEN_PREFERENCES, open);
    return () => window.removeEventListener(OPEN_PREFERENCES, open);
  }, []);
  const showChoice = preferencesOpen || (ready && enabled && consent === "unset" && !privacySignal);
  return (
    <>
      {activityConfigured ? <ActivityTracking allowed={enabled && consent === "allowed" && !privacySignal} /> : null}
      {!activityConfigured && enabled && consent === "allowed" && !privacySignal ? (
        <Analytics mode="production" debug={false} route={pathname} path={pathname} beforeSend={beforeAnalyticsSend} />
      ) : null}
      {showChoice ? <section id="analytics-preferences" className="analytics-controls analytics-prompt" aria-label="Analytics preferences">
        <div>
          <strong>Optional analytics</strong>
          <p>{activityConfigured ? "Allow page visits and feature-use counts with a random browser ID to help improve empluzzed. No searches, job details, or application records are sent. Your choice and browser ID last up to 180 days." : "Allow Vercel to measure page visits, available referrals, and device and approximate location statistics to help improve empluzzed. No search text or saved jobs are sent. Your choice is stored in this browser for 180 days."} <Link href="/privacy">Privacy notice</Link></p>
          <p role="status">{!enabled ? "Analytics is not activated on this deployment. " : ""}{privacySignal ? "Your browser privacy signal blocks analytics." : consent === "allowed" ? "Analytics allowed. You can decline at any time." : consent === "denied" ? "Analytics declined." : "Analytics stays off unless you allow it."}</p>
        </div>
        <div className="analytics-actions">
          <button type="button" className="button secondary" disabled={privacySignal || consent === "allowed"} onClick={() => { setAnalyticsConsent("allowed"); setPreferencesOpen(false); }}>Allow analytics</button>
          <button type="button" className="button secondary" onClick={() => { stopActivityCollection(); setAnalyticsConsent("denied"); setPreferencesOpen(false); }}>{consent === "unset" ? "Continue without analytics" : "Decline analytics"}</button>
          {consent !== "unset" ? <button type="button" className="button secondary" onClick={() => setPreferencesOpen(false)}>Close</button> : null}
        </div>
      </section> : null}
    </>
  );
}
