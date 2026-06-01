# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.34 Phase 36: Engineering Quality, CI Reliability, and Local Workflow Hardening** - Phases 191-194 (shipped 2026-05-27)
- ✅ **v1.35 Phase 37: Student Language Preference and Learning Assistant Response Localization** - Phases 195-199 (shipped 2026-06-01)
- ✅ **v2.1 Question Bank UI Design** - Phases 200-205 (shipped 2026-06-02)
- ✅ **v2.2 Photo & File Upload UI Foundation** - Phases 206-211 (shipped 2026-06-02)
- ◆ **v2.3 Live Classroom & Video Help UI Foundation** - Phases 212-218 (planning)

## Phases

- [ ] **Phase 212: Live Classroom Domain Model, Mock Services, and Hooks Foundation** - Create the provider-neutral live classroom feature module with typed session contracts, deterministic mock data, service boundaries, query hooks, and room-state hooks.
- [ ] **Phase 213: Student Classroom Entry, Dashboard Card, and Scheduling Flow** - Add student classroom routes, Dashboard entry, classroom home, schedule form, mock success state, and v2.2 upload-material reuse.
- [ ] **Phase 214: Student Lobby, Classroom Room Shell, Controls, and Learning Workspace** - Build the student lobby and Zoom-like education room UI with video placeholders, learning workspace, side panels, materials, notes, participants, controls, responsive layout, and summary entry.
- [ ] **Phase 215: Learning Chat Teacher-Text to Video Classroom Escalation** - Extend Chat support state so teacher text help can escalate into a mock live classroom lobby with conversation/material context and clear AI-observing copy.
- [ ] **Phase 216: Tutor Classroom Queue, Lobby, Room, and Notes Flow** - Add tutor-facing queue, context review lobby, tutor room controls, note saving, recommendations, and session-ending behavior.
- [ ] **Phase 217: Parent Classroom Visibility, Session Summary, and Learning Continuity** - Add lightweight parent classroom visibility plus classroom summary content and next-step links back to Chat, Practice, and Question Bank.
- [ ] **Phase 218: Live Classroom Localization, Accessibility, Responsive QA, Docs, and E2E** - Add four-language live classroom copy, accessibility/responsive hardening, product-boundary docs, Playwright coverage, lint/build verification, and final handoff.

## Phase Details

### Phase 212: Live Classroom Domain Model, Mock Services, and Hooks Foundation

**Goal**: Developers have a clean, provider-neutral live classroom foundation that supports student, tutor, parent, and Chat escalation flows without adding real video SDK dependencies.
**Depends on**: Phase 211
**Requirements**: LCF-01, LCF-02, LCF-03, LCF-04, LCF-05, LCF-06
**Success Criteria** (what must be TRUE):
  1. `src/features/live-classroom/` exists with typed classroom contracts, mock data, services, hooks, and utilities.
  2. Mock data covers scheduled, instant, active, completed, tutor queue, participants, messages, materials, and notes.
  3. Services expose async mock boundaries for home, schedule, instant help, session lookup, join/leave/complete, tutor queue, and note saving.
  4. Hooks expose typed data and room UI state without real WebRTC, device stream, or video SDK calls.
  5. Future video-provider adapter boundaries are documented in code/docs without being implemented.
**Plans**: 212-PLAN.md
**UI hint**: no

### Phase 213: Student Classroom Entry, Dashboard Card, and Scheduling Flow

**Goal**: Students can discover live classroom support from Dashboard, open the classroom home, schedule a mock session, and attach learning material through existing upload UI.
**Depends on**: Phase 212
**Requirements**: LCS-01, LCS-02, LCS-03, LCS-04, LCS-05, LCS-06
**Success Criteria** (what must be TRUE):
  1. Student Dashboard includes an Online Classroom card with next-session or schedule/instant-help actions.
  2. `/classroom` shows upcoming sessions, instant help guidance, schedule entry, and recent sessions.
  3. `/classroom/schedule` supports subject, topic, level, language, session type, time slot, and tutor context selection.
  4. Scheduling can reuse v2.2 upload components for materials.
  5. Schedule submission shows a mock scheduled-success state with classroom home and lobby actions.
**Plans**: 213-PLAN.md
**UI hint**: yes

### Phase 214: Student Lobby, Classroom Room Shell, Controls, and Learning Workspace

**Goal**: Students can prepare in a lobby, enter a credible learning-specific classroom room, use controls and side panels, and reach a summary.
**Depends on**: Phase 213
**Requirements**: LCR-01, LCR-02, LCR-03, LCR-04, LCR-05, LCR-06, LCR-07, LCR-08, LCR-09, LCR-10, LCR-11, LCR-12, LCR-13, LCR-14, LCR-15, LCR-16
**Success Criteria** (what must be TRUE):
  1. `/classroom/sessions/:sessionId/lobby` shows session, tutor, device check, context, materials, readiness, and join/wait/unavailable states.
  2. Students can join the room from an available lobby.
  3. Room desktop layout contains top bar, video tiles, learning workspace, side panel, and bottom controls.
  4. Room mobile layout avoids a squeezed right panel and uses a narrow-screen panel pattern.
  5. Video tiles are honest mock placeholders; controls and dialogs have correct student/tutor semantics.
  6. Chat, Materials, Notes, and Participants panels work with keyboard-reachable controls.
**Plans**: 214-PLAN.md
**UI hint**: yes

### Phase 215: Learning Chat Teacher-Text to Video Classroom Escalation

