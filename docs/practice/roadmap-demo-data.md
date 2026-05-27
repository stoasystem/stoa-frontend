# Roadmap Demo Data

The current roadmap demo data lives in `src/data/mockPractice.ts` and is exposed through `getMockPracticeRoadmap`.

## Current Demo

```text
subjectId: mathematics
gradeLevel: lower_secondary
topicId: equations
```

Units:

- Unit 1: Linear equations
- Unit 2: Quadratic basics
- Unit 3: Linear systems

Initial node states:

- One-step equations: completed
- Solving equations in two steps: current
- Equations with brackets: available
- Word problems with linear equations: locked
- Quadratic basics lessons: locked
- Linear systems lesson: locked

## Future API Shape

The frontend service expects this future endpoint shape:

```text
GET /practice/:subjectId/:topicId/roadmap
```

The response should include `subjectId`, `topicId`, `gradeLevel`, `progress`, `currentLessonId`, `units`, and each lesson node's status and unlock condition.

## Expansion Rule

Do not branch the UI by equations. Add future topics by creating new subject/topic roadmap data that follows the same `PracticeRoadmap` contract.
