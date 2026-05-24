# Project Research Summary: v1.5 Phase 6

**Date:** 2026-05-24

## Stack Additions

- No new core frontend framework is required.
- Keep React Router for public, protected, and role-scoped route groups.
- Keep TanStack Query for current-user, student, parent, tutor, and chat server state.
- Keep Axios for JSON API calls, token injection, and 401/403 handling.
- Refactor the existing Zustand auth store for user, token, persistence, and auth clearing.
- Add a local FastAPI + SQLite backend for local functional testing behind the same HTTP API contracts the frontend will use later.

## Feature Table Stakes

- Login, register, logout, current-user hydration, and visible auth failures.
- Access token persistence in `localStorage` key `stoa_access_token` for this MVP milestone.
- Student, Parent, Tutor, and Admin role types.
- Protected routes for logged-in users and role routes for role-specific pages.
- Role-based post-login redirect and role-aware layout navigation.
- Student profile editing and learning-history display.
- Parent child list, child summary, recent questions, weak topics, teacher-help records, and child learning-history summaries.
- Tutor help-request list, detail context, and status updates.
- Admin placeholder route.
- SQLite tables and seed data for users, roles, profiles, relationships, conversations, messages, uploaded file metadata, teacher help requests, and learning history.

## Watch Out For

- Frontend route guards are not security boundaries; backend APIs must enforce user and role filtering.
- 401 and 403 need different behavior: clear auth for 401, keep auth and redirect for 403.
- Hydrating from a stored token needs a predictable current-user loading path.
- Parent and tutor endpoints are the highest data-leakage risk and need explicit backend filtering.
- SQLite and localStorage are local/MVP choices, not final production security architecture.
- The existing streaming chat workflow must keep working while auth and student data scoping are added.

## Requirement/Roadmap Implications

The milestone should be split by implementation dependencies:

1. Auth, role, and shared data contracts.
2. Frontend auth services, store, token handling, route guards, and auth pages.
3. Local FastAPI + SQLite backend schema, seed data, auth endpoints, and permission filtering.
4. Student profile, learning history, and chat scoping.
5. Parent dashboard and child visibility.
6. Tutor help-request workflow.
7. Role-aware layout, documentation, and final verification.
