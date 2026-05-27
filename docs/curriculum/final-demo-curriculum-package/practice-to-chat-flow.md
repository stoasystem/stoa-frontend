# Practice to Learning Chat Flow

The final demo treats Practice as a natural entry into Learning Chat.

## Flow

1. Student opens the current Mathematics / Equations demo lesson.
2. Student answers a challenge incorrectly.
3. STOA shows calm feedback and a hint.
4. Student retries or asks for a guided explanation.
5. `Explain this step` opens Learning Chat with the challenge context.
6. Learning Chat shows the practice context card.
7. Learning Assistant explains the current step and encourages another try.
8. Student returns to the lesson.

## Context That Matters

Learning Chat should know:

- Source: Practice
- Subject: Mathematics
- Grade level
- Topic
- Unit
- Lesson
- Challenge prompt
- Student answer, when available
- Return path

## Demo Message

This flow shows that STOA is useful before and after a student has a clear question. Practice helps reveal the stuck step; Learning Chat explains that step. Equations are the current demo topic, not the full Practice Path product scope.

## Boundary

In the current demo, this context is frontend/demo state. Production persistence belongs to future backend integration.
