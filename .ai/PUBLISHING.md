# Publishing runbook

Manual release process for `cron-bomb` (no Changesets). Package is published to **npm**; source and release notes live on **GitHub**.

## Prerequisites

- [ ] Maintainer access to the [npm package](https://www.npmjs.com/package/cron-bomb) (`npm whoami` succeeds for that account)
- [ ] Push access to `https://github.com/Sam-Scheding/cron-bomb-js`
- [ ] Clean working tree on the release branch (usually `master`), synced with remote
- [ ] Node.js ≥ 16

```bash
npm whoami
git status
git checkout master
git pull
```

## Choose the version bump

| Change | Bump | Example |
| --- | --- | --- |
| Breaking public API / Node engines / package entry contract | **major** | `1.0.0` → `2.0.0` |
| Backwards-compatible feature or types | **minor** | `1.0.0` → `1.1.0` |
| Bug fix, docs-only (if you version docs), chores that don’t change API | **patch** | `1.0.0` → `1.0.1` |

First TypeScript / stable-API cut from `0.1.0`: prefer a version that is **not already on the registry**.
Check with `npm view cron-bomb versions`. Historically `1.0.0` / `1.0.1` were already published (old JS package); use **`2.0.0`** (or another free version) for this release.

Draft release notes from `git log <previous-tag>..HEAD` (or merge-base) covering: breaking changes, features, fixes, migration tips.

## Pre-flight checks

Run from repo root:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Confirm the pack contents look right (should include `package.json`, `README.md`, and `dist/**` — **not** `src/` alone):

```bash
npm pack --dry-run
```

If the tarball lists only `package.json` + `README.md`, the build did not emit `dist/` (often because `clean` removed `dist` but left `tsconfig.tsbuildinfo`, so `tsc` skipped emit). Run `npm run clean && npm run build` and dry-run again before publishing.

Optional: inspect what would publish without uploading:

```bash
npm publish --dry-run
```

**Do not publish** if `dist/index.js` is missing from the dry-run listing.

## Bump version and tag

Prefer `npm version` so `package.json` and the git tag stay in sync:

```bash
# one of:
npm version major -m "release: %s"
npm version minor -m "release: %s"
npm version patch -m "release: %s"

# or an explicit version (e.g. first 1.0.0):
npm version 1.0.0 -m "release: %s"
```

This commits the version bump and creates an annotated tag `vX.Y.Z`.

If you already committed the bump by hand:

```bash
git tag -a v1.0.0 -m "v1.0.0"
```

## Publish to npm

`prepublishOnly` runs `clean` + `build` automatically.

```bash
npm publish --access public
```

(Use `--access public` for the first publish of an unscoped package if npm prompts; subsequent publishes inherit public.)

Verify:

```bash
npm view cron-bomb version
npm view cron-bomb dist-tags
```

Install smoke-test in a temp dir:

```bash
mkdir /tmp/cron-bomb-smoke && cd /tmp/cron-bomb-smoke
npm init -y
npm install cron-bomb@X.Y.Z
node -e "const { explode } = require('cron-bomb'); console.log(typeof explode)"
```

## Push git commit + tag

```bash
git push origin master
git push origin vX.Y.Z
```

(Use your real branch name if different.)

## GitHub Release

Create a GitHub Release for tag `vX.Y.Z` with the notes drafted earlier:

```bash
gh release create vX.Y.Z --title "vX.Y.Z" --notes-file - <<'EOF'
## What's changed

- …

## Breaking changes

- … (or "None")

## Install

```bash
npm install cron-bomb@X.Y.Z
```
EOF
```

Or use the GitHub UI: **Releases → Draft a new release → choose tag**.

GitHub Releases are how most consumers discover versions on the repo; they do **not** replace `npm publish`.

### Optional: GitHub Packages

This package is **unscoped** (`cron-bomb`) and targets the public npm registry. GitHub Packages usually expects a scoped name (e.g. `@sam-scheding/cron-bomb`) and a separate `publishConfig.registry`. Skip dual-registry publish unless you deliberately add a scoped package later.

## Aftercare

- [ ] Confirm README badges / install snippets still make sense
- [ ] Close or comment on issues fixed by the release
- [ ] If the release was breaking, call out migration in the GitHub Release body

## Rollback / oops

npm almost never allows republishing the same version. Options:

1. **Yank (deprecate)** a bad version:

   ```bash
   npm deprecate cron-bomb@X.Y.Z "Broken; use X.Y.Z+1"
   ```

2. **Publish a follow-up** patch/minor/major that fixes the problem.

3. Only in extreme cases, [unpublish](https://docs.npmjs.com/unpublishing-packages-from-the-registry) within npm’s time window — prefer deprecate + new version.

If the git tag was pushed but npm publish failed: fix the issue, delete the local/remote tag if the version was never published, then retry; if the version **was** published, bump again.

## Checklist (copy/paste)

```text
[ ] On master, clean, pulled
[ ] Lint / typecheck / test / build green
[ ] npm pack --dry-run looks correct
[ ] Release notes drafted
[ ] npm version <major|minor|patch|x.y.z>
[ ] npm publish --access public
[ ] npm view cron-bomb version OK
[ ] git push + push tag
[ ] gh release create (or UI)
[ ] Smoke install of the new version
```
