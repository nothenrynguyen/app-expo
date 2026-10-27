<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Writing style

- Never use em dashes in user-facing copy. Rewrite the sentence with commas, periods, parentheses, or a colon instead.

## Project documentation workflow

- At the start of substantive work, consult ROADMAP.md and docs/ACTIVE_TASKS.md when relevant, and check current project evidence before relying on old status or counts.
- Before finishing substantive work, update the relevant roadmap, active tasks, and focused documentation when priorities, implementation status, decisions, operational state, blockers, or next steps change. Record evidence and distinguish local work from published or verified work.
- Consider a dated entry in app/updates/page.tsx for meaningful user-facing milestones. Routine refreshes, deployments, and minor fixes do not need entries.
- Keep active notes concise, retain useful history in linked reviews or archives, and avoid duplicating secrets, private analytics, or stale counts. Small changes that do not alter project status need no documentation edits.
- Follow the user's instructions and existing approval requirements; documentation updates do not authorize deployment.
