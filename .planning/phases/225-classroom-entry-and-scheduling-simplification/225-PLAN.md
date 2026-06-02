# Phase 225 Plan: Classroom Entry and Scheduling Simplification

## Goal

Students can open Online Classroom, understand the next action, schedule a session, and review the session brief without duplicate cards or form clutter.

## Tasks

- [ ] Simplify `StudentClassroomHomePage.tsx` into one focused action surface.
- [ ] Refactor `ScheduleClassroomPage.tsx` layout into request/time/materials plus compact brief.
- [ ] Convert session type cards into compact selectable controls.
- [ ] Keep calendar/time picker flexible but reduce visual noise.
- [ ] Verify lint/build and browser classroom home/schedule render.

## Success Criteria

- OCF-01 through OCF-05 are satisfied.
- No duplicate Get Help Now/session-type explanation remains on classroom home.
- Schedule form remains keyboard-accessible and responsive.
