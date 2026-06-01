# Research: v2.3 Live Classroom Architecture

## Scope

Research question: how should live classroom UI integrate with the existing STOA frontend architecture?

## Existing Integration Points

- Routing: current app already protects student, parent, tutor, and admin role routes.
- Chat: Learning Chat already has teacher-help behavior and attachment-aware message flow.
- Uploads: v2.2 added reusable upload attachments, inline panels, preview cards, and handoff metadata.
- i18n: four-language namespace registration exists.
- Services/hooks: existing feature modules use typed services and TanStack Query hooks for mock/demo data.
- E2E: Playwright route and interaction tests already cover major flows.

## Proposed Feature Module

```text
src/features/live-classroom/
  components/
  data/
  hooks/
  pages/
  services/
  types/
  utils/
```

## Data Flow

1. Student Dashboard calls `useStudentClassroomHome`.
2. `/classroom` uses the same student home service to render upcoming, instant help, schedule, and recent sessions.
3. `/classroom/schedule` calls `scheduleClassroomSession`, returning a mock scheduled session.
4. Lobby and room pages call `useClassroomSession(sessionId)`.
5. `useClassroomRoomState` owns local UI controls: active side panel, microphone/camera mock state, whiteboard visibility, leave dialog, and mobile panel.
6. Chat escalation calls `requestInstantVideoHelp` with conversation/context/material metadata, then navigates to lobby.
7. Tutor queue calls `useTutorClassroomQueue`, then tutor lobby/room pages share session components with role-specific actions.

## Route Architecture

Student:

```text
/classroom
/classroom/schedule
/classroom/sessions/:sessionId/lobby
/classroom/sessions/:sessionId/room
/classroom/sessions/:sessionId/summary
```

Tutor:

```text
/tutor/classroom
/tutor/classroom/sessions/:sessionId/lobby
/tutor/classroom/sessions/:sessionId/room
/tutor/classroom/sessions/:sessionId/summary
```

Parent, if included in v2.3, should stay lightweight:

```text
/parent/classroom
```

or only a Parent Dashboard card if route scope grows too large.

## Component Architecture

Prefer a small set of shared classroom shell components that accept role-specific props:

- `ClassroomRoomShell`
- `ClassroomTopBar`
- `ClassroomVideoGrid`
- `ClassroomLearningWorkspace`
- `ClassroomSidePanel`
- `ClassroomControlBar`
- `ClassroomLeaveDialog`
- `SessionContextPanel`
- `ClassroomSummaryPanel`

Student and tutor pages should compose these rather than duplicating layouts.

## Future Provider Boundary

The real media provider should be isolated behind a future adapter. Research from Twilio and LiveKit indicates real integrations need room/session state and, in Twilio's case, backend access token creation. Sources: https://www.twilio.com/docs/video/javascript and https://docs.livekit.io/reference/components/react

v2.3 should therefore model:

- session ID
- participant list
- participant media status
- local device toggles
- connection status

but not call `getUserMedia`, SDK room joins, or provider APIs.

## Build Order

1. Types, mock data, services, hooks.
2. Routes and page placeholders.
3. Student classroom home and dashboard card.
4. Schedule form.
5. Student lobby.
6. Room shell, control bar, and side panels.
7. Summary page.
8. Chat escalation.
9. Tutor queue/lobby/room.
10. Parent lightweight visibility if still in scope.
11. i18n, docs, E2E, lint/build.

## Architecture Conclusion

The safest architecture is a self-contained `live-classroom` feature module that integrates with Chat, Dashboard, Tutor, Parent, i18n, and Uploads through explicit typed seams. The room UI should be provider-neutral and mock-driven in v2.3.
