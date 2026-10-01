import Link from "next/link";
import { LogoMark } from "./LogoMark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/"><LogoMark />App Expo</Link>
      <nav className="header-links" aria-label="Primary navigation">
        <Link className="header-home-link" href="/">Home</Link>
        <Link href="/applications">My applications</Link>
        <Link href="/methodology">Methodology</Link>
        <Link href="/sources"><span className="desktop-nav-label">Data sources</span><span className="mobile-nav-label">Sources</span></Link>
      </nav>
    </header>
  );
}
