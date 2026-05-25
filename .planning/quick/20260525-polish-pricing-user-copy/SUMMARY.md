---
status: complete
completed: 2026-05-25
type: quick
---

# Polish pricing user copy

## Completed

- Replaced pricing header and value card copy with family-facing plan language.
- Replaced the developer-facing quota FAQ with a customer-facing plan-limit question.
- Replaced quota labels with teacher session and teacher help credit language.
- Removed pricing-page references to frontend, backend, API contracts, phase numbers, mock checkout, validation, QA, and E2E language.

## Verification

- `rg "frontend|backend|API contract|API contracts|quota|quotas|mock checkout|Phase 10|Phase 11|phase 11|E2E|QA|validation" src/components/pricing src/pages/pricing -n` returned no matches.
- `npx tsc -b --pretty false`
- `npm run lint`
- `npm run build` passed with the existing Vite large chunk warning and Node deprecation warning.
- Playwright pricing text check confirmed the old quota question is gone and the new plan-limit question is present.
