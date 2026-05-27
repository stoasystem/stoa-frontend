---
status: passed
phase: 177
verified: 2026-05-27
---

# Phase 177 Verification

## Goal

Homepage Start Practice has a correct, centralized route contract before UI polish or testing begins.

## Results

| Check | Result | Evidence |
|-------|--------|----------|
| Shared route helper exists | Passed | `src/lib/navigation.ts` exports `getStartPracticePath` and `startPracticeNavigation`. |
| Public Start Practice route | Passed | Null user returns `/login?next=/practice`. |
| Student Start Practice route | Passed | Student user returns `/practice`. |
| Non-student role routing | Passed | Parent/tutor/admin/organization roles return role home paths. |
| Student login next path | Passed | `useLoginMutation` allows safe student paths including `/practice`. |
| Non-student Practice guard | Passed | `useLoginMutation` only accepts `next` paths owned by the signed-in role. |
| Build | Passed | `npm run build` completed successfully. |

## Human Verification

None required for this phase.
