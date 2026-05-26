# Phase 165: Practice Positioning, Research, and Site IA - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Lock Practice Path as a student learning entry and document the public, student, parent, and tutor information architecture.
</domain>

<decisions>
## Implementation Decisions

### Product Hierarchy
- Practice starts learning.
- Learning Chat explains unclear steps.
- Professional teacher support escalates after friction.
- Parent Report shows the learning process.

### Navigation
- Practice stays out of the public navbar.
- Student navigation includes Practice and Learning Chat.
- Parent navigation favors Overview, Reports, Billing, and Contact.

### the agent's Discretion
Use existing markdown documentation patterns and keep docs concise.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing route metadata in `src/app/router/routeConfig.ts`.
- Prior research note in `.planning/research/phase-31-webpage-organization-research.md`.

### Established Patterns
- Documentation lives under `docs/`.
- Planning artifacts live under `.planning/phases/`.

### Integration Points
- Route config, README, and new IA docs.
</code_context>

<specifics>
## Specific Ideas

Create `docs/ia/site-layout-with-practice-entry.md` and `docs/ia/student-learning-entry-map.md`.
</specifics>

<deferred>
## Deferred Ideas

Formal public Practice landing page remains deferred until external testing shows need.
</deferred>
