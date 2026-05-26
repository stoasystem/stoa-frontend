# Practice to Learning Chat Flow

Phase 29 makes Practice a natural entry point into Learning Chat.

## Trigger Points

- Incorrect answer.
- Hint shown and the student still needs help.
- Repeated incorrect attempts.
- Lesson result with mistakes.
- Mistakes review.

## Route State Contract

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
```

## Chat Behavior

- Chat opens with a compact practice context card.
- The prompt can be prefilled with `Can you explain this step?`.
- The visible explanation path should guide the next step first, not reveal the final answer first.
- `Back to lesson` returns to the originating lesson route.

## Copy Boundary

Use:

- `Explain this step`
- `Ask in Learning Chat`
- `Back to lesson`

Avoid:

- `Ask AI`
- `AI answer`
- provider/model/debug wording
