# Live Classroom UI Foundation

Phase v2.3 adds a frontend-only Online Classroom foundation for scheduled live help and teacher-text-to-video escalation.

## Routes

- `/classroom` - student classroom home with upcoming session, recent sessions, and entry actions.
- `/classroom/schedule` - student scheduling flow with subject, topic, level, language, session type, time slot, context, and learning-material attachments.
- `/classroom/sessions/:sessionId/lobby` - student lobby with tutor context, device check, materials, and join action.
- `/classroom/sessions/:sessionId/room` - mock classroom room with participant video tiles, shared learning workspace, side panel, and controls.
- `/classroom/sessions/:sessionId/summary` - student session summary with tutor notes, next steps, and materials.
- `/tutor/classroom` - tutor queue for scheduled sessions, instant video requests, and completed sessions.
- `/tutor/classroom/sessions/:sessionId/lobby` - tutor lobby review.
- `/tutor/classroom/sessions/:sessionId/room` - tutor room view with notes-oriented controls.
- `/tutor/classroom/sessions/:sessionId/summary` - tutor summary review.

## Scope

Implemented:

- Shared live-classroom domain model, mock data, services, query keys, hooks, and formatting utilities.
- Student dashboard entry card and full classroom route flow.
- Schedule form with existing upload/photo capture components for pre-session materials.
- Lobby device check with local camera/microphone state.
- Mock room shell with video tiles, learning workspace, chat/materials/notes side panel, whiteboard toggle, and leave flow.
- Learning Chat escalation from teacher text help to a video classroom lobby.
- Tutor queue, tutor lobby, tutor room, and tutor summary paths.
- Parent dashboard visibility card for upcoming and recent classroom sessions.
- Four-locale `liveClassroom` namespace registration for future localized copy wiring.
- E2E smoke coverage for student, tutor, parent, and chat-escalation flows.

Out of scope:

- Production WebRTC/video provider integration.
- Recording, transcription, attendance, billing, and calendar sync.
- Parent observer mode or private classroom chat access.
- Persistent backend storage for classroom sessions, notes, or uploaded materials.
- Tutor matching, staffing, notifications, and service-level workflows.

## Provider Boundary

The classroom feature deliberately exposes a UI/service contract before choosing or integrating a real video provider.

Future provider integration should map these mock concepts to the provider SDK:

- `LiveClassroomSession.id` to provider room/session ID.
- `participants` to remote/local participant state.
- `lobbyState` and `status` to room lifecycle state.
- `deviceState` to local media permissions and track state.
- `materials` to STOA-owned learning context, not provider storage.
- `notes` to STOA tutor notes and learning continuity, not video chat metadata.

The real provider should be wrapped behind feature services/hooks rather than called directly from pages.

## Learning Rules

- The classroom is a continuation of the student's learning context, not a separate entertainment/video product.
- A tutor sees subject, topic, student context, uploaded materials, and prior Learning Chat context before joining.
- The room UI prioritizes explanation, materials, notes, and next steps over social call controls.
- Parent visibility stays summary-level. Parents can see that live support happened, but not private chat-level detail.
- AI and tutor support remain connected: video escalation starts after teacher text help, and summaries point back to Learning Chat or Practice.

## Accessibility And Responsive Notes

- Main actions use semantic buttons or links.
- Room controls expose explicit labels for mute, camera, whiteboard, chat, materials, notes, and leave.
- Lobby uses button-based device checks so keyboard users can toggle local state.
- Layouts collapse from multi-column desktop views into stacked mobile sections.
- E2E tests cover keyboard-visible route flows and accessible button/link names.

## Verification

Run:

```bash
npm run lint
npm run build
npm run test:e2e -- live-classroom.spec.ts
```

Manual QA should additionally inspect:

- `/classroom` on mobile and desktop.
- `/classroom/schedule` after attaching an image or PDF.
- `/classroom/sessions/classroom-linear-equations/lobby`.
- `/classroom/sessions/classroom-linear-equations/room`.
- `/tutor/classroom`.
- `/parent`.
- Learning Chat teacher escalation into a classroom lobby.
