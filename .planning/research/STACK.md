# Research: Stack Implications for Phase 29

**Milestone:** v1.27 Phase 29: Practice Path Interaction Refinement, Learning Platform Entry Flow, and Site Layout Reorganization
**Date:** 2026-05-26

## Question

What stack additions or changes are needed to refine a Duolingo-style Practice interaction and connect it to Learning Chat?

## Findings

No new runtime dependency is required for Phase 29.

The reference repository `sanidhyy/duolingo-clone` uses a broader full-stack setup: Next.js routes, actions for challenge progress and user progress, Drizzle/PostgreSQL-style data access, subscription/payment support, modal stores, sound assets, and lesson components such as `Quiz`, `Header`, `Footer`, `Challenge`, and `Card`. STOA should not copy that stack. The useful idea is the separation of a lesson shell from challenge cards, progress header, bottom feedback footer, and completion state.

Current STOA stack is sufficient:

- React Router route state can carry Practice context into Chat.
- Existing React/TypeScript components can render a context card and `Back to lesson` behavior.
- Existing TanStack Query/service conventions can expose mock/demo API contracts without production backend work.
- Existing i18n JSON can hold short CTA labels across EN/DE/FR/IT.
- Existing mock Practice data can include answer-response capability flags such as `canAskLearningAssistant` and `canAskTeacher`.

## Recommended Stack Work

- Add TypeScript-only context types:
  - `PracticeChatContext`
  - `PracticeTeacherRequestContext`
- Use `navigate('/chat', { state })` or an equivalent existing routing path for the demo transition.
- Keep context persistence simple; route state is enough for demo, with optional query/local fallback only if current app patterns already support it.
- Avoid adding animation, sound, confetti, gamification, state-machine, or backend dependencies.

## Sources

- Reference repo structure and lesson-related files: https://github.com/sanidhyy/duolingo-clone
- Lesson quiz mechanics observed in reference raw files:
  - https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/app/lesson/quiz.tsx
  - https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/app/lesson/footer.tsx
  - https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/app/lesson/challenge.tsx

