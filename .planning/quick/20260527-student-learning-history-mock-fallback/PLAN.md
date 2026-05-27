---
status: in_progress
created: 2026-05-27
---

# Fix Student Learning History Mock Fallback

## Goal

Make the student Learning History page usable in local mock/demo mode instead of showing `Failed to load history.` when no backend is available.

## Scope

- Add demo fallback data for `/students/me/learning-history`.
- Keep the page component unchanged unless the service layer is insufficient.
- Verify with `npm run build` and browser smoke test on `/learning-history`.
