# Practice Path Real Backend Requirements

Phase 30 does not implement these requirements. This document records what a future backend should support after the demo story is validated.

## Practice Progress

The backend should persist:

- Student ID
- Subject ID
- Unit ID
- Lesson ID
- Completed lessons
- Current lesson
- Challenge attempts
- Correct and incorrect answers
- Hint usage
- Time spent
- Progress points or equivalent learning progress metric

## Practice to Learning Chat

The backend should persist Practice-origin chat context:

- Source: Practice
- Subject and topic
- Lesson ID
- Challenge ID
- Challenge prompt
- Student answer
- Grade level
- Conversation ID
- Return path or equivalent app navigation state

## Teacher Support

Practice-origin teacher requests should include:

- Student ID
- Subject and topic
- Lesson and challenge context
- Student answer
- Attempts
- Whether a hint was shown
- Whether Learning Chat was used
- Parent/report visibility status

## Parent Report

The backend should provide report-ready aggregates:

- Lessons completed this week
- Topics practised
- Questions asked
- Mistakes reviewed
- Teacher support requested
- Recommended next topic

## Feedback Capture

Future feedback capture should include privacy review before storing session notes, quotes, tester identity, or role-specific research responses.

## Boundary

These are handoff requirements, not frontend implementation tasks for Phase 30.
