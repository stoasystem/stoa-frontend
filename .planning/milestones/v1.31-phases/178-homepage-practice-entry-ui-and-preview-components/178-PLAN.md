# Phase 178: Homepage Practice Entry UI and Preview Components - Plan

**Planned:** 2026-05-27
**Goal:** Homepage users can understand in one glance that Practice is a short learning entry that leads to hints, Learning Chat, teacher support, and parent visibility.

## Requirements

- HOME33-01 through HOME33-11

## Tasks

1. Split `HomePracticeEntry` into section composition plus `PracticeEntryCard`.
2. Add `HomePracticePreview` with equation path topics and a compact challenge preview.
3. Preserve `HomePracticeToChatFlow` as the connected learning-platform sequence.
4. Use the existing Start Practice route helper from Phase 177.
5. Keep CTA hierarchy calm and education-first.
6. Run `npm run build`.
7. Record summary and verification.

## Acceptance Criteria

- `HomePracticeEntry`, `PracticeEntryCard`, and `HomePracticePreview` exist and are wired.
- Practice entry stays after Hero.
- Preview includes one-step equations, quadratic basics, and linear systems.
- Copy and UI preserve Practice -> Learning Chat -> Professional Teacher Support -> Parent Report.
- No game-first or Duolingo-facing language is introduced.
