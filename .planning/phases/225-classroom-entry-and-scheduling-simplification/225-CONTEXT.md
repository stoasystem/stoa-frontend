# Phase 225: Classroom Entry and Scheduling Simplification - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Mode:** Autonomous, user delegated all decisions

<domain>
## Phase Boundary

Simplify the student Online Classroom home and scheduling flow. The classroom should feel like a focused learning-support path, not another broad dashboard.
</domain>

<decisions>
## Implementation Decisions

- Skip external research; user feedback and current code are sufficient.
- Use a restrained editorial/minimal direction aligned with STOA burgundy, warm surfaces, and square/compact controls.
- Keep current mock service boundaries and routes.
- Preserve flexible date/time selection but reduce form visual weight.
</decisions>

<code_context>
## Existing Code Insights

- `StudentClassroomHomePage.tsx` has duplicate no-upcoming and Get Help Now sections.
- `ScheduleClassroomPage.tsx` uses many large segmented controls plus a large session preview.
- Calendar/time picker exists and should be retained, with cleaner hierarchy.
</code_context>

<specifics>
## Specific Ideas

- One home action group: Schedule a Session as primary, Ask Learning Assistant as secondary.
- Compact session type selector.
- Sticky session brief with key rows and final CTA.
- Keep materials upload in the scheduling flow but visually subordinate it to request/time.
</specifics>

<deferred>
## Deferred Ideas

- Real availability, tutor matching, and production scheduling.
</deferred>
