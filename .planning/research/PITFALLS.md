# Research: Pitfalls for Phase 29

**Milestone:** v1.27 Phase 29
**Date:** 2026-05-26

## Common Mistakes

### Copying Duolingo Too Literally

The reference clone has language-learning, hearts, modal, audio, subscription, and full-stack assumptions. STOA should adapt interaction sequencing, not the product category or backend architecture.

Prevention:

- Keep `Practice Path` as the module name.
- Avoid shop/gems/leaderboards and loud reward language.
- Keep attempts neutral and educational.

### Feedback Panel Layout Shift

If feedback, hint, and retry controls appear in different places, the lesson feels unstable.

Prevention:

- Reserve a consistent feedback area.
- Keep primary action fixed.
- Treat `Explain this step` as secondary and `Ask a teacher` as tertiary.

### Direct Answer Leakage

If Chat receives `correctAnswer` and immediately reveals it, Practice becomes answer lookup rather than learning.

Prevention:

- Chat context card can include the challenge prompt and student answer.
- Learning Assistant prompt/behavior should explain the next step first.
- Correct answer can remain in context for internal evaluation but should not be shown as the first visible response.

### Teacher Escalation Too Early

Immediate teacher CTA makes the Learning Assistant feel bypassed and can increase perceived failure.

Prevention:

- Require repeated wrong attempts, hint usage, or explicit "still don't understand".
- Use wording like "Would you like a teacher to explain this?"

### IA Fragmentation

Adding Practice without reworking entry points can make STOA feel like several unrelated tools.

Prevention:

- Dashboard: Practice and Chat as two routes under one learning workflow.
- Homepage: `Start learning`, not competing Practice/Chat CTAs.
- Parent Report: unified learning activity summary.

### Over-Gamification

Research on gamification misuse warns that badges, points, leaderboards, and playful pressure can distract from learning if users optimize for rewards rather than understanding.

Prevention:

- Keep progress feedback restrained.
- Use streak/progress only as supportive context.
- Avoid punitive hearts and leaderboard competition.

## Sources

- Gamification misuse research: https://arxiv.org/abs/2203.16175
- Multiple-try feedback and hints: https://link.springer.com/article/10.1007/s11423-022-10105-z
- Reference clone mechanics: https://github.com/sanidhyy/duolingo-clone

