# Roadmap: STOA Frontend

## Milestones

- ✅ **v2.4 UI Copy & Web Design Refinement** - Phases 219-224 (shipped 2026-06-02)
- ✅ **v2.5 Online Classroom Focused Redesign** - Phases 225-227 (shipped 2026-06-02)

## Phases

- [x] **Phase 225: Classroom Entry and Scheduling Simplification** - Reduce Online Classroom home and schedule friction so students see one clear live-help path and a compact scheduling flow.
- [x] **Phase 226: Focused Classroom Workspace Redesign** - Rework lobby and room into a learning-first workspace where video, shared problem, whiteboard, chat, materials, and notes have clear hierarchy.
- [x] **Phase 227: Summary, Tutor, Parent, QA, and Handoff Closure** - Align summary/tutor/parent surfaces with the simplified classroom model and verify the redesigned flow.

## Phase Details

### Phase 225: Classroom Entry and Scheduling Simplification

**Goal**: Students can open Online Classroom, understand the next action, schedule a session, and review the session brief without duplicate cards or form clutter.
**Depends on**: Phase 224
**Requirements**: OCF-01, OCF-02, OCF-03, OCF-04, OCF-05
**Success Criteria**:
  1. Classroom home has one primary schedule action and one secondary Learning Assistant action.
  2. Duplicate Get Help Now / session-type overview content is removed or merged.
  3. Schedule page uses a clearer request/time/materials layout with a compact session brief.
  4. Calendar and scrollable time picker remain available but visually quieter.
  5. Session type options become compact selectable controls.
**Plans**: 225-PLAN.md
**UI hint**: yes

### Phase 226: Focused Classroom Workspace Redesign

**Goal**: The classroom lobby and room feel like a focused tutoring workspace rather than a generic meeting page.
**Depends on**: Phase 225
**Requirements**: OCF-06, OCF-07, OCF-08, OCF-09, OCF-10
**Success Criteria**:
  1. Lobby foregrounds tutor, readiness, context, and join/back actions without redundant cards.
  2. Room header is compact and keeps the learning objective visible.
  3. Room layout prioritizes shared problem/whiteboard and video while keeping side panels accessible.
  4. Bottom controls are compact, icon-led, accessible, and mobile-stable.
  5. Placeholder provider language is reduced to concise product-safe copy.
**Plans**: 226-PLAN.md
**UI hint**: yes

### Phase 227: Summary, Tutor, Parent, QA, and Handoff Closure

**Goal**: Classroom completion, tutor operations, parent visibility, and verification all align with the simplified Online Classroom experience.
**Depends on**: Phase 226
**Requirements**: OCF-11, OCF-12, OCF-13, OCF-14, OCF-15
**Success Criteria**:
  1. Summary page is concise and points to Learning History, Learning Assistant, and Dashboard.
  2. Tutor queue remains context-first while adopting the reduced visual density.
  3. Parent classroom visibility remains informational and avoids control claims.
  4. Desktop and mobile browser checks pass for home, schedule, lobby, room, and summary.
  5. `npm run lint` and `npm run build` pass.
**Plans**: 227-PLAN.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 225. Classroom Entry and Scheduling Simplification | 1/1 | Complete | 2026-06-02 |
| 226. Focused Classroom Workspace Redesign | 1/1 | Complete | 2026-06-02 |
| 227. Summary, Tutor, Parent, QA, and Handoff Closure | 1/1 | Complete | 2026-06-02 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 225 | 5 | OCF-01, OCF-02, OCF-03, OCF-04, OCF-05 |
| 226 | 5 | OCF-06, OCF-07, OCF-08, OCF-09, OCF-10 |
| 227 | 5 | OCF-11, OCF-12, OCF-13, OCF-14, OCF-15 |

**Total requirements:** 15
**Mapped requirements:** 15
**Unmapped requirements:** 0

## Next Up

No pending phase. Milestone v2.5 is complete.
