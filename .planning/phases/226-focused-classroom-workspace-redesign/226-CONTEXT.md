# Phase 226: Focused Classroom Workspace Redesign - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Mode:** Autonomous, user delegated all decisions

<domain>
## Phase Boundary

Redesign the Online Classroom lobby and room so the user sees a focused tutoring workspace rather than a generic meeting shell.
</domain>

<decisions>
## Implementation Decisions

- Prioritize shared problem and whiteboard as the learning surface.
- Keep video visible but secondary to the learning task.
- Keep side panels available through tabs, not equal-weight cards.
- Use compact icon-led bottom controls with accessible labels.
</decisions>

<code_context>
## Existing Code Insights

- `ClassroomLobbyPage.tsx` has multiple cards and a separated status aside.
- `ClassroomRoomPage.tsx` stacks video, workspace, side panel, and bottom controls with similar weight.
- `ClassroomLearningWorkspace.tsx`, `ClassroomSidePanel.tsx`, `ClassroomControlBar.tsx`, and `ClassroomVideoTile.tsx` are the main components to reshape.
</code_context>

<specifics>
## Specific Ideas

- Compact room top bar with title/time/source.
- Main workspace uses a larger shared-problem/whiteboard surface and a narrow video rail.
- Side panel stays tabbed but denser and less card-like.
- Controls become stable square/icon-led buttons with visible labels only where helpful.
</specifics>

<deferred>
## Deferred Ideas

- Production video, provider SDK, recording, screen share, and production whiteboard.
</deferred>
