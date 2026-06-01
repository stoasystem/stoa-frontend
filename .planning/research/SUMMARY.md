# Research Summary: v2.3 Live Classroom & Video Help UI Foundation

## Research Complete

Research covered:

- Purpose-built online tutoring classrooms: Lessonspace and Dojo Tutor/Lessonspace guidance.
- Meeting safety/control patterns: Zoom waiting room, Zoom participant management, Microsoft Teams for Education safety roles, Google Meet host controls.
- Future video-provider architecture: LiveKit React components, Twilio Video JavaScript SDK, Daily prebuilt/custom split.
- Accessibility baseline: WAI-ARIA APG modal dialog pattern.

## Key Findings

### Stack Additions

No real-time video SDK should be added in v2.3. The app should add a provider-neutral `live-classroom` feature module with typed models, mock data, services, hooks, and UI components. Future provider integration should stay behind an adapter because real video platforms bring room state, participant tracks, device APIs, and backend token/session requirements.

### Feature Table Stakes

v2.3 should include:

- Student classroom home and Dashboard card.
- Schedule classroom flow with mock time slots and context/materials.
- Lobby with session details, tutor profile, device-check mock controls, context, waiting/unavailable states, and join action.
- Room UI with video placeholders, learning workspace, side panels, materials, notes, participants, chat, and bottom controls.
- Classroom summary with notes and next steps.
- Chat teacher-text-to-video escalation.
- Tutor classroom queue, tutor lobby, and tutor room.
- Four-language `liveClassroom` i18n and Playwright smoke tests.

### Differentiators

STOA should not clone a generic meeting product. The classroom should be anchored to learning context: question, conversation, uploaded material, Practice path, Question Bank item, tutor notes, and next steps. The strongest product pattern is "live tutoring workspace" rather than "video call".

### Watch Out For

- Do not claim real WebRTC, live device media, recording, screen sharing, secure video, or actual provider connectivity.
- Keep lobby/teacher controls clear; student Leave and tutor End Session are different actions.
- Keep AI role clear: once tutor text help is active, Learning Assistant is observing unless a future phase explicitly designs in-class AI support.
- Mobile room layout needs a single-column/drawer pattern, not a squeezed desktop side panel.
- Reuse v2.2 upload UI for materials.

## Sources

- Lessonspace: https://www.thelessonspace.com/
- Dojo Tutor Lessonspace overview: https://tutor-help.classdojo.com/hc/en-us/articles/42456605197837-Lessonspace-Overview-Tools-for-Tutors
- Dojo Tutor Lessonspace tools: https://tutor-help.classdojo.com/hc/en-us/articles/42456824965901-Lessonspace-Teaching-Tools
- Zoom waiting room: https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0059359
- Zoom participant management: https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0065566
- Microsoft Teams for Education meeting roles and safety: https://support.microsoft.com/en-us/teams/education/quick-start/set-up-meeting-roles-and-safety
- Google Meet host controls: https://support.google.com/meet/answer/16229038
- Google Classroom video meeting help: https://support.google.com/edu/classroom/answer/9776888
- LiveKit React components: https://docs.livekit.io/reference/components/react
- LiveKit VideoConference component: https://docs.livekit.io/reference/components/react/component/videoconference/
- Twilio Video JavaScript SDK: https://www.twilio.com/docs/video/javascript
- Daily get started: https://docs.daily.co/get-started
- WAI-ARIA APG modal dialog pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

## Requirement Direction

Requirements should be grouped around:

1. Live classroom foundation contracts.
2. Student classroom home and scheduling.
3. Lobby and room experience.
4. Chat-to-video escalation.
5. Tutor classroom flow.
6. Parent visibility, summary, and continuity.
7. i18n, accessibility, responsive behavior, docs, and QA.
