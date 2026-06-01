# Project Research: Stack for v2.1 Question Bank UI Design

**Milestone:** v2.1 Question Bank UI Design
**Date:** 2026-06-01

## Recommendation

No new runtime dependency is required for v2.1. Build Question Bank with the existing React, TypeScript, Vite, React Router, TanStack Query, shadcn-style UI primitives, Tailwind/theme tokens, mock service patterns, and existing Practice/Chat integration contracts.

## Existing Stack to Reuse

- **Routing:** Add protected student routes under the existing router configuration for `/question-bank`, `/question-bank/:subjectId`, `/question-bank/:subjectId/:topicId`, `/question-bank/sets/:setId`, `/question-bank/session/:sessionId`, `/question-bank/session/:sessionId/result`, `/question-bank/mistakes`, and `/question-bank/saved`.
- **Data access:** Mirror `src/services/practice/*` and `src/hooks/practice/*` with `questionBankApi`, `questionBankQueryKeys`, and query/mutation hooks. v2.1 data can remain in `src/data/mockQuestionBank.ts`.
- **Types:** Add `src/types/questionBank.ts` for subjects, topics, question sets, question items, sessions, answers, feedback states, results, mistakes, and filters.
- **UI components:** Reuse `Card`, `Button`, `Badge`, `Tabs`, `Input`, `Textarea`, `Separator`, `PageContainer`, `PageHeader`, `Breadcrumbs`, `EmptyState`, `LoadingState`, and existing app layout primitives.
- **Learning Assistant handoff:** Reuse the existing Chat route and route-state/query-param approach. v2.1 should pass question-bank context without exposing provider, prompt, model, mock, or backend internals.
- **Localization:** Add a `questionBank` namespace across English, German, French, and Italian only for user-facing labels and route-level copy introduced by this milestone.

## External Research Signals

- VA.gov's Search Filter guidance frames faceted search as useful when results have meaningful attributes and more than a short static list; it also calls out active filters, clear/reset behavior, mobile collapse, and accessible result announcements. Source: https://design.va.gov/components/search-filter
- W3C APG emphasizes keyboard support, accessible names/descriptions, landmarks, and correct widget semantics for interactive patterns. Source: https://www.w3.org/WAI/ARIA/apg/
- Khan Academy's mastery documentation shows students benefit from seeing question count, time expectation, progress by skill, post-activity result cards, and recommendations after completion. Source: https://support.khanacademy.org/hc/en-us/articles/115002552631-What-are-Course-and-Unit-Mastery
- IXL practice reporting highlights subject, grade, course, skill, proficiency, question count, and time-practiced dimensions as useful for understanding practice activity. Source: https://blog.ixl.com/2023/11/01/new-student-practice-reports-for-ixl-school-analytics/
- Duolingo Practice Hub, while not a STOA visual model, is a useful product boundary reference: it is a practice area away from the main learning path where students can target specific modes and revisit mistakes. Source: https://duoplanet.com/duolingo-practice-hub/

## What Not to Add

- No formula editor dependency in v2.1. Use plain input/textarea for answers and existing text rendering for simple math expressions.
- No new state-management library. Query state and local component/session state are enough for mock flows.
- No production backend client expansion beyond a clean replaceable service boundary.
- No analytics package. If needed, document future event names without implementing production tracking.
- No heavy table/grid dependency. Question set cards and lists are sufficient.

## Integration Notes

- Keep filter state local first. URL query params can be reserved but are not required for v2.1.
- The session flow can use deterministic mock IDs such as `demo-linear-equations-basics`.
- Store transient answer state in component/reducer logic, similar to the current Practice lesson reducer, not durable Zustand.
- Keep Question Bank route names and component names distinct from Practice to avoid future coupling.
