# Project Research: Stack for v1.5 Phase 6

**Milestone:** v1.5 Phase 6 Authentication, User Roles, and Parent Visibility
**Date:** 2026-05-24

## Summary

Phase 6 can use the current frontend stack for authentication and role-based UI: React, TypeScript, Vite, React Router, TanStack Query, Axios, and Zustand. The main frontend additions are typed auth/user services, route guards, role-aware layouts, and query hooks for student, parent, and tutor data.

The local persistence requirement belongs behind a local backend, not in the browser. A small FastAPI + SQLite service is a suitable test backend because it can expose the same HTTP contracts the production backend is expected to implement while using SQLite only as an internal local datastore.

## Recommended Stack Changes

- Keep React Router for public, protected, and role-scoped route groups using layout routes with `<Outlet />`.
- Keep TanStack Query for current-user, profile, learning-history, parent, and tutor server state.
- Keep Axios for JSON API calls and request/response interceptors.
- Refactor the existing Zustand auth store to hold `user`, `accessToken`, `isAuthenticated`, `setAuth`, `setUser`, `clearAuth`, and `hydrateFromStorage`.
- Use `localStorage` key `stoa_access_token` for MVP token persistence in this milestone.
- Add a local `backend/` FastAPI app with SQLite, SQLAlchemy or SQLModel, password hashing, JWT access tokens, seed data, and role-filtered routers.

## Local Backend Stack

- FastAPI for the local HTTP API.
- SQLite for `backend/local.db` local functional testing.
- SQLAlchemy or SQLModel for table mapping and query filtering.
- bcrypt-compatible password hashing for local test credentials.
- JWT bearer access tokens for `Authorization: Bearer ...`.
- Seed script at `python -m app.seed`.

## Integration Points

- `src/services/api/httpClient.ts`: token injection plus 401/403 handling.
- `src/services/auth/authApi.ts`: login, register, current user.
- `src/hooks/auth/*`: mutations and current-user hydration.
- `src/store/authStore.ts` or existing store path: token and user state.
- `src/app/router/*`: protected and role route guards.
- `src/services/student`, `src/services/parent`, `src/services/tutor`: role-specific API clients.
- `backend/app/*`: local test backend and SQLite schema.

## What Not To Add

- No direct browser SQLite access.
- No production SSO or full refresh-token architecture.
- No direct model-provider SDKs in the frontend.
- No complex school organization or invitation workflow.
- No live tutor chat transport.

## Sources

- FastAPI official documentation covers OAuth2 password flow, password hashing, bearer tokens, and JWT examples.
- React Router official documentation supports nested route structures and child rendering with layout routes.
- TanStack Query official documentation positions queries and mutations as the core server-state API.
