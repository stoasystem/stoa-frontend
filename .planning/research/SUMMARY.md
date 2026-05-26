# Research Summary: Phase 29 Practice Interaction and Learning Entry Flow

**Milestone:** v1.27 Phase 29
**Date:** 2026-05-26

## Key Findings

1. The strongest Duolingo-style pattern to adapt is not cartoon styling; it is the stable loop of short challenge, immediate feedback, retry, progress, and clear next action.
2. The reference clone separates lesson shell, challenge rendering, progress/heart header, and footer feedback controls. STOA should preserve this decomposition concept while keeping its React/Vite/frontend-only architecture.
3. Multiple-try feedback with hints is a strong fit for STOA's educational goal because it supports mistake recovery before answer reveal or human escalation.
4. Gamification can backfire when learners focus on points, streaks, or competitive mechanics instead of understanding. STOA should keep progress visible but restrained.
5. Phase 29 should make Practice a warm entry point into Learning Chat: the student gets stuck in a concrete challenge, asks for step explanation with context, then returns to the lesson.

## Design Direction

- Make the lesson flow calmer and more predictable:
  - Lesson intro before questions.
  - Stable progress area.
  - Stable feedback/hint/CTA area.
  - Clear completion summary.
- Make Practice-to-Chat contextual:
  - `Explain this step`.
  - Chat context card.
  - `Back to lesson`.
- Make teacher support tertiary:
  - Show after repeated confusion.
  - Carry practice context.
  - Use supportive wording.
- Make the product IA coherent:
  - Homepage: `Start learning`.
  - Dashboard: `Continue Practice` and `Ask a question`.
  - Parent Report: `Learning activity`.

## Scope Decision

No new major dependency, backend, database, full LMS, adaptive learning, or new curriculum content is needed. Phase 29 is frontend design, route-state/demo contract, UI copy, docs, QA, and demo polish.

## Source Notes

- `sanidhyy/duolingo-clone` is useful for lesson/challenge/progress/footer interaction structure, but not for STOA's stack, backend, product category, visual language, payments, or gamification system: https://github.com/sanidhyy/duolingo-clone
- The clone's lesson code shows a single active challenge, selected answer state, status state, progress update, and footer feedback loop: https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/app/lesson/quiz.tsx
- The clone's footer shows the value of a persistent bottom action surface whose label changes by status (`Check`, `Next`, `Retry`, `Continue`): https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/app/lesson/footer.tsx
- Gamification misuse research warns that gamified learning apps can distract users from learning when they become too fixated on points, badges, leaderboards, or playfulness: https://arxiv.org/abs/2203.16175
- E-learning research on multiple-try feedback supports giving students retry opportunities and hints during practice rather than treating the first mistake as final failure: https://link.springer.com/article/10.1007/s11423-022-10105-z

