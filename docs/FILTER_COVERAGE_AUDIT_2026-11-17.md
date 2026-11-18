# Exclusion audit, November 17

Inspect-only product audit. No filters, sources, generated snapshots or external services changed. Baseline: published snapshot `240efa6`; origin/main checked and no newer generated-data commit found. Exact employer checks were performed after the snapshot. This is a targeted sample, not a statistically representative false-negative estimate.

## Findings

The pipeline has confirmed classification false negatives. Five quarantined jobs returned HTTP 200 from their exact official Greenhouse job APIs, with active application pages and U.S. locations. Replaying `classifyRoleTags` with current official titles and descriptions still returns no tags for all five:

- [Sharp Electronics, Summer IT AI Intern](https://job-boards.greenhouse.io/sharpelectronics/jobs/4482958009): IT infrastructure, automation, network security and AI integration. Bachelor's/master's students, paid internship. Clear IT scope.
- [Samsung, Intern, AI System Architecture Research Scientist](https://job-boards.greenhouse.io/samsungsemiconductor/jobs/8197305003): AI systems and memory architecture research, San Jose, paid PhD internship. Clear technical scope; degree restrictions remain relevant.
- [Samsung Research America, Generative AI based Imaging and Video R&D](https://job-boards.greenhouse.io/samsungresearchamericainternship/jobs/8927216002): generative imaging algorithms, Plano, paid PhD internship. Clear AI/research scope.
- [Raft, AI/ML Intern, Summer 2027](https://job-boards.greenhouse.io/raft/jobs/6240555004): model building/training and agentic workflows, paid U.S. internship. U.S. citizenship required; that restriction is not evidence the posting is invalid.
- [Judi Health, AI Solutions Intern](https://job-boards.greenhouse.io/judihealth/jobs/5477146008): explicitly developmental entry-level work, business discovery, requirements, automation, implementation and testing. Supported business/technical scope with description evidence.

All five boards were healthy in the saved refresh diagnostics. Base employer evaluation produces a coverage-eligible quarantine, which the existing positive employer-board admission route can resolve. Classification runs first and discards these jobs before that route. This confirms wrong role exclusions, not a claim that a full revised refresh has admitted all five; source-date, review-hold and other final gates still require replay.

The title patterns recognize narrower constructions such as AI research or machine learning scientist, and IT immediately followed by a supported role noun. Titles such as AI/ML Intern, AI System Architecture Research Scientist and IT AI Intern fall between them. A blanket AI-keyword rule would admit unrelated roles, so fixes should require clear title context or substantive description evidence.

A deduplicated title scan found 394 AI/machine-learning/deep-learning internship candidates among role-excluded records. These are review leads, not 394 confirmed publishable jobs. Quarantine rows can carry different reasons across feeds, so diagnostic group counts are not additive or equivalent to the screening ledger.

A counterexample: [New York Times Full-Stack Engineering Intern](https://job-boards.greenhouse.io/thenewyorktimes/jobs/4751907005) returned HTTP 404 from its official job API and redirected to the board error page. It should remain excluded unless new positive evidence appears.

## Backlog and priority

The saved screening ledger records 8,154 destinations pending verification and 5,959 excluded, including 4,258 role exclusions. These are dated snapshot counts, not current live-source totals or confirmed errors. Repeated source rows and jobs already current were removed before selecting audit examples. Most company-size quarantine reasons need an evidence audit, not automatic employer approval; current-board evidence can resolve eligible employer holds without inventing workforce proof.

Recommended order: (1) repair and test narrow classification gaps using positive and negative examples, (2) measure and resolve employer/site verification holds and alias mismatches while preserving permission and closure rules, (3) add reviewed sources with net-new employers/role families. Classification repairs improve yield from existing intake; new sources or expanded official-board coverage remain necessary to meet the separate doubling-of-unique-intake target.

Audit artifacts: `.cache/audit-filters.mjs`, `.cache/filter-audit.json`. No admission changes, commits, pushes or deployments were made in this audit.
