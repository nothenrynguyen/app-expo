import Link from "next/link";
import { LogoMark } from "./LogoMark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/"><LogoMark />App Expo</Link>
      <nav className="header-links" aria-label="Primary navigation">
        <Link href="/">Home</Link>
        <Link href="/#about">About</Link>
        <Link href="/methodology">Methodology</Link>
      </nav>
    </header>
  );
}