**Goal**: Learning Chat can move from teacher text support into a mock video classroom while preserving context and keeping AI/tutor roles clear.
**Depends on**: Phase 214
**Requirements**: LCCHAT-01, LCCHAT-02, LCCHAT-03, LCCHAT-04, LCCHAT-05, LCCHAT-06, LCCHAT-07
**Success Criteria** (what must be TRUE):
  1. Chat support state includes teacher text and video escalation states.
  2. Chat waiting and tutor-active states use clear copy.
  3. When tutor text help is active, Chat can start a live classroom.
  4. Starting video help creates a mock instant classroom session with conversation/material context.
  5. Chat navigates to the classroom lobby with source context and avoids AI-in-classroom behavior.
**Plans**: 215-PLAN.md
**UI hint**: yes

### Phase 216: Tutor Classroom Queue, Lobby, Room, and Notes Flow

**Goal**: Tutors can see classroom work, review student context, join a room, use tutor-specific controls, and save mock notes/recommendations.
**Depends on**: Phase 215
**Requirements**: LCTUTOR-01, LCTUTOR-02, LCTUTOR-03, LCTUTOR-04, LCTUTOR-05, LCTUTOR-06
**Success Criteria** (what must be TRUE):
  1. `/tutor/classroom` shows scheduled sessions, instant requests, and completed sessions.
  2. Tutor queue cards include time, student, topic, source, waiting/status, and join/review actions.
  3. Tutor lobby shows student profile, level, language, topic, source, summary, materials, and recommended focus.
  4. Tutor room shares the classroom shell and adds tutor-specific actions.
  5. Tutor notes/recommendations save in mock state and appear in the summary.
**Plans**: 216-PLAN.md
**UI hint**: yes

### Phase 217: Parent Classroom Visibility, Session Summary, and Learning Continuity

**Goal**: Classroom activity remains visible after the session through summary and lightweight parent surfaces without adding parent management or observer features.
**Depends on**: Phase 216
**Requirements**: LCPAR-01, LCPAR-02, LCPAR-03, LCPAR-04
**Success Criteria** (what must be TRUE):
  1. Parent dashboard or parent classroom surface shows lightweight upcoming/recent classroom information.
  2. Classroom summary shows topic, tutor, materials, notes, key points, and next steps.
  3. Summary actions can return students to Chat, Practice, or Question Bank.
  4. Parent-facing copy avoids observer, recording, attendance-control, or live-monitoring claims.
**Plans**: 217-PLAN.md
**UI hint**: yes

### Phase 218: Live Classroom Localization, Accessibility, Responsive QA, Docs, and E2E

**Goal**: Live classroom UI is localized, accessible, product-safe, responsive, documented, and verified through standard frontend gates and E2E coverage.
**Depends on**: Phase 217
**Requirements**: LCQA-01, LCQA-02, LCQA-03, LCQA-04, LCQA-05, LCQA-06, LCQA-07, LCQA-08, LCQA-09, LCQA-10, LCQA-11
**Success Criteria** (what must be TRUE):
  1. English, German, French, and Italian `liveClassroom` copy covers the main classroom flows and accessibility labels.
  2. Copy avoids unsupported real-video, provider, AI teacher, recording, screen-share, and billing claims.
  3. Controls, tabs, dialogs, mobile panels, and status updates meet accessibility requirements.
  4. Responsive checks cover classroom home, schedule, lobby, room, tutor queue, and summary.
  5. Playwright tests cover dashboard card, classroom home, scheduling, lobby, room controls/panels, Chat escalation, tutor queue/room, and summary.
  6. `npm run lint` and `npm run build` pass.
**Plans**: 218-PLAN.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 212. Live Classroom Domain Model, Mock Services, and Hooks Foundation | 0/1 | Pending | — |
| 213. Student Classroom Entry, Dashboard Card, and Scheduling Flow | 0/1 | Pending | — |
| 214. Student Lobby, Classroom Room Shell, Controls, and Learning Workspace | 0/1 | Pending | — |
| 215. Learning Chat Teacher-Text to Video Classroom Escalation | 0/1 | Pending | — |
| 216. Tutor Classroom Queue, Lobby, Room, and Notes Flow | 0/1 | Pending | — |
| 217. Parent Classroom Visibility, Session Summary, and Learning Continuity | 0/1 | Pending | — |
| 218. Live Classroom Localization, Accessibility, Responsive QA, Docs, and E2E | 0/1 | Pending | — |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 212 | 6 | LCF-01, LCF-02, LCF-03, LCF-04, LCF-05, LCF-06 |
| 213 | 6 | LCS-01, LCS-02, LCS-03, LCS-04, LCS-05, LCS-06 |
| 214 | 16 | LCR-01, LCR-02, LCR-03, LCR-04, LCR-05, LCR-06, LCR-07, LCR-08, LCR-09, LCR-10, LCR-11, LCR-12, LCR-13, LCR-14, LCR-15, LCR-16 |
| 215 | 7 | LCCHAT-01, LCCHAT-02, LCCHAT-03, LCCHAT-04, LCCHAT-05, LCCHAT-06, LCCHAT-07 |
| 216 | 6 | LCTUTOR-01, LCTUTOR-02, LCTUTOR-03, LCTUTOR-04, LCTUTOR-05, LCTUTOR-06 |
| 217 | 4 | LCPAR-01, LCPAR-02, LCPAR-03, LCPAR-04 |
| 218 | 11 | LCQA-01, LCQA-02, LCQA-03, LCQA-04, LCQA-05, LCQA-06, LCQA-07, LCQA-08, LCQA-09, LCQA-10, LCQA-11 |

**Total requirements:** 56
**Mapped requirements:** 56
**Unmapped requirements:** 0

## Next Up

**Phase 212: Live Classroom Domain Model, Mock Services, and Hooks Foundation** — Create the live classroom contracts and mock service foundation before route/UI integration work.
