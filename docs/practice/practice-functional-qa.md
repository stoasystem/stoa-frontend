# Practice Functional QA

Use this checklist for Phase 28 frontend/demo verification.

## Student Practice Flow

- [ ] Student can open `/practice`.
- [ ] Student can see the Mathematics equation demo path.
- [ ] Student can open `/practice/math`.
- [ ] Student can open `One-step equations`.
- [ ] Student can complete a linear equation lesson.
- [ ] Student can complete a quadratic equation lesson.
- [ ] Student can complete a linear-system lesson.
- [ ] Student can answer a multiple-choice challenge.
- [ ] Correct answer shows restrained success feedback.
- [ ] Incorrect answer shows "Not quite" feedback and offers a hint.
- [ ] Student can request a hint without receiving the full answer first.
- [ ] Student can retry after a hint.
- [ ] Student can complete the demo lesson.
- [ ] Result page shows correct count, time, progress points, study streak, and next actions.
- [ ] Student can open `/practice/mistakes`.

## Learning Assistant And Teacher Support

- [ ] Incorrect answer provides `Show hint`.
- [ ] `Explain this step` opens a practice-context explanation surface.
- [ ] First hint does not expose the full answer.
- [ ] `Ask a teacher` is available after repeated confusion.

## Dashboard And Parent Surfaces

- [ ] Student dashboard shows Continue Practice.
- [ ] Student dashboard shows daily goal, study streak, progress points, and recent mistake context.
- [ ] Parent child report shows current demo topic as Mathematics / Equations without implying Practice is equation-only.
- [ ] Parent child report shows lessons completed this week.
- [ ] Parent child report shows topics practiced, mistakes reviewed, practice streak, and recommended next topic.
- [ ] Parent wording stays supportive and avoids anxiety language.

## Localization And Build

- [ ] English Practice P0 labels render.
- [ ] German Practice P0 labels render with concise controls.
- [ ] French Practice P0 labels render.
- [ ] Italian Practice P0 labels render.
- [ ] `npm run build` passes.

## Recorded Phase 28 Result

Last verified: 2026-05-26

- `npm run build`: passed.
- Student equation smoke: passed in isolated mock mode.
- Parent smoke: passed in isolated mock mode.

Verification command shape:

```bash
VITE_API_MODE=mock VITE_API_BASE_URL=http://127.0.0.1:59999 npm run dev -- --host 127.0.0.1
npm run build
```
