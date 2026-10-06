import { useState } from "react";
import type { HiddenCompany } from "@/lib/hidden-companies";

export function HiddenCompanies({ companies, onRestore }: { companies: readonly HiddenCompany[]; onRestore: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const matches = companies.filter((company) => company.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="hidden-companies-panel" id="hidden-companies-panel" aria-label="Hidden companies">
      <h2>Hidden companies ({companies.length})</h2>
      <p>Saved in this browser. Applies across all job boards. Saved jobs and applications stay visible. Clearing site storage removes this list.</p>
      {companies.length ? <><label>Find a hidden company<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <ul>{matches.map((company) => <li key={company.key}><span>{company.name}</span><button className="button secondary" type="button" onClick={() => onRestore(company.name)}>Restore<span className="sr-only"> {company.name}</span></button></li>)}</ul>
        {!matches.length ? <p>No hidden companies match your search.</p> : null}</> : <p>No companies hidden. Open a job’s three-dot menu and choose “Hide company” to personalize your feed.</p>}
  </section>;
}
