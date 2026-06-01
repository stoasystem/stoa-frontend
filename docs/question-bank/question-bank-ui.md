# Question Bank UI

Question Bank is STOA's flexible exercise library. It is separate from Practice Path:

- **Practice Path**: guided roadmap, lessons, progression states, and structured learning sequence.
- **Question Bank**: open practice by subject, topic, difficulty, question type, status, saved sets, and mistakes review.
- **Learning Chat**: explanation surface when a question-bank step is unclear.
- **Professional Teacher Support**: escalation path after the student still needs qualified support.
- **Parent Report**: visibility into practice attempts, mistakes reviewed, and next focus.

## Routes

- `/question-bank`
- `/question-bank/:subjectId`
- `/question-bank/:subjectId/:topicId`
- `/question-bank/sets/:setId`
- `/question-bank/session/:sessionId`
- `/question-bank/session/:sessionId/result`
- `/question-bank/mistakes`
- `/question-bank/saved`

## Implementation Boundary

v2.1 is UI plus deterministic mock/demo data. It does not include production question storage, item authoring, generated questions, image recognition, video help, live teacher joining, paid unlocking, exam mode, production permissions, or formal curriculum-standard mapping.

## Local Verification

Run:

```bash
npm run lint
npm run build
VITE_API_MODE=mock npm run dev -- --host 127.0.0.1 --port 5174
```

Then log in as `student@test.com` with `password123` and smoke:

- Question Bank home
- Mathematics subject page
- Algebra topic page
- Linear Equations Basics set overview
- Session answer and feedback
- Question Bank to Learning Chat handoff
- Result page
- Mistakes review
- Saved sets

## Future Backend Handoff

The frontend boundary is intentionally replaceable:

- Types live in `src/types/questionBank.ts`.
- Mock data lives in `src/data/mockQuestionBank.ts`.
- API boundary lives in `src/services/questionBank/questionBankApi.ts`.
- Query keys live in `src/services/questionBank/questionBankQueryKeys.ts`.
- Hooks live in `src/hooks/questionBank/`.

Future backend work can replace the service implementation without substantial page rewrites.
