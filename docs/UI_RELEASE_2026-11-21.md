# UI release preparation, November 21, 2026

Status: final verification completed locally; release is authorized and publication is next. The browser blocker described below is historical and was resolved with a fresh session plus focused interaction tests. Production success must still be verified after pushing.

## Final verification follow-up

- Fresh in-app browser session completed desktop 1440px, tablet 768px and mobile 320px checks without using the failing raw emulation command. No page-wide horizontal overflow was observed. At 768px, the 1040px table remains within its own 697px scroll area. Full location lists expand inline and Escape restores summary focus. Specialty links navigate correctly and preserve the selected label.
- At 320px, date-window buttons, Reset filters and company menus measure at least 44px in both dimensions. Mobile filters open, expose named controls and close with Escape, returning focus to Filters. Desktop captured browser warnings/errors were empty. Evidence screenshots are local ignored artifacts `.cache/ui-release-desktop.jpg` and `.cache/ui-release-mobile.jpg` in the primary checkout.
- Focused React DOM interaction tests use jsdom in a temporary local QA folder, without adding app dependencies. They passed tracker opening/cancel/save focus, declined deletion, confirmed deletion, fallback focus and unrelated-record preservation. They also passed snapshot rendering, immediate reduced-motion switching, inert/hidden outgoing trees, 350ms cleanup, changing motion preference mid-transition, filter naming, specialty link semantics and debounced zero-result announcements. Harness: primary checkout `.cache/ui-interaction-qa.tsx`.
- Native delete confirmation and reduced-motion behavior were tested through the application's actual React event handlers in the isolated DOM test environment, not by claiming successful browser emulation. Browser speech output, physical devices and actual browser zoom were not certified; 320px reflow and accessibility-tree checks provide the scoped visual/semantic evidence for this release.
- The earlier fictional localhost:3000 record is unrelated to production and was not copied to the release. Cleanup of that older isolated-browser record is still unconfirmed; the new browser session's localhost:3003 tracker was empty and no new real browser tracker records were created.
- The preview server was stopped after local verification. The owner-approved scope includes commit, push, deployment and live verification; no new approval is required.

## Integration

- Release branch: `codex/ui-audit-release`, based on current published source `4b30c2c0`.
- The primary checkout was still at `ed0a895` with unrelated local analytics/collector edits. Only the seven approved UI files, product context, workflow preference and audit report were carried into the release checkout.
- Three-way integration preserved current remembered board preferences, Pacific calendar filters, Added dates, verification labels and current data. Import and appended-CSS conflicts were resolved explicitly.
- The published baseline already pins Next.js and eslint-config-next 16.4.6. The earlier warning came from the old checkout's 16.4.3 installation. No new dependency upgrade is needed in the release baseline. `npm audit --omit=dev` reports zero vulnerabilities.
- Vercel connection lists the expected Hobby team but no projects. GitHub reports success for baseline deployment `EbyWn1cutVAeNcZk1PgNDXBT3irm`. Existing Git-to-Vercel publication is the intended release route, with live verification afterwards.

## Validation

- Isolated `npm ci` installed the committed dependency lockfile.
- `npm run verify` passed clean type checking, all 272 tests, lint and static export on the integrated patch.
- Follow-up CSS extends 44px targets to the current date-window/reset controls and uses inline full-location expansion at tablet widths to avoid a clipped popover in the compact table scroller. Final checks must cover these follow-ups before publication.
- The integrated local preview served `/jobs?role=engineering` successfully and the accessibility tree exposed named filter controls and preserved current date/preferences features.
- Browser emulation repeatedly expired during `Emulation.setEmulatedMedia`; do not repeat that failing route. Native Chrome fallback was then stopped by the computer-use safety check because it could not confidently identify the active URL. No further UI input was attempted.
- Outstanding: reduced-motion runtime verification, intermediate-width and zoom/reflow checks, assistive-technology interaction, and delete-confirmation/fallback-focus verification. The fictional sample from the earlier localhost:3000 test may remain in isolated browser storage; cleanup is not confirmed.

## Resume

1. Restore a working, policy-verifiable browser session; complete the outstanding checks without altering real records.
2. Run final checks in this checkout and record results. Inspect final scoped diff.
3. Fetch origin and integrate any new main commits without discarding current data or source work.
4. Commit only the approved release files, push the reviewed commit to main using a normal fast-forward update, await Vercel success, and verify production assets and interactions.
5. Record the actual release commit, deployment and production evidence. Preserve the unrelated primary-checkout changes.
