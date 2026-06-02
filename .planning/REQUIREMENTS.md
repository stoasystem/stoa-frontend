# Requirements: STOA Frontend v2.5

**Defined:** 2026-06-02
**Core Value:** Developers can run STOA locally and test a credible, focused Online Classroom workflow without mistaking it for a generic meeting product.

## v2.5 Requirements

### Classroom Entry And Scheduling

- [x] **OCF-01**: Online Classroom home has one primary action for scheduling live tutor help and one secondary path back to the Learning Assistant.
- [x] **OCF-02**: Online Classroom home removes duplicate explanatory sections and keeps upcoming-session information compact.
- [x] **OCF-03**: Schedule Classroom uses a simpler two-column composition: request details, time/materials, and a compact sticky session brief.
- [x] **OCF-04**: Schedule Classroom time selection stays flexible with calendar and scrollable time choices while reducing visual noise.
- [x] **OCF-05**: Schedule Classroom session type choices are compact controls, not large repeated cards.

### Focused Classroom Workspace

- [x] **OCF-06**: Lobby shows the essential before-join state with tutor, device check, learning context, and a clear back action.
- [x] **OCF-07**: Classroom room prioritizes a focused learning workspace over a generic meeting layout.
- [x] **OCF-08**: Classroom room keeps video, shared problem, whiteboard, chat, materials, notes, and participants accessible without showing every panel as equal weight.
- [x] **OCF-09**: Classroom controls are compact icon-led actions with accessible labels and no crowded text wrapping on mobile.
- [x] **OCF-10**: Classroom room avoids nested cards, oversized panels, and repeated provider-placeholder explanations.

### History, Tutor, Parent, And QA

- [x] **OCF-11**: Classroom summary remains concise and connects completed classroom work to Learning History and next learning actions.
- [x] **OCF-12**: Tutor classroom queue and room surfaces stay operational, context-first, and visually consistent with the student simplification.
- [x] **OCF-13**: Parent classroom visibility stays summary-level and avoids observer/control/recording claims.
- [x] **OCF-14**: The redesigned classroom surfaces work across desktop and mobile without overlapping text or squeezed side panels.
- [x] **OCF-15**: `npm run lint`, `npm run build`, and browser checks for classroom home, schedule, lobby, room, and summary pass.

## Future Requirements

| Requirement | Reason Deferred |
|-------------|-----------------|
| Real WebRTC/video provider integration | v2.5 is a frontend UI simplification milestone. |
| Real tutor availability, calendar sync, and matching | Requires backend/product architecture outside this UI pass. |
| Production whiteboard, screen share, recording, transcript, or billing | Not needed for focused classroom frontend testing. |
| Native translation review for redesigned classroom copy | Initial English UI polish is the priority for this pass. |

## Out of Scope

| Item | Reason |
|------|--------|
| New classroom backend APIs | The current mock/demo service boundary is sufficient for frontend testing. |
| New product modules outside Online Classroom | User feedback is specifically about the Online Classroom experience. |
| Generic video-conferencing feature expansion | STOA classroom should be a learning workspace, not a meeting clone. |
| Parent observer controls | Parent visibility remains informational only. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| OCF-01 | 225 | Complete |
| OCF-02 | 225 | Complete |
| OCF-03 | 225 | Complete |
| OCF-04 | 225 | Complete |
| OCF-05 | 225 | Complete |
| OCF-06 | 226 | Complete |
| OCF-07 | 226 | Complete |
| OCF-08 | 226 | Complete |
| OCF-09 | 226 | Complete |
| OCF-10 | 226 | Complete |
| OCF-11 | 227 | Complete |
| OCF-12 | 227 | Complete |
| OCF-13 | 227 | Complete |
| OCF-14 | 227 | Complete |
| OCF-15 | 227 | Complete |

**Coverage:**
- v2.5 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-06-02*
*Last updated: 2026-06-02 after v2.5 implementation and verification*
