# Homepage to Practice Demo Flow

## Goal

Demonstrate that a visitor can understand and start the Practice Path from the homepage, then see how Practice connects to Learning Chat and the broader STOA platform.

## Unauthenticated Demo

1. Open `/`.
2. Confirm Hero still presents STOA as a learning support platform, not a game.
3. Scroll to the Practice Game / Practice Path section after the Hero.
4. Confirm the section explains short equation practice and Learning Chat help.
5. Confirm preview topics show one-step equations, quadratic basics, and linear systems.
6. Click Start Practice.
7. Confirm the route is `/login?next=/practice`.

## Student Demo

1. Log in as a student.
2. Open `/`.
3. Click Start Practice.
4. Confirm destination is `/practice`.
5. Start or continue the equation path.
6. Make or inspect a mistake.
7. Use the hint before opening Learning Chat.
8. Open Learning Chat with Practice context.
9. Return to Practice or continue the explanation.

## Parent / Tutor / Admin Route Check

When already logged in:

- Parent clicking Start Practice should route to `/parent`.
- Tutor clicking Start Practice should route to `/tutor`.
- Admin clicking Start Practice should route to `/admin`.

## Presenter Language

Use:

```text
Practice helps the student start. Learning Chat helps the student understand. Professional teacher support is available when guided help is not enough. Parent Report makes the learning process visible.
```

Avoid:

```text
STOA is a learning game.
```

