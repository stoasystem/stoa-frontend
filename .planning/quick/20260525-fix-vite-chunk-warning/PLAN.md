---
status: complete
created: 2026-05-25
type: quick
---

# Fix Vite large chunk warning

## Goal

Remove the non-blocking Vite large chunk warning from `npm run build`.

## Scope

- Keep the existing React/Vite app architecture.
- Add conservative Rollup `manualChunks` configuration for large third-party dependency groups.
- Verify production build no longer emits the 500 kB chunk warning.

## Acceptance

- `npm run build` passes.
- Build output has no Vite large chunk warning.
- `npm run lint` passes.
