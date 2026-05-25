---
status: complete
completed: 2026-05-25
type: quick
---

# Fix image text matches

## Completed

- Audited all marketing images on `/`, `/for-parents`, `/teacher-support`, and `/pricing`.
- Kept the matching visuals: library hero, laptop learning-flow panel, teacher classroom panels, and study-material desk panel.
- Replaced the parent hero image with a clear child homework/growth image.
- Replaced the homepage parent-visibility image with a family learning-together image.
- Replaced the pricing image with a family online-learning image.

## Verification

- `npx tsc -b --pretty false`
- `npm run lint`
- `npm run build` passed with the existing Vite large chunk warning and Node deprecation warning.
- Playwright image/copy checks confirmed the new parent hero alt and growth copy.
- Manual screenshot review confirmed the remaining image semantics match nearby text.
