# Phase 220 Plan: Practice Library Naming and Structure

## Scope

Refine student-facing Question Bank surfaces into Practice Library copy while keeping existing `/question-bank` routes and service boundaries stable.

## Tasks

1. Rename page titles, navigation, cards, and context labels to Practice Library.
2. Reorder Practice Library home around Continue Practice, Find Exercises, Recommended, Review & Improve, and All Subjects.
3. Make session, result, and mistakes review copy supportive.
4. Add recoverable loading/error/empty states where touched.

## Verification

- `npm run lint`
- `npm run build`
- `npm run test:e2e -- uploads.spec.ts v2.4-ui-refinement.spec.ts`
