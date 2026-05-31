# Phase 192: Tooling, Script, and Workflow Drift Audit - Plan

**Created:** 2026-05-27
**Status:** In Progress

## Goal

Audit npm scripts, workflow commands, lockfile consistency, tooling boundaries, and generated-file hygiene for repeat CI failure risks.

## Tasks

- [x] Compare frontend CI workflow commands with `package.json` scripts.
- [x] Validate dependency manifest and lockfile consistency.
- [x] Inspect TypeScript, Vite, Playwright, ESLint, and wrapper script boundaries.
- [x] Check `.gitignore` coverage and working-tree hygiene after generated outputs.
- [x] Fix low-risk drift if found.
- [x] Record residual risks and phase summary.

## Requirements Covered

- SCRIPT36-01
- SCRIPT36-02
- CONFIG36-03
- CONFIG36-04
- HYGIENE36-01
- HYGIENE36-02

## Verification

- `npm ci --dry-run` or equivalent dependency parity check.
- `git status --short --ignored` sampling for generated-file hygiene.
- Local inspection of script and config files.
