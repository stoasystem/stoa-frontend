# Project Research: Architecture for v1.5 Phase 6

**Milestone:** v1.5 Phase 6 Authentication, User Roles, and Parent Visibility
**Date:** 2026-05-24

## Existing Architecture

The app is a React SPA using Vite, React Router, TanStack Query, Axios service modules, local UI components, and Zustand stores. v1.4 added a backend-integrated streaming chat workflow with file uploads and teacher-help status through unified backend API contracts.

## Recommended Phase 6 Architecture

### Frontend Auth Boundary

- `authApi` owns login, register, and current-user calls.
- `authStore` owns token, user, and local persistence.
- `httpClient` injects the token into every API request.
- 401 clears auth and navigates to `/login`; 403 navigates to `/forbidden`.
- `useCurrentUserQuery` hydrates user state when a token exists.

### Frontend Route Boundary

- Public auth routes stay outside protected groups.
- `ProtectedRoute` checks authenticated state and renders an `<Outlet />`.
- `RoleRoute` checks `user.role` against allowed roles and renders an `<Outlet />`.
- `getDefaultRouteForRole` centralizes post-login navigation.
- `AppLayout` reads current user and renders role-specific navigation.

### Server State

TanStack Query remains the source for:

- Current user.
- Student profile and learning history.
- Parent children and child summary/history.
- Tutor help-request list/detail/status updates.
- Chat conversation data scoped by backend permissions.

### Local Backend Boundary

The local backend should mirror production-facing contracts:

```text
Frontend
  -> HTTP API
Local FastAPI backend
  -> ORM / SQL
SQLite local.db
```

The frontend never reads SQLite files. The backend owns password hashing, token generation, token validation, and all data filtering.

### SQLite Tables

- `users`
- `student_profiles`
- `parent_children`
- `conversations`
- `messages`
- `uploaded_files`
- `message_attachments`
- `teacher_help_requests`
- `learning_history`

### Build Order

1. Define shared user, student, parent, tutor, dashboard, chat, and teacher-help types.
2. Add frontend auth services, token injection, store, and auth hooks.
3. Add protected and role routes plus auth/error pages.
4. Add local FastAPI + SQLite schema, routers, auth service, and seed data.
5. Add student profile/history screens and hooks.
6. Add parent visibility screens and hooks.
7. Add tutor help-request screens and hooks.
8. Update layout, README, and verification.

## Data Isolation Strategy

- Student queries filter by `student_user_id == current_user.id`.
- Parent queries first verify a `parent_children` relationship.
- Tutor queries return pending or assigned requests according to backend policy.
- Admin receives only placeholder access in this milestone.
- Frontend guards reduce accidental navigation, but backend authorization is mandatory.
