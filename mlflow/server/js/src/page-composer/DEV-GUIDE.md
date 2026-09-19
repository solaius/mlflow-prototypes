# Page Composer — Development & Deployment Guide

## Quick Start

```bash
cd ~/Desktop/ODH/mlflow/.claude/worktrees/puck-page-composer-spike/mlflow/server/js

# Dev server with hot reload (standalone composer at port 4000)
yarn webpack serve --config src/page-composer/deploy/webpack.composer.js

# Or full MLflow app (composer at /#/page-composer)
PORT=3333 yarn start --ignore-engines
```

## Making Changes

1. Edit files in `src/page-composer/`
2. Verify at http://localhost:4000 (standalone) or http://localhost:3333/#/page-composer (full app)
3. When happy, amend the single commit to stay 1 ahead of master:

```bash
git add src/page-composer/ .gitignore
git commit --amend -s --no-edit
```

> **Note:** `build-composer/` is gitignored — never commit build artifacts.
> The production bundle is built locally before `podman build` or in CI.

## Build & Deploy

### Prerequisites
- `podman machine start` (if not running)
- `podman login quay.io` (uses saved credentials)
- `oc login` to the OpenShift cluster

### Upstream

```bash
cd ~/Desktop/ODH/mlflow/.claude/worktrees/puck-page-composer-spike/mlflow/server/js

# 1. Build production bundle
NODE_ENV=production yarn webpack --config src/page-composer/deploy/webpack.composer.js

# 2. Build + push image
podman build --platform linux/amd64 \
  -t quay.io/juntao_wang/page-composer:upstream \
  -f src/page-composer/deploy/Dockerfile .
podman push quay.io/juntao_wang/page-composer:upstream

# 3. Push branch + rollout
git push origin page-composer-upstream --force-with-lease
oc rollout restart deployment/page-composer-upstream -n page-composer
```

### Downstream (must build separately for PF overrides)

The downstream branch includes PatternFly files that the `composer-entry.tsx`
try/catch auto-detects. The bundle MUST be built from the downstream worktree
so PF styles are included — do NOT copy the upstream bundle.

```bash
cd ~/Desktop/ODH/mlflow/.claude/worktrees/puck-page-composer-spike

# 1. Create temp worktree (never branch-switch — that caused lost changes before)
git worktree add /tmp/page-composer-downstream page-composer-downstream
cd /tmp/page-composer-downstream/mlflow/server/js

# 2. Copy source files from upstream worktree
SRC=~/Desktop/ODH/mlflow/.claude/worktrees/puck-page-composer-spike/mlflow/server/js
rm -rf src/page-composer
cp -r "$SRC/src/page-composer/" src/page-composer/
cp "$SRC/.gitignore" .gitignore

# 3. Amend commit (stay 1 ahead)
git add -A
git commit --amend -s --no-edit --no-verify

# 4. Install deps + build (PF files are in this worktree)
yarn install --immutable
NODE_ENV=production yarn webpack --config src/page-composer/deploy/webpack.composer.js
# Verify: should compile with 0 warnings (PF modules found)

# 5. Build + push image
podman build --platform linux/amd64 \
  -t quay.io/juntao_wang/page-composer:downstream \
  -f src/page-composer/deploy/Dockerfile .
podman push quay.io/juntao_wang/page-composer:downstream

# 6. Push branch + rollout
git push origin page-composer-downstream --force-with-lease
oc rollout restart deployment/page-composer-downstream -n page-composer

# 7. Clean up
cd ~
git -C ~/Desktop/ODH/mlflow/.claude/worktrees/puck-page-composer-spike \
  worktree remove /tmp/page-composer-downstream
```

### Verification

| Check | Upstream | Downstream |
|-------|----------|------------|
| Webpack warnings | 2 (PF modules missing — expected) | 0 (PF modules found) |
| PF token translation | Not applied | Applied (fonts, spacing adapt) |
| `pf-shell-root` class | Empty string | Applied to root div |

## Rebasing When Master Advances

