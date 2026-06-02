# Phase 222 Plan: Online Classroom Learning Context and Summary

## Scope

Refine Online Classroom as learning support with context, materials, notes, and next steps rather than a generic video shell.

## Tasks

1. Clarify the support ladder on Classroom home.
2. Remove user-facing mock/provider/video claims.
3. Default student room to Materials and tutor room to Notes.
4. Make summary focus on what was reviewed and recommended next steps.
5. Keep classroom controls and panels accessible.

## Verification

- `npm run lint`
- `npm run build`
- `npm run test:e2e -- live-classroom.spec.ts v2.4-ui-refinement.spec.ts`
