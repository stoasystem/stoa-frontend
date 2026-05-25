---
phase: 44
title: Pilot Onboarding and Support Workflow
status: in-progress
---

# Phase 44 Context

## Scope

Implement the pilot onboarding and support workflow only.

Owned implementation files:
- `src/pages/onboarding/`
- `src/components/onboarding/`
- `src/pages/support/`
- `src/components/support/`
- `src/services/support/`
- `src/hooks/support/`
- `docs/operations/support-workflow.md`

Allowed route/layout touch points:
- `src/app/router/AppRouter.tsx` for routes.
- `src/layouts/AppLayout.tsx` for support/onboarding navigation links.

Explicitly out of scope:
- Admin workflow edits.
- Pricing edits.
- Privacy edits.
- Backend endpoint implementation.

## Requirements

- ONB-01: `/onboarding` route exists for pilot onboarding.
- ONB-02: Student onboarding explains grade/subject setup and entry into Chat.
- ONB-03: Parent onboarding explains child dashboard and report visibility.
- ONB-04: Tutor onboarding explains help request list/detail/status workflow.
- SUP-01: `/support` route exists and is reachable from app navigation or user menu.
- SUP-02: Support page explains FAQ, bug feedback, teacher-help distinction, contact path, and pilot-stage expectations.
- SUP-03: Support request service and mutation hook exist for typed support submissions or a documented feedback-compatible backend path.
- SUP-04: Support workflow documentation explains triage, severity, ownership, and response expectations.

## Existing Context

- App routes are defined in `src/app/router/AppRouter.tsx`.
- Authenticated app navigation is defined in `src/layouts/AppLayout.tsx`.
- The app uses `DashboardLayout`, `PageContainer`, `PageHeader`, card primitives, and lucide icons for product pages.
- API calls use `src/services/api/httpClient.ts`.
- Mutations use TanStack Query and toast notifications.

## Decisions

- Keep `/onboarding` and `/support` public routes, but render them with the existing product layout for visual consistency.
- Add sidebar links for authenticated roles so support is reachable from app navigation.
- Implement `POST /support/requests` as the primary frontend contract.
- Document that backend environments can temporarily map the support payload into feedback-compatible storage if the support endpoint is not yet deployed.
