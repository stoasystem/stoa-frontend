# Phase 104: Environment Guards and Demo UI Isolation - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Hide demo-only and internal surfaces by default while preserving explicit local/demo workflows.
</domain>

<decisions>
## Implementation Decisions

### Agent Discretion

Use small typed environment helpers instead of a feature-flag service. Treat Vite `VITE_*` values as public presentation configuration only. Do not delete local demo/E2E workflows; gate them behind explicit non-production flags.
</decisions>

<code_context>
## Existing Code Insights

`src/lib/env.ts` already centralizes API mode and feature flags. Login shortcuts use `enableDemoShortcuts`; navigation has a `showDemo` option; billing checkout uses `enableMockCheckout`; organization and advanced admin routes are marked demo in route metadata.
</code_context>

<specifics>
## Specific Ideas

- Add semantic visibility flags for demo accounts, badges, surfaces, internal debug, and checkout preview.
- Keep compatibility with existing local demo flags while forcing production-facing and staging-pilot modes off.
- Gate demo navigation and direct demo route access.
- Add a development-only internal debug panel.
</specifics>

<deferred>
## Deferred Ideas

Production copy rewrites and status mapping are deferred to Phase 105. Broader state hardening is deferred to Phase 106.
</deferred>
