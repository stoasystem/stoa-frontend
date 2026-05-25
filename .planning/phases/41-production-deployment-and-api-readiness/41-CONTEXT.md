---
phase: 41
title: Production Deployment and API Readiness
status: complete
date: 2026-05-25
---

# Phase 41 Context

Phase 41 belongs to Milestone v1.8 Phase 9: Production Readiness, Monitoring, and Pilot Launch.

The phase is documentation-only. It prepares STOA for production-like pilot deployment decisions by documenting frontend/backend URLs, production environment variables, launch gate commands, database boundaries, pilot API contract freeze expectations, and breaking-change coordination.

## Requirements

- PROD-01: Production frontend URL options and preferred stable pilot URL documented.
- PROD-02: Production backend API URL and frontend connection expectations documented.
- PROD-03: Production environment variables documented, including API base URL, app env, demo shortcuts, analytics, feedback, and error monitoring flags.
- PROD-04: Production configuration disables demo shortcuts and avoids localhost APIs.
- PROD-05: Build and preview launch gate commands documented as `npm run build` and `npm run preview`.
- DATA-01: SQLite documented as local development, demo, and functional-test infrastructure only.
- DATA-02: Backend production database options and migration boundaries documented without coupling frontend code to a database implementation.
- DATA-03: Pilot API contract freeze list documented for auth, conversations, files, teacher help, parent reports, tutor workflows, feedback, and analytics.
- DATA-04: Breaking API change coordination expectations documented for frontend/backend work.

## Scope Boundaries

- Do not edit application source, routes, or components.
- Do not implement monitoring, analytics delivery, support, admin, privacy, backup, pricing, billing, or launch plan features.
- Keep Phase 47 launch content light until later Phase 9 work lands.
