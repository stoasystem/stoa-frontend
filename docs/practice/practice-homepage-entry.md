# Practice Homepage Entry

## Purpose

The homepage Practice entry lets students begin with short challenges in school topics without first understanding every STOA product layer. The current demo path focuses on Mathematics / Equations, but Practice Path itself is not equation-only.

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

1. Student starts a short practice challenge in the available topic.
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
- Equation language belongs in the current demo preview, not in the definition of Practice Path.
