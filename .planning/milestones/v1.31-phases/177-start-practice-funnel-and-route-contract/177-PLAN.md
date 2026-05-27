# Phase 177: Start Practice Funnel and Route Contract - Plan

**Planned:** 2026-05-27
**Goal:** Homepage Start Practice has a correct, centralized route contract before UI polish or testing begins.

## Requirements

- NAV33-01 through NAV33-09

## Tasks

1. Add a shared Start Practice route helper in `src/lib/navigation.ts`.
2. Update `HomePracticeEntry` to derive the Start Practice destination from auth state instead of hard-coding login.
3. Update `useLoginMutation` so safe role-owned `next` paths are honored, including student `/practice`.
4. Verify TypeScript build coverage for the changed route helpers.
5. Record phase summary and verification.

## Acceptance Criteria

- Public Start Practice still points to `/login?next=/practice`.
- Authenticated student Start Practice points to `/practice`.
- Authenticated parent/tutor/admin Start Practice points to role home pages.
- Student login from `/login?next=/practice` can land on `/practice`.
- Route rules are centralized and reusable.

## Risks

- Existing auth flow also uses `location.state.from`; the new helper must keep safe fallback behavior.
- Non-student users must not be routed into `/practice`.
