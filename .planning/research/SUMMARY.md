# Research Summary: v2.1 Question Bank UI Design

**Date:** 2026-06-01
**Scope:** Add Question Bank UI and demo/mock data flow to the existing STOA frontend.

## Key Findings

- Question Bank should be a flexible exercise library, not a second Practice Path. The central interaction is finding the right question set by subject, topic, difficulty, type, and status.
- Faceted search/filtering is appropriate because the module contains multiple result attributes and more than a short static list. Active filters, clear/reset, mobile collapse, and accessible result announcements should be designed up front.
- Education practice products commonly show question count, expected time, skill/proficiency progress, result summaries, recommendations, and mistake review. STOA should use these patterns while preserving its calm, premium learning tone.
- The existing stack is enough. v2.1 should add typed mock data, query hooks, routes, components, i18n, docs, and browser verification without new libraries.
- The session UI should feel like guided learning, not an exam: progress, immediate feedback, explanations, retry/review, and Learning Assistant handoff matter more than timer pressure.

## Stack Additions

No external dependency additions recommended.

Add local modules:

- `src/types/questionBank.ts`
- `src/data/mockQuestionBank.ts`
- `src/services/questionBank/*`
- `src/hooks/questionBank/*`
- `src/components/question-bank/*`
- `src/pages/question-bank/*`
- `src/lib/questionBankRoutes.ts`
- `src/i18n/locales/{en,de,fr,it}/questionBank.json`

## Feature Table Stakes

- Question Bank home with search, continue practice, subject cards, recommended sets, mistakes review, and recent practice.
- Subject overview with grade/level and difficulty filters, topic grid, recommended sets, and progress summary.
- Topic page with filter bar, question set list, weak areas, and related Practice Path CTA.
- Question set overview with metadata, skills, type breakdown, last attempt, and start/resume actions.
- Question session supporting multiple choice, short answer, numeric answer, and step-by-step UI.
- Feedback states: idle, checking, correct, incorrect, partially correct, skipped.
- Result page with score, time, topic accuracy, incorrect questions, retry mistakes, and next steps.
- Mistakes review page with filters and review-session entry.
- Student navigation entry plus parent/tutor comprehension updates.

## Watch Out For

- Do not duplicate Practice Path roadmap UI.
- Do not build production backend, item management, generated questions, paid locks, video/live-teacher help, or exam mode.
- Keep filter UI compact and accessible, especially on mobile.
- Keep Learning Assistant handoff provider-agnostic and product-safe.
- Keep visible copy free of demo/mock/backend/provider wording.

## Sources

- VA.gov Design System, Search Filter: https://design.va.gov/components/search-filter
- W3C ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- Khan Academy Help Center, Course and Unit Mastery: https://support.khanacademy.org/hc/en-us/articles/115002552631-What-are-Course-and-Unit-Mastery
- IXL Official Blog, Student practice reports: https://blog.ixl.com/2023/11/01/new-student-practice-reports-for-ixl-school-analytics/
- Duoplanet, Duolingo Practice Hub overview: https://duoplanet.com/duolingo-practice-hub/
