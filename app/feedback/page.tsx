import type { Metadata } from "next";
import { SiteFooter } from "../SiteFooter";
import { HeroGravity } from "../HeroGravity";

export const metadata: Metadata = { title: "Feedback | App Expo", description: "Share feedback about App Expo with Henry on LinkedIn." };

export default function FeedbackPage() {
  return <><main className="feedback-shell board-page"><HeroGravity variant="board" /><h1>Feedback</h1><p className="feedback-intro">App Expo is a personal project. Your feedback helps me make it better.</p>
    <div className="feedback-note"><p>I built this to make finding jobs a little simpler, without sign-up gates or extra steps.</p><p>If something is broken, confusing or missing, I want to know. If you have an idea that would make the site more useful, I&apos;d love to hear it.</p></div>
    <section className="feedback-contact" aria-label="Get in touch"><div className="feedback-contact-title"><span className="feedback-linkedin-icon" aria-hidden="true">in</span><a href="https://www.linkedin.com/posts/henrynguyen02_no-sign-up-no-bs-here-are-the-jobs-share-7494661754723921921-i2kj/" target="_blank" rel="noreferrer">Leave a comment on LinkedIn</a></div><p>Comments on any of my posts are preferred. Bugs, feature ideas and general thoughts are all welcome.</p><p>Prefer a private conversation? Open my profile from the post and send me a message.</p><div className="feedback-coming-soon"><span className="feedback-status-dot" aria-hidden="true" />Discord, coming soon</div></section>
    <p className="feedback-signature">Henry</p>
  </main><SiteFooter /></>;
}
