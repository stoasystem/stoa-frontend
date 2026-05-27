# Lesson Node Status Rules

Practice roadmap lesson nodes use five states.

## Statuses

| Status | Meaning | Behavior |
|--------|---------|----------|
| `completed` | Student has finished the lesson | Click opens review/start path |
| `current` | Recommended next lesson | Click continues lesson |
| `available` | Student can start it now | Click starts lesson |
| `locked` | Lesson is not yet startable | Click shows unlock condition |
| `review` | Completed lesson worth revisiting | Click opens review/start path |

## Locked Lessons

Locked lessons must not route directly to the lesson. The UI should show:

```text
Complete the previous lesson first.
```

Localized variants live in `src/i18n/locales/*/practice.json` under `roadmap.lockedHint`.

## Completion Progression

The demo roadmap uses mock state. Completing a roadmap lesson marks it complete and advances the current lesson to the next roadmap node. Production persistence remains future backend work.
