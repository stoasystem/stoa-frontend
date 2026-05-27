# Phase 191: CI Failure Reproduction and ESLint Environment Fix - Plan

**Created:** 2026-05-27
**Status:** In Progress

## Goal

Reproduce and fix the CI lint failure without weakening the broader lint gate.

## Tasks

- [x] Inspect `.github/workflows/frontend-ci.yml` to identify the CI command sequence.
- [x] Reproduce the lint failure locally.
- [x] Add a Node-targeted ESLint flat-config block for scripts and config files.
- [x] Verify `npm run lint`.
- [x] Verify `npm run build`.
- [x] Record a concise phase summary.

## Requirements Covered

- CI36-01
- CI36-02
- CONFIG36-01
- CONFIG36-02
- QA36-01

## Verification

- `npm run lint`
- `npm run build`
