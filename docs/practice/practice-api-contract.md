# Practice API Contract

Phase 27 keeps Practice Path frontend/demo-backed. These endpoints define the future backend handoff shape while the current UI uses deterministic mock data for demo reliability.

## GET /practice/subjects

Returns available practice subjects.

```json
{
  "items": [
    {
      "id": "mathematics",
      "name": "Mathematics",
      "description": "Short challenges for key mathematics topics.",
      "gradeLevels": [
        {
          "id": "lower_secondary",
          "label": "Lower secondary",
          "order": 1
        }
      ],
      "progress": 35
    }
  ]
}
```

## GET /practice/subjects/:subjectId/topics/:topicId/path

Returns the unit and lesson path for one subject/topic pair. The current demo uses `mathematics` and `equations`.

```json
{
  "subjectId": "mathematics",
  "gradeLevel": "lower_secondary",
  "topicId": "equations",
  "topicTitle": "Equations",
  "units": [
    {
      "id": "unit-linear-equations",
      "subjectId": "mathematics",
      "gradeLevel": "lower_secondary",
      "topicId": "equations",
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

Challenge payloads include `subjectId`, `gradeLevel`, `topicId`, `unitId`, and `lessonId` so Learning Chat, teacher support, and parent reports can preserve the source context.

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
  "subjectId": "mathematics",
  "gradeLevel": "lower_secondary",
  "topicId": "equations",
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

## Scope Rule

The contract must remain subject-agnostic and topic-agnostic. Equations are demo seed content only; future subjects and topics should fit the same subject -> grade level -> topic -> unit -> lesson -> challenge structure.
