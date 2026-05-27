# Summary: Remove Practice Detail Repeated Goals

Date: 2026-05-27

## Changes

- Removed Daily goal and Study streak summary cards from the subject Practice Path detail page.
- Kept Daily goal and Study streak on the `/practice` subject overview page.

## Verification

- Browser check confirmed `/practice/mathematics/equations` no longer shows Daily goal or Study streak and still shows roadmap content.
- Browser check confirmed `/practice` still shows Daily goal and Study streak.
- `npm run lint`
- `npm run build`
