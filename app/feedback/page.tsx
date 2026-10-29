import type { Metadata } from "next";
import { SiteFooter } from "../SiteFooter";
import { HeroGravity } from "../HeroGravity";

export const metadata: Metadata = { title: "Feedback | empluzzed", description: "Share feedback about empluzzed with Henry on LinkedIn." };

export default function FeedbackPage() {
  return <><main className="feedback-shell board-page"><HeroGravity variant="board" /><h1>Feedback</h1><p className="feedback-intro">empluzzed is a personal project. Your feedback helps me make it better.</p>
    <div className="feedback-note"><p>I built this to make finding jobs a little simpler, without sign-up gates or extra steps.</p><p>Found a bug, a bad listing, or something I could make easier? Let me know.</p></div>
    <section className="feedback-contact" aria-label="Get in touch"><div className="feedback-contact-title"><span className="feedback-linkedin-icon" aria-hidden="true">in</span><a href="https://www.linkedin.com/posts/henrynguyen02_no-sign-up-no-bs-here-are-the-jobs-share-7494661754723921921-i2kj/" target="_blank" rel="noreferrer">Leave a comment on LinkedIn</a></div><p>Bugs, ideas, and general thoughts are welcome.</p><p>Prefer a private conversation? Send me a <a href="https://www.linkedin.com/in/henrynguyen02/" target="_blank" rel="noreferrer">message on LinkedIn</a>.</p></section>
    <p className="feedback-signature">Henry</p>
  </main><SiteFooter /></>;
}
