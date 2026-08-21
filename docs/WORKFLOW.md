# Cross-Device Development Workflow

Use this when switching between the Mac and Windows PC.

## One-Time Setup Per Device

1. Install Node 22.
   - Mac with `nvm`: `nvm install && nvm use`
   - Mac with `fnm`: `fnm install && fnm use`
   - Windows with nvm-windows: `nvm install 22` then `nvm use 22`
2. Install dependencies from the lockfile:

   ```bash
   npm ci
   ```

3. Confirm the repo is clean before starting:

   ```bash
   git status --short --branch
   ```

## Start A Work Session

```bash
git checkout main
git pull --ff-only
npm ci
npm test
npm run dev
```

Use `npm ci` when switching machines because it recreates `node_modules` exactly from
`package-lock.json`. Use `npm install` only when intentionally adding, removing, or updating
dependencies.

## End A Work Session

```bash
npm test
npm run lint
npm run build
git status --short
git add <changed-files>
git commit -m "type: short description"
git push
```

After pushing, the other device should start with `git pull --ff-only`.

## Branch Rhythm

For small solo changes, working directly on `main` is okay if each session ends with a commit and
push. For anything that may take more than one sitting, create a branch:

```bash
git checkout -b codex/short-feature-name
```

Push the branch before switching devices:

```bash
git push -u origin codex/short-feature-name
```

Then on the other device:

```bash
git fetch origin
git checkout codex/short-feature-name
```

## Data Refresh Notes

This project commits generated public data snapshots. Before doing UI work, pull first because
GitHub Actions can push refreshed data to `main`.

Run local refreshes only when you intend to update the committed data files:

```bash
npm run sync:jobs
npm run maintain:sources -- --mode=daily
```

## Avoiding Cross-Device Pain

- Do not commit `node_modules`, `.next`, `out`, `.vercel`, or `.env*`; they are already ignored.
- Keep secrets in local `.env` files only.
- Prefer `git pull --ff-only` so Git stops instead of creating accidental merge commits.
- Commit or stash local changes before leaving one device.
