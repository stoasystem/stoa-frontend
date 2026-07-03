# Phase 230: Route, Namespace, Navigation, and CTA Journey - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Define the preview route, component/i18n namespaces, public navigation impact, and registration/login handoff.

</domain>

<decisions>
## Implementation Decisions

- Use `/home-v2` as the internal preview route.
- Use `src/pages/home-v2/` and `src/components/home-v2/` for implementation isolation.
- Use `homeV2` as the future translation namespace.
- Keep public navigation restrained and avoid turning Practice into a generic public nav island.
- Map CTA behavior without changing auth, registration, quota, or role routing logic in this milestone.

</decisions>

<code_context>
## Existing Code Insights

Routing currently lives under `src/app/router/AppRouter.tsx`, and existing public homepage code remains under `src/pages/home/` and `src/components/home/`.

</code_context>

<specifics>
## Specific Ideas

Primary CTA should prefer a registration-first learning path for logged-out users, while authenticated users route to their role-owned surfaces.

</specifics>

<deferred>
## Deferred Ideas

Actual route wiring, component scaffolding, and localization file creation remain deferred to later implementation milestones.

</deferred>
