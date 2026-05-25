---
phase: 43
name: analytics-backend-delivery
status: complete
---

# Phase 43 Context

## Goal

Replace development-only analytics behavior with stable backend event delivery suitable for pilot usage review.

## Requirements

- ANLY-01: Analytics client sends enabled events to `POST /analytics/events`.
- ANLY-02: Analytics client no-ops or logs only in disabled/development modes according to environment flags.
- ANLY-03: Analytics failures do not block chat, upload, report, tutor, feedback, support, or navigation flows.
- ANLY-04: Pilot analytics event list is documented.
- ANLY-05: Analytics payload policy excludes full chat content and file contents.

## Scope

Owned files were limited to `src/services/analytics/`, `docs/operations/analytics.md`, and `.planning/phases/43-analytics-backend-delivery/`. `backend/app/main.py` already had a compatible `POST /analytics/events` implementation, so no backend adjustment was required.

## Constraints

Do not edit onboarding, support, admin, or monitoring pages. Do not commit.