```bash
# Upstream
cd ~/Desktop/ODH/mlflow/.claude/worktrees/puck-page-composer-spike
git fetch mlflow
git rebase mlflow/master
# Resolve any conflicts, then force-push + rebuild

# Downstream (in temp worktree)
git worktree add /tmp/page-composer-downstream page-composer-downstream
cd /tmp/page-composer-downstream
git fetch opendatahub-io
git rebase opendatahub-io/master
# Resolve conflicts, force-push + rebuild
```

## CI/CD (GitHub Actions)

The workflow `.github/workflows/page-composer-deploy.yml` runs automatically on
push to either branch, daily at 6am UTC, or via manual dispatch.

It does: rebase onto source master → install deps → build bundle → build + push
image → rollout on OpenShift.

### Required GitHub Secrets

Set these at https://github.com/DaoDaoNoCode/mlflow/settings/secrets/actions:

| Secret | Value | How to get |
|--------|-------|------------|
| `QUAY_USERNAME` | `juntao_wang+page_composer_ci` | Quay.io → Robot Accounts → `page_composer_ci` |
| `QUAY_PASSWORD` | Robot account token | Same page, copy token |
| `OPENSHIFT_TOKEN` | Service account token | `oc get secret page-composer-deployer-token -n page-composer -o jsonpath='{.data.token}' \| base64 -d` |

### Setting Up Secrets Step by Step

1. **Quay.io robot account** (already created):
   - Go to https://quay.io/organization/juntao_wang
   - Click **Robot Accounts** in the left nav
   - Find `page_composer_ci` → click the robot name
   - Copy the **Username** (`juntao_wang+page_composer_ci`) and **Token**

2. **OpenShift service account token**:
   ```bash
   oc get secret page-composer-deployer-token -n page-composer \
     -o jsonpath='{.data.token}' | base64 -d
   ```

3. **Add to GitHub**:
   - Go to https://github.com/DaoDaoNoCode/mlflow/settings/secrets/actions
   - Click **New repository secret** for each of the 3 secrets above
   - Paste the values exactly (no trailing newlines)

4. **Test**:
   - Go to **Actions** → **Page Composer — Sync, Build & Deploy**
   - Click **Run workflow** → select `both` → **Run workflow**
   - Watch the run — it should sync, build, push, and deploy both variants

## Deployed Routes

| Variant    | URL |
|------------|-----|
| Upstream   | https://page-composer-upstream.apps.rosa.juntwang-new.z96p.p3.openshiftapps.com |
| Downstream | https://page-composer-downstream.apps.rosa.juntwang-new.z96p.p3.openshiftapps.com |

## Branch Strategy

- `page-composer-upstream` — tracks `mlflow/master`, always exactly 1 commit ahead
- `page-composer-downstream` — tracks `opendatahub-io/master`, always exactly 1 commit ahead
- Both live on the `DaoDaoNoCode/mlflow` fork (remote `origin`)

## Key Files

| File | Purpose |
|------|---------|
| `puck-components.tsx` | All Puck component configs + root shell |
| `PageComposer.tsx` | Editor/preview/journey modes + journey folders |
| `templates/*.ts` | Built-in page templates |
| `deploy/composer-entry.tsx` | Standalone entry point (auto-detects PF via try/catch) |
| `deploy/composer.html` | HTML template with font/height setup |
| `deploy/webpack.composer.js` | Standalone build config |
| `deploy/Dockerfile` | Container image (nginx serving static files) |
| `deploy/openshift.yaml` | OpenShift Deployment + Service + Route |
| `DEV-GUIDE.md` | This file |

## Conventions

- Use `css={}` (Emotion), not `style={}`
- Use `theme.spacing.*`, `theme.colors.*`, `theme.typography.*` — no hardcoded pixels in render functions
- Gap/padding fields use named spacing tokens (`xs`/`sm`/`md`/`lg`) resolved via `resolveSpacing()` at render time
- Card width via `css={{ width, boxSizing: 'border-box' }}`, not the Card `width` prop
- Every DuBois component needs a `componentId` prop
- The root shell gradient is copied from `MlflowRouter.tsx` — keep in sync
- Modals with text inputs must be extracted into separate components to avoid re-rendering Puck on every keystroke
