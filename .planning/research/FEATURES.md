# Research: v2.3 Live Classroom Features

## Scope

Research question: how do live classroom and video help experiences typically work, and which features should v2.3 include or defer?

## Source Signals

- Lessonspace positions itself as an online tutoring classroom with video, chat, whiteboards, documents, shared notes, multi-tab teaching spaces, and subject-specific teaching tools. Sources: https://www.thelessonspace.com/ and https://tutor-help.classdojo.com/hc/en-us/articles/42456605197837-Lessonspace-Overview-Tools-for-Tutors
- Dojo Tutor's Lessonspace guides route tutors from dashboard into class and expose whiteboard, document upload, and teaching tools. Source: https://tutor-help.classdojo.com/hc/en-us/articles/42456824965901-Lessonspace-Teaching-Tools
- Zoom, Microsoft Teams for Education, and Google Meet emphasize waiting/lobby control, host/teacher permissions, participant management, chat moderation, mute/video locks, and ending sessions for everyone. Sources: https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0059359, https://support.microsoft.com/en-us/teams/education/quick-start/set-up-meeting-roles-and-safety, https://support.google.com/meet/answer/16229038
- Google Classroom/Meet integration keeps video meetings attached to class context and host controls. Source: https://support.google.com/edu/classroom/answer/9776888

## Table Stakes for v2.3

| Category | Required in v2.3 | Notes |
|----------|------------------|-------|
| Classroom entry | Student classroom home, Dashboard card, schedule entry, instant-help path | Students need clear ways to reach scheduled and escalation-based support. |
| Lobby | Session summary, tutor identity, device check, materials/context preview, join/wait states | Lobby is both preparation and safety/status surface. |
| Room layout | Video tiles, learning workspace, side panel, bottom controls | Generic video grid is not enough for STOA. |
| Learning workspace | Shared problem, material preview, whiteboard placeholder, tutor notes | This is the key education-specific differentiator. |
| Side panels | Chat, materials, notes, participants | Mirrors common meeting affordances while staying learning-focused. |
| Tutor flow | Queue, instant requests, scheduled sessions, context review, room entry | Student-only UI would be incomplete for demo. |
| Chat escalation | Teacher text active state can start video classroom | Preserves existing support ladder. |
| Summary | Session notes and next steps after class | Important for parent/student continuity. |
| State handling | Loading, ready, unavailable, waiting, error, completed | Needed for credible demo and future backend fit. |

## Differentiators for STOA

- Live classroom should be anchored to a student question, Learning Chat conversation, uploaded material, or Practice/Question Bank context.
- AI should not become the in-class teacher. Once a tutor is active, the Learning Assistant should be described as observing unless explicitly used for summarization later.
- Materials should reuse v2.2 upload UI to avoid duplicate file cards and validation.
- The classroom should produce next-step learning actions rather than end as a generic call.

## Anti-Features for v2.3

- Real video connectivity claims.
- Generic Zoom clone without learning workspace.
- Broad group classroom management.
- Admin operations dashboard.
- Real calendar availability.
- Real billing or session-minute deduction.
- Real whiteboard drawing engine.
- Recording, transcript, or AI-generated summary claims.

## Feature Research Conclusion

v2.3 should deliver a complete mock student/tutor classroom journey: Dashboard or Chat entry -> schedule/instant request -> lobby -> room -> summary. The room should borrow familiar meeting controls, but the center of gravity must be tutoring context: shared problem, materials, notes, next steps, and teacher context.
