# Phase 12 Workspace Navigation

Workspace navigation is available from admin and organization demo accounts.

Routes:

- `/organization`
- `/organization/students`
- `/organization/tutors`
- `/organization/reports`
- `/organization/analytics`
- `/organization/tutor-assignment`
- `/organization/students/:studentId/learning-profile`

The current implementation uses mock organizations and a local selector. It is intentionally not a production tenant switcher. The frontend may display the selected workspace and fetch mock/API contract data for that ID, but final permissions remain a future backend responsibility.
