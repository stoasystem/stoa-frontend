# Project Research: Pitfalls for v1.5 Phase 6

**Milestone:** v1.5 Phase 6 Authentication, User Roles, and Parent Visibility
**Date:** 2026-05-24

## Auth Pitfalls

- **Treating route guards as security.** React route checks only protect the user experience; backend authorization must filter every protected API.
- **Hydration flicker.** A stored token may exist before `/auth/me` returns. Route guards need a predictable loading or hydration path so valid users are not incorrectly bounced.
- **Clearing auth on 403.** 403 means the user is authenticated but unauthorized. Clear auth only for 401.
- **Scattering role redirects.** Keep default role routes in one helper so login/register/layout behavior stays consistent.
- **Overbuilding token strategy.** localStorage is acceptable for this MVP milestone, but README should state production may move to httpOnly cookies or refresh-token flows.

## Role and Data Pitfalls

- **Duplicating role constants.** Define `UserRole` once and reuse it across stores, services, guards, and UI.
- **Parent data leakage.** Parent child endpoints must verify the parent-child relationship before returning summaries or history.
- **Tutor overexposure.** Tutor detail endpoints should expose only the context required for a help request.
- **Admin scope creep.** Admin is a placeholder in Phase 6; full management belongs later.
- **Chat regression.** Student chat must continue working while adding auth and data scoping.

## SQLite Backend Pitfalls

- **Letting frontend depend on SQLite.** API contracts must not mention database implementation details.
- **Saving plaintext passwords.** Even local seed users should use password hashes.
- **Skipping seed idempotency.** Seed scripts should be safe to rerun during local testing.
- **Weak permission tests.** Local backend smoke checks should verify 401, 403, student-only conversations, parent-child visibility, and tutor request access.
- **Committing runtime database files.** `backend/local.db`, uploads, and generated data must stay ignored.

## UX Pitfalls

- **Building marketing pages instead of task screens.** Phase 6 routes should open directly to login, dashboards, profile, lists, and detail views.
- **Inconsistent role navigation.** Menus should show only the current role's natural destinations.
- **Raw empty states.** Parent with no children, tutor with no requests, and history with no items need deliberate empty states.
- **Unclear failure states.** Auth errors, profile save errors, parent summary errors, and tutor status update errors should display near the affected workflow.

## Documentation Pitfalls

- **Under-documenting local backend startup.** README should explain that frontend calls the local API and that SQLite is backend-internal.
- **Missing seed credentials.** README should list the four test accounts.
- **Leaving production security ambiguous.** README should clearly mark localStorage and SQLite as Phase 6 testing choices, not final production architecture.
