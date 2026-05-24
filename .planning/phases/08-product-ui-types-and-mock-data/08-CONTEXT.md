# Phase 8: Product UI Types and Mock Data - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous execution)

<domain>
## Phase Boundary

Define the chat and dashboard data contracts plus mock data that will drive the Phase 3 product UI.
</domain>

<decisions>
## Implementation Decisions

- Keep mock data in `src/data/` and shared contracts in `src/types/`.
- Extend the existing `src/types/chat.ts` rather than creating a duplicate chat type module.
- Add learning progress data because Phase 3 acceptance includes dashboard progress.
</decisions>

<code_context>
## Existing Code Insights

- `src/types/chat.ts` exists from Phase 2 and currently only models a minimal conversation.
- `@/*` imports are already configured in Vite and TypeScript.
- shadcn-style local UI primitives already exist for later phases.
</code_context>

<specifics>
## Specific Ideas

- Chat mock data should include multiple subjects and grade metadata.
- Dashboard mock data should cover stats, recent questions, weak topics, progress, and teacher feedback.
</specifics>

<deferred>
## Deferred Ideas

- Real API response mapping is deferred to Phase 4 backend integration.
</deferred>
