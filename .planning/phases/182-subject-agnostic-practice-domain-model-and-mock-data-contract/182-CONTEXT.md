# Phase 182 Context: Subject-Agnostic Practice Model

## Inputs

- Phase 181 established that Practice Path is a general middle-school and high-school challenge system.
- Equations are the first demo content package under Mathematics / lower secondary / equations.
- Existing source code already had `PracticeSubject`, `PracticePath`, `LearningUnit`, `PracticeLesson`, and `PracticeChallenge`, but some data and copy still treated equations as the main path.

## Implementation Boundary

This phase aligns types, mock data, and API-contract docs. It does not redesign routes or user-facing copy beyond compile-safe metadata changes; those belong to Phases 183 and 184.
