# Phase 219 Plan: Student Dashboard Learning Hierarchy and CTA Taxonomy

## Scope

Reorganize the student dashboard around the v2.4 learning chain: Continue Learning, Need Help, Today's Practice, Live Support, and Recent Activity.

## Tasks

1. Make Continue Learning the dominant dashboard section.
2. Split help actions into Learning Assistant and Upload a Question.
3. Rename student-facing Question Bank entry points to Practice Library.
4. Keep mobile order focused on Continue Learning before secondary sections.
5. Align dashboard CTAs with the approved v2.4 vocabulary.

## Verification

- `npm run lint`
- `npm run build`
- `npm run test:e2e -- v2.4-ui-refinement.spec.ts`
