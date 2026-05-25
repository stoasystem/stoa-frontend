# Phase 88: Onboarding Contracts and Demo Backend Support - Context

**Gathered:** 2026-05-25
**Status:** Complete
**Mode:** Autonomous

## Phase Boundary

Extend frontend contracts and demo backend support for role-specific onboarding and tutor credential upload. Keep all behavior demo-only and replaceable.

## Decisions

- Add `src/types/onboarding.ts`.
- Keep API calls in service/hook modules.
- Avoid adding `python-multipart`; use a lightweight demo multipart parser in the FastAPI demo backend.
- Preserve fixed demo accounts after reset.
