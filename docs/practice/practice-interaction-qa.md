# Practice Interaction QA

## Practice Interaction

- [x] Lesson start page is clear.
- [x] Challenge submit flow is stable.
- [x] Correct feedback is clear.
- [x] Incorrect feedback is supportive.
- [x] Hint does not reveal the final answer first.
- [x] Retry flow is available.
- [x] Lesson result is clear.
- [x] Mistakes review is available.

## Practice to Chat

- [x] `Explain this step` opens Learning Chat.
- [x] Chat receives challenge context through route state.
- [x] Chat displays a practice context card.
- [x] Chat offers `Back to lesson`.
- [x] Learning Chat copy avoids `AI help`.

## Practice to Teacher

- [x] First incorrect answer does not directly push teacher support.
- [x] Repeated confusion can reveal teacher support.
- [x] Practice teacher request includes context fields.
- [x] Teacher-support copy asks whether a teacher should explain the step.

## Overall Layout

- [x] Dashboard shows Practice and Chat as connected learning entry points.
- [x] Homepage explains practice and questions under one learning path.
- [x] Parent Report shows unified learning activity.
- [x] Demo flow can cover Homepage -> Dashboard -> Practice -> Chat -> Back to lesson -> Parent Report.

## Final Verification

- [x] `npm run build` passed on 2026-05-26.
- [x] Browser smoke passed for homepage entry copy, student Dashboard, lesson intro, correct feedback, incorrect feedback, hint, Practice-to-Chat context card, Back to lesson, and parent learning activity summary on 2026-05-26.
