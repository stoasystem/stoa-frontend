---
status: complete
completed: 2026-05-25
type: quick
---

# Add public page navigation

## Completed

- Extracted reusable `MarketingHeader` and `MarketingFooter` from `MarketingLayout`.
- Added the shared marketing header to auth pages through `AuthLayout`.
- Wrapped pricing, privacy, terms, support, and onboarding pages with `MarketingLayout`.
- Removed the visible phase reference from the forgot-password page.

## Verification

- `npx tsc -b --pretty false`
- `npm run lint`
- `npm run build` passed with the existing Vite large chunk warning and Node deprecation warning.
- Playwright nav check confirmed `/pricing`, `/privacy`, `/terms`, `/support`, `/onboarding`, and `/login?next=/chat` each render one marketing nav.
- Playwright nav check confirmed existing marketing pages still render one nav, not duplicates.
