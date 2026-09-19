import type { Metadata } from "next";
import sourceCatalog from "@/data/sources.json";
import { MIT_LICENSE_TEXT, sourceLicenseReview } from "@/lib/source-licenses";
import { AnimatedCount } from "../AnimatedCount";
import { PageTransition } from "../PageTransition";
import { SiteFooter } from "../SiteFooter";

export const metadata: Metadata = {
  title: "Data Sources | App Expo",
  description: "Where App Expo finds listings and how those sources are checked and credited.",
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
  return <PageTransition>
    <main>
      <section className="sources-shell">
        <div className="sources-hero">
          <h1 className="sr-only">Data sources</h1>
          <p className="eyebrow">Data sources</p>
          <p>App Expo combines maintained community job lists, removes duplicates, and checks listings against employer career pages before sending you to the original application.</p>
        </div>

        <section className="source-audit" aria-label="Community data sources">
          <div className="source-summary" aria-label="Data source summary">
            <div><AnimatedCount value={sourceCatalog.sources.length} /><span>active feed entries</span></div>
            <div><AnimatedCount value={licenses.length} /><span>unique repositories</span></div>
            <div><AnimatedCount value={licensedCount} /><span>MIT licensed</span></div>
            <div><AnimatedCount value={unresolvedCount} /><span>no license detected</span></div>
          </div>

          <div className="source-license-list">
            {licenses.map((license) => {
              const sourceNames = sourcesByRepository.get(license.repository) ?? [];
              const licensed = license.status === "licensed";
              return (
                <article className="source-license-row" key={license.repository}>
                  <div className="source-license-main">
                    <div className="source-license-topline">
                      <span className={`license-status ${licensed ? "licensed" : "unresolved"}`}>
                        {licensed ? "MIT licensed" : "License not found"}
                      </span>
                      <span>{sourceNames.length} {sourceNames.length === 1 ? "feed" : "feeds"}</span>
                    </div>
                    <h2>
                      <a href={`https://github.com/${license.repository}`} target="_blank" rel="noreferrer">
                        {license.repository}
                      </a>
                    </h2>
                    <p>{license.note}</p>
                    {license.copyright && <p className="source-copyright">{license.copyright}</p>}
                  </div>
                  <div className="source-license-feeds">
                    <ul aria-label={`Feeds from ${license.repository}`}>
                      {sourceNames.map((name) => <li key={name}>{name}</li>)}
                    </ul>
                    {license.licenseUrl && (
                      <a className="source-license-link" href={license.licenseUrl} target="_blank" rel="noreferrer">
                        Read repository license <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="source-notes-grid">
          <section className="source-notices" aria-labelledby="source-notices-title">
            <div>
              <p className="eyebrow">Credits</p>
              <h2 id="source-notices-title">Attribution, kept accessible.</h2>
              <p>App Expo credits each community project above. Copyright and permission notices are preserved in the repository&apos;s third-party notices file.</p>
            </div>
            <details>
              <summary>View MIT permission notice</summary>
              <pre>{MIT_LICENSE_TEXT}</pre>
            </details>
          </section>

          <section className="source-disclaimer" aria-labelledby="source-disclaimer-title">
            <div>
              <p className="eyebrow">Boundaries</p>
              <h2 id="source-disclaimer-title">Credit is not endorsement.</h2>
            </div>
            <div>
              <p>Upstream maintainers do not sponsor, operate, or endorse App Expo. Company names and trademarks belong to their respective owners.</p>
              <p>Job links lead to third-party employer or recruiting sites. Listings can change or close at any time, so confirm the details on the employer&apos;s page before applying.</p>
            </div>
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  </PageTransition>;
}
