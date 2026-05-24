# Project Research Summary: v1.6 Phase 7

**Date:** 2026-05-25

## Stack Additions

- Add `sonner` for operation-level toast notifications.
- Add `zod`, and optionally `react-hook-form` plus `@hookform/resolvers`, for schema-backed form validation.
- Add `react-error-boundary` or a local boundary component for app-level fallback UI.
- Add a thin analytics client and environment flags instead of committing to an analytics vendor.

## Feature Table Stakes

- Shared UI guidelines, page containers, headers, and skeleton states.
- Mobile usability for login, register, dashboard, chat, profile, parent, child summary, tutor list, and tutor detail pages.
- Toast feedback and readable errors for key operations.
- Validation for auth, profile, chat input, file upload, teacher help, and tutor status updates.
- App error boundary.
- Analytics events for login/register/chat/upload/teacher-help/parent-report/tutor actions.
- Parent weekly report page and local backend endpoint.
- Tutor filters, clearer request detail, and teacher notes.
- Demo seed data, demo shortcuts, staging env flags, README, and MVP demo flow.

## Watch Out For

- Keep frontend route/visibility polish separate from backend authorization.
- Do not use analytics payloads for sensitive message content.
- Hide demo shortcuts outside development/staging demo mode.
- Avoid broad design-system rewrites; polish the existing component system.
- Keep skeletons dimensionally close to real content to reduce layout shift.

## Requirement/Roadmap Implications

The milestone should split cleanly into:

1. UI standards and responsive foundations.
2. Loading skeletons and user feedback.
3. Validation and error boundary.
4. Analytics and usage tracking.
5. Parent report.
6. Tutor workflow polish.
7. Demo/staging documentation and verification.
