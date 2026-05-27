# Phase 178: Homepage Practice Entry UI and Preview Components - Summary

**Completed:** 2026-05-27
**Status:** Complete

## Delivered

- Split homepage Practice entry into `HomePracticeEntry`, `PracticeEntryCard`, and `HomePracticePreview`.
- Added a concrete equation challenge preview with progress, hint, path topics, and connected outcomes.
- Kept the existing Practice -> Hint -> Learning Chat -> Teacher Support -> Parent Report flow visible under the preview.
- Updated Practice entry copy to use `Practice Game` / `Start Practice` and clarify the short-challenge-to-Learning-Chat relationship.
- Preserved STOA-safe positioning without Duolingo-facing, game-first, reward-economy, or mascot language.

## Verification

- `npm run build`: passed.

## Notes

- Four-language copy was added with the component work so the UI can render across supported locales; Phase 179 owns viewport and accessibility QA.
