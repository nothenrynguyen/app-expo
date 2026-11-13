# Shared page width and persistent gravity field

Pushed to origin/main November 13, 2026 as implementation commit `477e332`. All 194 tests, lint and TypeScript/static export pass. Production deployment and live verification remain unverified.

- Shared public page containers and navigation use the board's 1,440px desktop cap. Footer edges follow the content gutter. Homepage collection cards expand to 1,120px; prose and feedback retain readable inner measures. The private analytics dashboard keeps its existing layout.
- One fixed HeroGravity canvas is mounted in the root layout, outside page transitions. Removed route-level canvases and variant changes, preserving pointer attraction and click ripples across client navigation. Reduced-motion behavior, ignored interactive controls and effect cleanup remain intact.
- Applications' privacy link now uses Next Link to avoid a full document reload. Reloading the browser or opening another tab still creates a new field.

- Logo uses a luminance mask for transparent edges rather than backdrop blending. Removed the homepage count note and shortened its personal explanation.
- Removed Owner dashboard from the footer. A fixed bottom-right admin link appears on hover or keyboard focus; its destination remains /analytics.

## Verification

- All 194 tests pass. Full ESLint and production static export with TypeScript pass. The restricted build encountered generated-folder EPERM errors; the normal-access build passed all 14 static pages.
- Browser checks: header and board both measure 1,440px with matching edges at the desktop test width. About uses the same outer width; homepage collections measure 1,120px.
- The canvas retains backend DOM node 59 through Internships to About to Home. Exactly one gravity canvas is present.
- Home and Internships have no document horizontal overflow at 390px. Mobile header links and stacked homepage cards remain usable. Desktop Home and About have no horizontal overflow.
- No new Updates entry for this layout refinement. Production verification remains separate from local evidence.

- Browser confirmed the logo has no black square and the homepage count note is absent. Admin link is absent from the footer and changes from opacity 0 to 1 on hover.
