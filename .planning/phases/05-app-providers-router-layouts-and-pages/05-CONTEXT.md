# Phase 5: App Providers, Router, Layouts, and Pages - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Establish the app shell with providers, router, layouts, and placeholder routes.
</domain>

<decisions>
## Implementation Decisions

### Providers Own Global Runtime Setup
`AppProviders` should wrap app-level providers, starting with TanStack Query.

### Router Owns Page Selection
`AppRouter` should centralize route definitions for the Phase 2 placeholders.
</decisions>

<code_context>
## Existing Code Insights

- `src/App.tsx` was a minimal Phase 1 page.
- Phase 5 turns `App` into a provider and router composition point.
- Layouts are intentionally minimal and do not implement full product UI.
</code_context>

<specifics>
## Specific Ideas

- Add `src/app/query/queryClient.ts`.
- Add `src/app/providers/AppProviders.tsx`.
- Add `src/app/router/AppRouter.tsx`.
- Add base layouts and placeholder pages.
</specifics>

<deferred>
## Deferred Ideas

- Protected routes.
- Real auth redirection.
- Route-level loaders.
</deferred>
