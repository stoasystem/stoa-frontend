# Phase 192: Tooling, Script, and Workflow Drift Audit - Summary

**Completed:** 2026-05-27
**Status:** Complete

## What Changed

- Added `.codex-screenshots/` and `.pytest_cache/` to project `.gitignore` so local generated artifacts are ignored by repository rules instead of relying on machine-local ignore state.
- Updated stale codebase map docs that still said the repo had no ESLint config, no lockfile, no TypeScript config, no `index.html`, and no Playwright setup.
- Confirmed `.github/workflows/frontend-ci.yml` matches available npm scripts: `npm ci`, `npm run lint`, and `npm run build`.
- Confirmed `tsconfig.json`, `tsconfig.app.json`, and `tsconfig.node.json` separate browser source from Node/test/config files.

## Audit Results

- `npm ci --dry-run`: passed, package manifest and lockfile are consistent.
- `npm run lint`: passed after the Phase 191 ESLint boundary fix and Phase 192 documentation updates.
- Generated directories remain ignored: `node_modules/`, `dist/`, `test-results/`, backend local files, demo harness logs, `.pytest_cache/`, and `.codex-screenshots/`.

## Residual Risk

- The repository has Playwright E2E support, but the CI workflow currently runs only install, lint, and build. Broader E2E CI should remain future work until runtime cost and demo-state stability are acceptable.

## Requirements Completed

- SCRIPT36-01
- SCRIPT36-02
- CONFIG36-03
- CONFIG36-04
- HYGIENE36-01
- HYGIENE36-02
