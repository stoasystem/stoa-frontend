---
status: complete
date: 2026-05-25
task: polish-title-typography
---

# Summary

Public-facing STOA headings now use a restrained editorial title style instead of generic bold sans-serif headings.

## Changed

- Added `editorial-heading`, `editorial-title-shell`, and `editorial-accent` utilities to `src/styles/premium-theme.css`.
- Applied serif title styling and accent treatment to homepage, parent page, auth pages, and marketing/public page headers.
- Extended `PageHeader` with optional class overrides so public pages can use premium title styling while dashboards remain utilitarian.

## Verification

- `npx tsc -b --pretty false`
- `npm run lint`
- `npm run build`
- Playwright computed-style check for `/`, `/for-parents`, `/pricing`, `/teacher-support`, `/login?next=/chat`, and `/register`.
