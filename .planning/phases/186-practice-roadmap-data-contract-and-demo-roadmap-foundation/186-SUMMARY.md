# Phase 186 Summary: Practice Roadmap Data Contract and Demo Roadmap Foundation

## Completed

- Added roadmap-specific Practice types for topic, roadmap, unit, lesson, and status.
- Added mock Mathematics / lower secondary / equations roadmap data.
- Added mock roadmap progression mutation when a demo lesson completes.
- Added Practice roadmap service, query key, and hook.

## Files Changed

- `src/types/practice.ts`
- `src/data/mockPractice.ts`
- `src/services/practice/practiceApi.ts`
- `src/services/practice/practiceQueryKeys.ts`
- `src/hooks/practice/usePracticeRoadmapQuery.ts`

## Notes

The roadmap contract remains separate from the existing lesson execution contract, so existing lesson/challenge flows can continue while roadmap-specific states express current, completed, available, locked, and review nodes.
