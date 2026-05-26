# Project Research — Stack

## Scope

Phase 28 is frontend design/content polishing for the existing Practice Path. It should not add new framework, database, backend, or AI-provider dependencies.

## Stack Decision

No stack additions are needed.

Use the existing stack:

- React + TypeScript + Vite for pages and UI.
- TanStack Query hooks already added in Phase 27.
- Existing mock/demo service boundary in `src/services/practice/practiceApi.ts`.
- Existing i18n namespace pattern for English, German, French, and Italian.
- Existing Playwright/local browser smoke style for demo verification.

## Implementation Implication

Phase 28 should modify:

- `src/data/mockPractice.ts`
- Practice components/pages if copy, result layout, or hint panels need refinement
- Parent practice summary component/copy
- `docs/practice/*`
- README

It should avoid:

- new package dependencies
- database work
- demo backend expansion unless a thin static mock data mirror already exists
- production API or AI provider integration

## Research Notes

External research supports the existing frontend-only approach. The content scope is curriculum/demo quality, not infrastructure. Common Core Grade 8 emphasizes solving linear equations and systems of linear equations; High School Algebra includes quadratic equation methods including factoring, but Phase 28 should use only the simplest factoring/zero-product slice for a lower-secondary demo.

Sources:

- Common Core Grade 8 introduction: https://www.thecorestandards.org/Math/Content/8/introduction/
- Common Core Grade 8 Expressions & Equations: https://www.thecorestandards.org/Math/Content/8/EE/
- Common Core High School Algebra Reasoning with Equations & Inequalities: https://www.thecorestandards.org/Math/Content/HSA/REI/
