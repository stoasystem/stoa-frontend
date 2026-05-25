---
phase: 45
title: Basic Admin Operations
status: complete
---

# Context

Phase 45 implements ADMIN-01 through ADMIN-05 for a minimal pilot operations surface.

The scope is intentionally narrow:

- `/admin` communicates pilot operations status and environment/version basics.
- `/admin/usage` exposes the frontend boundary for pilot usage summary.
- `/admin/feedback` exposes the frontend boundary for pilot feedback triage.
- Admin service and query hooks define backend contracts for usage summary and feedback list.
- Full user management, role changes, account status controls, support cases, and content administration remain deferred.

Owned code paths for this phase:

- `src/pages/admin/`
- `src/components/admin/`
- `src/services/admin/`
- `src/hooks/admin/`
- `src/app/router/AppRouter.tsx` for admin route additions only.
