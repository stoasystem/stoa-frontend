# Phase 22 Research: Stack

**Milestone:** v1.21 Phase 22: Final Demo Packaging, Stakeholder Review, and Launch Candidate Preparation
**Date:** 2026-05-26

## Stack Additions

No new runtime dependencies are needed.

Phase 22 is a packaging, review, lock, and launch-candidate preparation milestone. It should use the existing project stack:

- React + TypeScript + Vite for the current frontend.
- Existing npm scripts for install, dev server, lint, build, preview, demo backend, reset, and E2E where available.
- Existing FastAPI/SQLite demo backend support and reset scripts.
- Existing Playwright configuration and browser QA practices.
- Existing English, German, French, and Italian locale files.
- Existing docs structure under `docs/`, `.planning/`, and README.

## Current Demo Infrastructure

The frontend already has:

- Public pages, auth pages, role routes, role navigation, and app layouts.
- Student chat, teacher-help request, parent dashboard/report, tutor request, billing/pricing, contact, support, and admin demo surfaces.
- Demo backend API mode and stable API boundaries from prior milestones.
- Fixed demo-account convention for `student@test.com`, `parent@test.com`, `tutor@test.com`, and `admin@test.com` with `password123`.
- Demo reset expectations from Phase 14 and later QA work.

Phase 22 should lock and document these pieces rather than redesigning them.

## Tooling Scope

Use existing commands and document their expected role:

- `npm install` for dependency setup.
- `npm run dev` for local frontend startup.
- Demo backend startup/reset commands as already defined in `package.json` or backend docs.
- `npm run build` for launch-candidate build validation.
- Existing Playwright/browser smoke commands where available.

If a command is unavailable or environment-limited, Phase 22 should record that limitation in final demo run results or known issues instead of adding new tooling.

## What Not To Add

- No new frontend dependencies.
- No new product features.
- No new languages.
- No new backend architecture, database schema, ORM, AWS infrastructure, or payment system.
- No large UI redesign.
- No replacement of the i18n system.
- No production email/CRM/contact operations.
- No hidden demo-account disclosure in user-visible UI.

