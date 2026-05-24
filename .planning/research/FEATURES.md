# Project Research: Features for v1.5 Phase 6

**Milestone:** v1.5 Phase 6 Authentication, User Roles, and Parent Visibility
**Date:** 2026-05-24

## Table Stakes

### Authentication

- User can register with name, email, password, and role.
- User can log in with email and password.
- Frontend stores the access token for local session persistence.
- Frontend loads the current user from `/auth/me`.
- User can log out and clear local auth state.
- Login/register failures are visible.
- 401 clears auth and redirects to `/login`.
- 403 redirects to `/forbidden` without clearing auth.

### Role Routing

- Public routes include `/login`, `/register`, and placeholder `/forgot-password`.
- Protected routes redirect unauthenticated users to `/login`.
- Role routes redirect mismatched roles to `/forbidden`.
- Login success redirects by role: student to `/dashboard`, parent to `/parent`, tutor to `/tutor`, admin to `/admin`.
- Layout navigation changes by role.

### Student Experience

- Student can access `/dashboard`, `/chat`, `/profile`, and `/learning-history`.
- Student can view and update grade, school system, and primary subjects.
- Student can view personal learning-history items.
- Student chat/conversation APIs remain scoped to the current student.

### Parent Experience

- Parent can access `/parent`.
- Parent can view bound children.
- Parent can open child summary.
- Parent can view stats, weak topics, recent questions, teacher-help records, and learning-history summaries.
- Parent cannot directly participate in child chat.

### Tutor Experience

- Tutor can access `/tutor`.
- Tutor can view pending, assigned, in-progress, and resolved help requests.
- Tutor can open a request detail view with necessary student question context.
- Tutor can update request status.

### Admin Experience

- Admin can access `/admin`.
- Admin receives a placeholder only in this milestone.

### Local SQLite Test Backend

- Local backend can create `local.db`.
- Seed data creates student, parent, tutor, and admin accounts.
- SQLite stores users, student profiles, parent-child relationships, conversations, messages, uploaded file metadata, message attachments, teacher help requests, and learning history.
- Backend filters data by token user and role.
- Frontend calls only HTTP APIs.

## Differentiators For Later

- Production-grade refresh-token and httpOnly cookie strategy.
- Email verification and password reset.
- Parent invitation and child-binding workflow.
- Full admin user/tutor/content management.
- Real-time tutor chat.
- Audit logs and compliance documentation.
- Rich analytics and parent report exports.

## Acceptance-Oriented Feature Groups

- Auth contract, token handling, and auth store.
- Protected and role-based routing.
- Role-aware layout and user menu.
- Student profile and learning history.
- Parent dashboard and child visibility.
- Tutor help-request workflow.
- Local SQLite backend, schema, seed data, and permission filtering.
- Documentation and build verification.
