# Practice to Teacher Support Flow

Teacher support is an escalation path, not the first response to a mistake.

## Appearance Conditions

Teacher support may appear after:

- repeated incorrect attempts,
- repeated hint use,
- Learning Chat explanation has already been requested,
- explicit stuck intent.

It should not appear as the primary action after the first incorrect answer.

## Frontend Demo Contract

```ts
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

## Copy

English: `Would you like a teacher to explain this?`

German: `Soll eine Lehrperson diesen Schritt erklären?`

French: `Souhaitez-vous qu’un enseignant explique cette étape ?`

Italian: `Vuoi che un insegnante spieghi questo passaggio?`

## Demo Scope

Phase 29 may carry this context through frontend state or mock payloads only. Production teacher-support persistence remains a future backend concern.
