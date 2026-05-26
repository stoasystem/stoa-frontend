# Practice API Contract

Phase 27 keeps Practice Path frontend/demo-backed. These endpoints define the future backend handoff shape while the current UI uses deterministic mock data for demo reliability.

## GET /practice/subjects

Returns available practice subjects.

```json
{
  "items": [
    {
      "id": "math",
      "name": "Mathematics",
      "description": "Practice equations, functions, and problem solving.",
      "progress": 35
    }
  ]
}
```

## GET /practice/subjects/:subjectId/path

Returns the unit and lesson path for one subject.

```json
{
  "subjectId": "math",
  "units": [
    {
      "id": "unit-linear-equations",
      "subjectId": "math",
      "title": "Linear equations",
      "description": "Build confidence with equations step by step.",
      "order": 1,
      "status": "available",
      "lessons": []
    }
  ]
}
```

## GET /practice/lessons/:lessonId

Returns a lesson with 3-5 short challenges.

## POST /practice/challenges/:challengeId/answer

Request:

```json
{
  "answer": "x = 5"
}
```

Response:

```json
{
  "challengeId": "linear-1-c1",
  "correct": true,
  "feedback": "Good work. You used the right step.",
  "explanation": "9 - 4 = 5, so x = 5.",
  "nextChallengeId": "linear-1-c2",
  "attemptsRemaining": 2
}
```

## POST /practice/lessons/:lessonId/complete

Response:

```json
{
  "lessonId": "lesson-linear-1",
  "correctCount": 2,
  "totalCount": 3,
  "progressPoints": 24,
  "studyStreak": 6,
  "timeSpentSeconds": 225,
  "mistakes": []
}
```

## Demo Support Endpoints

The frontend also defines demo-facing service calls for:

- `GET /practice/overview`
- `GET /practice/mistakes`
- `POST /practice/hints`
- `POST /practice/teacher-help`
- `GET /parents/me/children/:childId/practice-summary`

These are contract placeholders. Phase 27 does not add a production database, adaptive learning engine, payment gate, or teacher workflow redesign.
