# Phase 6: Services, State, Types, Hooks, and Common Components - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Add reusable API, state, type, hook, and common component foundations for future product work.
</domain>

<decisions>
## Implementation Decisions

### New Phase 2 Structure Uses `src/store`
The Phase 2 brief uses `src/store`, while earlier scaffold files under `src/stores` remain historical and unused.

### API Client Is Structural Only
The Axios client includes base URL and bearer token handling, but does not connect to real STOA backend business contracts yet.
</decisions>

<code_context>
## Existing Code Insights

- `src/lib/constants.ts` provides shared constants.
- `@/*` alias is available from Phase 4.
- Layouts can consume common components after this phase.
</code_context>

<specifics>
## Specific Ideas

- Add `.env.example`.
- Add API client, types, and chat API placeholder.
- Add auth and UI Zustand stores.
- Add shared user/chat/API types.
- Add auth hooks and common components.
</specifics>

<deferred>
## Deferred Ideas

- Real API contract.
- Real auth/session hydration.
- Real chat mutation hooks.
</deferred>
