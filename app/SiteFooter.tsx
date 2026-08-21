export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>App Expo · Free, direct, and intentionally selective.</span>
      <a
        className="feedback-link"
        href="https://www.linkedin.com/posts/henrynguyen02_no-sign-up-no-bs-here-are-the-jobs-share-7494661754723921921-i2kj/"
        target="_blank"
        rel="noreferrer"
      >
        Have feedback? Comment on LinkedIn
      </a>
      <span className="creator-links" aria-label="TikTok accounts">
        <span className="tiktok-mark" aria-hidden="true">♪</span>
        <span>built by</span>
        <a href="https://www.tiktok.com/@henwoo" target="_blank" rel="noreferrer">@henwoo</a>
        <span>/</span>
        <a href="https://www.tiktok.com/@henwuu" target="_blank" rel="noreferrer">@henwuu</a>
      </span>
    </footer>
  );
}
