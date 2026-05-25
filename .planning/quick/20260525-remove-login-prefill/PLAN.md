---
status: complete
created: 2026-05-25
type: quick
---

# Remove login test account prefill

## Goal

Make the public login form start blank instead of showing demo credentials.

## Scope

- Clear the default email and password state in `LoginForm`.
- Keep optional demo shortcut behavior behind the existing environment flag.

## Acceptance

- `/login?next=/chat` renders empty email and password fields by default.
- No test account credentials are prefilled.
- TypeScript, lint, and build pass.
