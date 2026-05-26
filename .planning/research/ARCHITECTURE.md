# Research: Architecture Integration for Phase 29

**Milestone:** v1.27 Phase 29
**Date:** 2026-05-26

## Question

How should Practice Path connect to Learning Chat and site navigation without changing the backend architecture?

## Integration Points

### Types

Add frontend/demo contract types:

```ts
export type PracticeChatContext = {
  source: 'practice'
  subjectId: string
  lessonId: string
  challengeId: string
  challengePrompt: string
  studentAnswer?: string
  correctAnswer?: string
  topic: string
  gradeLevel: string
  returnTo?: string
}

export type PracticeTeacherRequestContext = {
  source: 'practice'
  subjectId: string
  lessonId: string
  challengeId: string
  topic: string
  studentAnswer?: string
  attempts: number
}
```

### Practice Page

- Lesson page builds `PracticeChatContext` from current challenge state.
- `Explain this step` navigates to Chat with route state.
- `Ask a teacher` stays hidden until repeated confusion.
- Result and mistakes review pages can link to Chat with the relevant challenge context.

### Chat Page

- Chat reads route state.
- If `source === 'practice'`, render a compact context card above the conversation or near the input.
- Pre-fill or seed the input with "Can you explain this step?" where current chat flow supports it.
- Show `Back to lesson` with the original `returnTo` path.

### Teacher Support

- Teacher request path can include `practiceContext` in the frontend payload or mock data.
- Tutor-facing UI should show topic/challenge context if the existing request detail page has a place for it.
- Do not require production backend persistence in Phase 29.

### Dashboard and IA

- Student Dashboard should present Practice first as the next recommended action, and Chat as the specific-question action.
- Homepage should use a broad `Start learning` CTA, then split inside the student app.
- Parent Report should avoid reporting Practice and Chat separately as competing systems; group them into "Learning activity".

## Build Order

1. Document interaction contract and site entry map.
2. Refine Practice lesson surfaces.
3. Add Practice-to-Chat route state and Chat context card.
4. Add teacher escalation context.
5. Reorganize Dashboard/homepage/parent report entry framing.
6. Localize, QA, and update demo script.

## Sources

- Reference clone lesson decomposition: https://github.com/sanidhyy/duolingo-clone
- Raw lesson shell and footer reference:
  - https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/app/lesson/quiz.tsx
  - https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/app/lesson/footer.tsx

