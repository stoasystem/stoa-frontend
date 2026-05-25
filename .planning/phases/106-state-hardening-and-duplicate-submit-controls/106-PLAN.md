---
plan_id: 106-01
phase: 106
phase_name: State Hardening and Duplicate-Submit Controls
status: planned
---

# Plan 106-01: Pending and State Hardening

## Goal

Reduce duplicate submissions and improve empty/error behavior on core flows.

## Tasks

1. Add pending guard returns in login, register, chat conversation creation, support request, support ticket, checkout, and upgrade handlers.
2. Preserve support ticket and tutor-note form input until the mutation succeeds.
3. Sanitize chat create/teacher-help errors through `toUserFacingError`.
4. Add empty states for support ticket list and billing usage.
5. Verify build.

## Verification

- `npm run build` passes.
- Key submit handlers now guard while pending.
- Forms that previously cleared before success now reset on success.
