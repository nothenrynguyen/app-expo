import type { Metadata } from "next";
import { SiteFooter } from "../SiteFooter";

export const metadata: Metadata = { title: "Feedback | App Expo", description: "Share feedback about App Expo with Henry on LinkedIn." };

export default function FeedbackPage() {
  return <><main className="methodology-shell info-page"><p className="eyebrow">Help improve App Expo</p><h1>Have feedback?</h1><p className="info-intro">Found a bug, have an idea, or just want to share what&apos;s working? I&apos;d love to hear it.</p>
    <section className="info-section"><h2>Comment on LinkedIn (preferred)</h2><p>Leave a comment on any of my LinkedIn posts. It&apos;s the easiest way to share ideas and let others join the conversation.</p><a href="https://www.linkedin.com/posts/henrynguyen02_no-sign-up-no-bs-here-are-the-jobs-share-7494661754723921921-i2kj/" target="_blank" rel="noreferrer">Start with my App Expo post</a></section>
    <section className="info-section"><h2>Message me</h2><p>Prefer a private conversation? You can also message me on LinkedIn. Open my profile from the post above to get in touch.</p></section>
    <section className="info-section"><h2>Discord, coming soon</h2><p>A community space for feedback and discussion is on the way. I&apos;ll add the invite here when it&apos;s ready.</p></section>
  </main><SiteFooter /></>;
}
