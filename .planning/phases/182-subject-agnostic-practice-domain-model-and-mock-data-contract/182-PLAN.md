# Phase 182 Plan

## Steps

1. Add subject/grade/topic/unit metadata to Practice domain types.
2. Add a `PracticeTopic` type and topic list to the overview contract.
3. Represent the current seed data as Mathematics / lower secondary / equations.
4. Preserve current lesson, hint, mistake, teacher-help, chat, and parent-summary flows.
5. Update API contract docs to show subject/topic-aware payloads.
6. Run `npm run build`.

## Verification

- TypeScript build must pass.
- No `EquationPath` or equation-only type name should exist.
- Mock data should expose the current demo as seed data, not product scope.
