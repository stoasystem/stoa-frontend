---
status: complete
completed: 2026-05-25
type: quick
---

# Fix Vite large chunk warning

## Completed

- Added Rollup `manualChunks` groups in `vite.config.ts` for React, router/state, i18n, AWS, UI, HTTP, and remaining vendor dependencies.
- Kept application code in its own `index` chunk.

## Verification

- `npm run build`
  - No Vite large chunk warning.
  - Largest JS chunk: `index` at 279.19 kB.
  - Largest vendor chunk: `vendor-react` at 194.29 kB.
- `npm run lint`
