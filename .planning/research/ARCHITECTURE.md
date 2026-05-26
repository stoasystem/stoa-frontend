# Project Research — Architecture

## Existing Integration Points

Phase 27 already created the Practice architecture:

- `src/types/practice.ts`
- `src/data/mockPractice.ts`
- `src/services/practice/practiceApi.ts`
- `src/hooks/practice/*`
- `src/components/practice/*`
- `src/pages/practice/*`
- Dashboard and parent report integration
- Practice i18n namespace

## Recommended Build Order

1. Lock equation path data shape and docs.
2. Replace broad demo lesson data with an equation-only Mathematics path.
3. Refine challenge feedback and hint copy in mock data.
4. Adjust UI copy/components only where the current flow cannot express the improved content.
5. Update parent summary data and component wording.
6. Update docs, QA checklist, README.
7. Run build and browser smoke.

## Data Flow

The current data flow is sufficient:

Practice pages -> hooks -> `practiceApi.ts` -> mock/demo fallback -> `mockPractice.ts`

No new persistence model is required. Consistency across dashboard, lessons, results, mistakes, and parent report should come from shared mock data, not page-local hard-coded content.

## UI Architecture Notes

The work should stay inside the existing STOA design language:

- calm path structure
- restrained progress
- clear feedback panels
- stable buttons
- no loud reward animations
- no game shop/gems/hearts

The demo path should make the first screen visibly about equations, so the Practice overview and subject path should not imply broad Physics practice for this milestone.

## Learning Assistant Boundary

Practice should not call model providers directly. The frontend can show a practice-context explanation panel or route through existing service boundaries, but the behavior rules remain:

- hint first
- no direct final answer first
- age-appropriate next-step explanation
- teacher support after repeated confusion
