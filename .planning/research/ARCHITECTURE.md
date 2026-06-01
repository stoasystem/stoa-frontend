# Project Research: Architecture for v2.1 Question Bank UI Design

**Milestone:** v2.1 Question Bank UI Design
**Date:** 2026-06-01

## Proposed Structure

```text
src/types/questionBank.ts
src/data/mockQuestionBank.ts
src/services/questionBank/questionBankApi.ts
src/services/questionBank/questionBankQueryKeys.ts
src/hooks/questionBank/*
src/components/question-bank/*
src/pages/question-bank/*
src/lib/questionBankRoutes.ts
src/i18n/locales/{en,de,fr,it}/questionBank.json
```

## Routes

Core v2.1 routes:

- `/question-bank`
- `/question-bank/:subjectId`
- `/question-bank/:subjectId/:topicId`
- `/question-bank/sets/:setId`
- `/question-bank/session/:sessionId`
- `/question-bank/session/:sessionId/result`
- `/question-bank/mistakes`
- `/question-bank/saved`

Future routes can be reserved in docs, not implemented:

- `/question-bank/exam-prep`
- `/question-bank/recommended`
- `/question-bank/recent`

## Data Model

Recommended domain types:

- `QuestionBankSubject`
- `QuestionBankTopic`
- `QuestionBankSet`
- `QuestionBankQuestion`
- `QuestionBankSession`
- `QuestionBankAnswer`
- `QuestionBankFeedback`
- `QuestionBankResult`
- `QuestionBankMistake`
- `QuestionBankFilters`

Important enums/unions:

- `QuestionSetStatus = 'not_started' | 'in_progress' | 'completed' | 'review_recommended'`
- `QuestionType = 'multiple_choice' | 'short_answer' | 'numeric' | 'step_by_step'`
- `QuestionFeedbackState = 'idle' | 'checking' | 'correct' | 'incorrect' | 'partially_correct' | 'skipped'`
- `QuestionBankDifficulty = 'easy' | 'medium' | 'hard'`

## Data Flow

1. Pages call question-bank query hooks.
2. Query hooks call `questionBankApi`.
3. `questionBankApi` reads deterministic mock data and computes filtered lists/session results.
4. Session UI keeps active answer state in a reducer.
5. Finish Set writes mock result into local service state or deterministic in-memory state for the current browser session.
6. Learning Assistant CTA routes to `/chat?source=question-bank&questionId=...` or uses route state containing a provider-agnostic `QuestionBankChatContext`.

## Integration Points

- **Navigation:** Add Question Bank to authenticated student navigation near Practice and Learning Chat.
- **Dashboard:** Add a compact entry card or update learning entry cards so Question Bank is visible without crowding the dashboard.
- **Practice Path:** Add related Practice Path CTA from topic/result pages. Do not embed roadmap UI inside Question Bank.
- **Chat:** Add a question-bank context card or extend existing practice context handling with a separate source type.
- **Parent Report:** Add concise activity language: sets attempted, mistakes reviewed, and next topic.
- **Tutor Context:** Allow teacher-help context to carry question-bank source metadata in future, but keep v2.1 simple if no tutor flow is implemented in the first UI slice.

## Build Order

1. Types, mock data, service/query hooks, and route helpers.
2. Browse/discovery pages and student navigation.
3. Question-set overview and session shell.
4. Feedback, result, mistakes review, and Learning Assistant handoff.
5. Parent/tutor comprehension, docs, localization, and QA.

## Architectural Constraints

- Keep Question Bank independent enough to replace mock data with backend APIs later.
- Avoid sharing mutable session state with Practice Path reducers unless the abstraction is genuinely common.
- Do not rename or disturb Practice Path routes while adding Question Bank.
- Do not introduce product-visible "demo", "mock", "provider", "AI", or backend terminology.
