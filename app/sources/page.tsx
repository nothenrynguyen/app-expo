import type { Metadata } from "next";
import sourceCatalog from "@/data/sources.json";
import { MIT_LICENSE_TEXT, sourceLicenseReview } from "@/lib/source-licenses";
import { SiteFooter } from "../SiteFooter";

export const metadata: Metadata = {
  title: "Sources & Credits | App Expo",
  description: "The public job-list sources, license review, attribution, and zero-cost commitments behind App Expo.",
};

const sourcesByRepository = new Map<string, string[]>();
for (const source of sourceCatalog.sources) {
  const names = sourcesByRepository.get(source.repository) ?? [];
  names.push(source.name);
  sourcesByRepository.set(source.repository, names);
}

const licenses = [...sourceLicenseReview.repositories].sort((a, b) => a.repository.localeCompare(b.repository));
const licensedCount = licenses.filter((license) => license.status === "licensed").length;
const unresolvedCount = licenses.length - licensedCount;

export default function SourcesPage() {
  return (
    <main>
      <section className="sources-shell">
        <div className="sources-hero">
          <p className="eyebrow">Sources &amp; credits</p>
          <h1>Built in public.<br />Credited in public.</h1>
          <p>App Expo combines maintained community job lists with direct employer career-page checks. This page records where the upstream feeds come from, what license was detected, and what remains unresolved.</p>
        </div>

        <section className="cost-commitment" aria-labelledby="cost-commitment-title">
          <div>
            <p className="eyebrow">Zero-cost commitment</p>
            <h2 id="cost-commitment-title">No billing account. No paid gate.</h2>
          </div>
          <div>
            <p>App Expo is intentionally operated without a payment method, usage-based billing, paid add-ons, or services that can create overage charges.</p>
            <p>The site remains personal and non-commercial. Browsing, filtering, and following a direct application link do not require an account.</p>
          </div>
        </section>

        <section className="source-audit" aria-labelledby="source-audit-title">
          <div className="source-section-heading">
            <div>
              <p className="eyebrow">Upstream review</p>
              <h2 id="source-audit-title">Every catalog repository has a recorded status.</h2>
            </div>
            <p>Last reviewed {sourceLicenseReview.reviewedAt}. A missing license is shown as unresolved, never as permission.</p>
          </div>

          <div className="source-summary" aria-label="Source license summary">
            <div><strong>{sourceCatalog.sources.length}</strong><span>active feed entries</span></div>
            <div><strong>{licenses.length}</strong><span>unique repositories</span></div>
            <div><strong>{licensedCount}</strong><span>MIT licensed</span></div>
            <div><strong>{unresolvedCount}</strong><span>need permission review</span></div>
          </div>

          <div className="source-license-grid">
            {licenses.map((license) => {
              const sourceNames = sourcesByRepository.get(license.repository) ?? [];
              const licensed = license.status === "licensed";
              return (
                <article className="source-license-card" key={license.repository}>
                  <div className="source-license-topline">
                    <span className={`license-status ${licensed ? "licensed" : "unresolved"}`}>
                      {licensed ? "MIT licensed" : "No license detected"}
                    </span>
                    <span>{sourceNames.length} {sourceNames.length === 1 ? "feed" : "feeds"}</span>
                  </div>
                  <h3>
                    <a href={`https://github.com/${license.repository}`} target="_blank" rel="noreferrer">
                      {license.repository}
                    </a>
                  </h3>
                  <p>{license.note}</p>
                  {license.copyright && <p className="source-copyright">{license.copyright}</p>}
                  <ul aria-label={`Feeds from ${license.repository}`}>
                    {sourceNames.map((name) => <li key={name}>{name}</li>)}
                  </ul>
                  {license.licenseUrl && (
                    <a className="source-license-link" href={license.licenseUrl} target="_blank" rel="noreferrer">
                      Read repository license <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="source-notices" aria-labelledby="source-notices-title">
          <div>
            <p className="eyebrow">Attribution</p>
            <h2 id="source-notices-title">MIT license notice</h2>
            <p>The copyright notices shown above and this permission notice apply to the MIT-licensed repositories. Full notices are also preserved in the project&apos;s third-party notices file.</p>
          </div>
          <details>
            <summary>Read the MIT license text</summary>
            <pre>{MIT_LICENSE_TEXT}</pre>
          </details>
        </section>

        <section className="source-disclaimer" aria-labelledby="source-disclaimer-title">
          <p className="eyebrow">Boundaries</p>
          <h2 id="source-disclaimer-title">Credit is not endorsement.</h2>
          <div>
            <p>Upstream maintainers do not sponsor, operate, or endorse App Expo. Company names and trademarks belong to their respective owners.</p>
            <p>Job links lead to third-party employer or recruiting sites. Repository licenses can cover repository material without resolving every right associated with third-party job information, so commercial use requires a separate review.</p>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
