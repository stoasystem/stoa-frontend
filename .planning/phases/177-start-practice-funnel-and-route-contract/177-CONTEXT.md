# Phase 177: Start Practice Funnel and Route Contract - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>

## Phase Boundary

Homepage Start Practice needs a correct, centralized route contract before UI polish or testing begins.

This phase owns the route decision and login-next behavior only. It should not redesign the homepage Practice entry, add new curriculum, alter Practice internals, rebuild Learning Chat, or modify backend/database behavior.

</domain>

<decisions>

## Implementation Decisions

### the agent's Discretion

Use the roadmap, Phase 33 requirements, research summary, and existing route conventions to implement the smallest route contract that satisfies NAV33-01 through NAV33-09.

### Contract

- Unauthenticated users: `/login?next=/practice`
- Authenticated students: `/practice`
- Authenticated parents: `/parent`
- Authenticated tutors: `/tutor`
- Authenticated admins: `/admin`
- Authenticated organization roles: `/organization`

Login should honor safe student-owned `next=/practice` paths. Non-students should not be sent into student-only Practice.

</decisions>

<code_context>

## Existing Code Insights

- `src/components/home/HomePracticeEntry.tsx` currently hard-codes `/login?next=/practice`.
- `src/lib/navigation.ts` already centralizes role navigation helpers.
- `src/hooks/auth/useLoginMutation.ts` reads `next`, but students are currently routed to their default dashboard before considering `next`.
- `/practice` is student-only, so parent/tutor/admin Start Practice clicks must not fall through to role guards.

</code_context>

<specifics>

## Specific Ideas

- Add `getStartPracticePath` and `startPracticeNavigation` in `src/lib/navigation.ts`.
- Update `HomePracticeEntry` to use the shared helper and current auth state.
- Update login redirect handling so safe student-owned `next=/practice` works.
- Document registration path expectation in Phase 180 docs; Phase 177 can note it in verification.

</specifics>

<deferred>

## Deferred Ideas

- Practice Entry Card and preview component split belongs to Phase 178.
- Cross-locale mobile QA belongs to Phase 179.
- Demo docs and README handoff belong to Phase 180.

</deferred>
