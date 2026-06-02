# Phase 224 Plan: Shared States, I18n, Accessibility, E2E, and Handoff

## Scope

Close v2.4 with shared state pattern refinements, i18n updates, high-risk copy audit, targeted Playwright coverage, docs, lint, and build.

## Tasks

1. Extend shared EmptyState, ErrorState, and LoadingState for actions/contextual text.
2. Add shared ContextCard and NextStepCard where they reduce repeated local patterns.
3. Update English i18n keys and initial DE/FR/IT navigation naming where practical.
4. Add v2.4 Playwright coverage.
5. Document the v2.4 copy and UI handoff.
6. Run source scan, lint, build, and targeted E2E.

## Verification

- Targeted high-risk copy scan.
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- uploads.spec.ts student-chat.spec.ts live-classroom.spec.ts v2.4-ui-refinement.spec.ts`
