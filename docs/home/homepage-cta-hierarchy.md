# Homepage CTA Hierarchy

## CTA Roles

The homepage uses three visible CTA roles:

| CTA | Role | Destination |
|-----|------|-------------|
| Start Learning | Primary platform entry | Learning Chat login/chat flow |
| Start Practice | Direct Practice Path entry | Role-aware Practice route |
| How it works | Secondary explanation | `/how-it-works` |

## Visual Hierarchy

`Start Learning` remains the page-level primary action in the Hero.

`Start Practice` is a clear entry inside the Practice section. It should feel concrete and clickable, but not stronger than the Hero CTA.

`How it works` stays secondary and explanatory.

## Routing Contract

Start Practice route behavior:

| User state | Destination |
|------------|-------------|
| Not logged in | `/login?next=/practice` |
| Student | `/practice` |
| Parent | `/parent` |
| Tutor | `/tutor` |
| Admin | `/admin` |

Student registration path:

```text
/register?role=student&next=/practice
```

After registration, the expected student destination is `/practice`.

## Copy Boundaries

Use:

- Practice Game
- Practice Path
- Short practice challenge
- Equation path preview
- Start Practice

Avoid:

- Duolingo-style
- AI game
- Play now
- Gamified platform
- XP, streaks, hearts, gems, shops, leaderboards

