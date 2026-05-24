# Phase 21: Authentication Contracts, Store, and Route Guards - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Auto-generated during `$gsd-autonomous`

## Phase Boundary

Establish the frontend authentication foundation and role-aware route boundary.

## Decisions

- Use `src/store/authStore.ts` as the canonical auth store path already used by the app.
- Use `localStorage` key `stoa_access_token` for Phase 6 MVP persistence.
- Keep auth API calls in `src/services/auth/authApi.ts`.
- Use React Router layout routes for protected and role-gated route groups.
- Treat frontend route guards as UX only; backend permissions remain mandatory.

## Verification Target

Build and lint must pass after adding auth contracts, hooks, guards, and auth pages.
