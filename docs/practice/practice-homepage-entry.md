# Practice Homepage Entry

## Purpose

The homepage Practice entry lets students begin with a short equation challenge without first understanding every STOA product layer. The entry is intentionally narrow: it starts Practice and then points students toward Learning Chat when they need explanation.

## Route Flow

Unauthenticated visitor:

```text
Homepage Start Practice -> /login?next=/practice -> student login -> /practice
```

Authenticated student:

```text
Homepage Start Practice -> /practice
```

Authenticated non-student:

```text
Parent -> /parent
Tutor -> /tutor
Admin -> /admin
```

## Learning Flow

1. Student starts a short equation challenge.
2. Student receives immediate feedback.
3. Mistake or uncertainty leads to a hint.
4. Student opens Learning Chat for clearer explanation.
5. Continued confusion can become Professional Teacher Support.
6. Parent Report shows the learning activity.

## Implementation Notes

- `getStartPracticePath` centralizes role-aware destination decisions.
- Login allows safe student-owned `next=/practice` redirects.
- The homepage entry uses localized copy from `src/i18n/locales/*/home.json`.
- The preview is deliberately short and does not add new curriculum content.

