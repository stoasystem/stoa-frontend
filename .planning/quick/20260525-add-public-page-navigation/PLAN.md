---
status: complete
created: 2026-05-25
type: quick
---

# Add public page navigation

## Goal

Ensure public-facing subpages have consistent STOA navigation instead of isolated content screens.

## Scope

- Extract reusable marketing header/footer from `MarketingLayout`.
- Add the marketing header to auth pages through `AuthLayout`.
- Wrap public content pages that were missing navigation with `MarketingLayout`.
- Remove a visible phase reference from the forgot-password page.

## Acceptance

- `/pricing`, `/privacy`, `/terms`, `/support`, `/onboarding`, and `/login?next=/chat` show the STOA marketing nav.
- Public pages do not show duplicate nav bars.
- TypeScript, lint, build, and Playwright nav checks pass.
