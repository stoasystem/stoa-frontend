# Phase 193: Local Quality Gate Verification and Targeted Smoke Checks - Plan

**Created:** 2026-05-27
**Status:** In Progress

## Goal

Verify that the repaired workflow survives install parity, lint, build, and targeted smoke checks.

## Tasks

- [x] Run `npm ci`.
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Run `npm run test:e2e` or document why it cannot run.
- [x] Record verification evidence and residual risk.

## Requirements Covered

- QA36-01
- QA36-02
- QA36-03
- QA36-04

## Verification

- `npm ci`
- `npm run lint`
- `npm run build`
- `npm run test:e2e`
