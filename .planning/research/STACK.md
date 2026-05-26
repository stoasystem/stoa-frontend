# Research: STACK for Phase 27 Practice Path

**Project:** STOA Frontend v1.25 / Phase 27
**Researched:** 2026-05-26
**Mode:** Ecosystem / stack fit
**Confidence:** HIGH for STOA stack fit, MEDIUM for reference repo mechanics

## Source Repo Signals

Reference inspected: `sanidhyy/duolingo-clone` on GitHub via README, `package.json`, repo tree, `db/schema.ts`, `db/queries.ts`, `actions/*`, and `app/lesson/*`.

Useful product/data signals:
- The core model is small: course -> unit -> lesson -> ordered challenge -> options -> challenge progress -> user progress.
- Lesson selection is based on the first incomplete lesson in the active course.
- Challenge flow keeps local session state for active challenge index, selected answer, status (`none`, `correct`, `wrong`), progress percentage, and retry.
- Answer submission is a mutation that marks challenge progress and updates aggregate progress.
- Wrong answers trigger immediate feedback and retry rather than moving forward.
- Completed lessons show a summary/result state plus a practice-again path.
- Separate pages exist for learn/path, lesson, quests, leaderboard, shop, and admin, but only learn/path and lesson mechanics are relevant to STOA.
- The repo uses small UI components for lesson header, progress bar, challenge option cards, feedback footer, and result cards.
- It uses shortcut keys, sound effects, hearts, points, subscription bypass, confetti, character/audio assets, shop, and leaderboard mechanics. These are reference-only and should not shape STOA Phase 27.

Reference stack signals to reject:
- The repo is a Next.js app with server actions, Clerk auth, Neon/Postgres, Drizzle, Stripe, React Admin, Vercel helpers, `react-use`, `react-confetti`, and language-learning media assets.
- STOA should not copy that stack. Phase 27 needs a React/Vite frontend demo feature, not a full-stack language-learning clone.

## Existing STOA Stack Fit

The current STOA stack already covers the Phase 27 needs:
- **React + TypeScript + Vite:** Keep as-is for route pages, typed contracts, and componentized challenge UI.
- **React Router:** Add Practice Path routes inside the existing student/product route structure rather than introducing Next routing.
- **TanStack Query v5:** Use for practice subjects, path, lesson detail, answer submission, lesson completion, dashboard summary, and parent-report summary. Current TanStack Query v5 docs support this model with query keys, mutations, and mutation-driven invalidation.
- **Axios API client:** Add a `src/services/practice/practiceApi.ts` module that uses the existing API client and works against both mock/demo data and local backend endpoints.
- **Zustand:** Use only for short-lived in-lesson attempt/session state if prop/local component state becomes too large. Do not persist canonical progress in Zustand.
- **i18next/react-i18next:** Add Practice Path namespaces/keys for EN/DE/FR/IT. Keep German/French/Italian button labels short enough for existing responsive rules.
- **Tailwind + existing UI primitives + lucide-react + sonner:** Enough for path cards, progress indicators, challenge buttons, feedback states, toasts, and icons.
- **Playwright:** Extend existing E2E coverage for practice overview -> lesson -> correct/wrong answer -> result -> mistakes review.
- **Demo backend/mock API:** Existing demo mode and local FastAPI patterns are a fit. Phase 27 can start with static TS mock data and optionally expose the same contract through local FastAPI or MSW.

## Recommended Additions

### Types and Mock Data

Add typed practice contracts under the existing source tree:
- `src/types/practice.ts`
- `src/data/practiceSubjects.ts` or `src/data/practiceMockData.ts`

Recommended model:
- `PracticeSubject`: `id`, `slug`, localized title/description, accent token, `units`, summary stats.
- `PracticeUnit`: `id`, `subjectId`, localized title, order, lesson summaries.
- `PracticeLesson`: `id`, `unitId`, subject, localized title/objective, ordered challenges, estimated minutes.
- `PracticeChallenge`: discriminated union for `multipleChoice`, `textInput`, `ordering`, and `explanation`.
- `PracticeAttempt`: selected answer/text/order, `isCorrect`, feedback key, optional misconception key, hint eligibility.
- `PracticeProgressSummary`: completion percentage, current lesson, streak/daily goal copy, recent mistakes, parent-safe summary.
- `PracticeMistake`: challenge reference, student answer, correct answer/explanation, hint/teacher-help handoff metadata.

Keep seed content subject-based:
- Mathematics: equations, fractions, geometry, word problems.
- Physics: forces, motion, energy, units.

### Service and Query Hooks

Add a bounded practice service layer:
- `src/services/practice/practiceApi.ts`
- `src/services/practice/practiceQueries.ts`
- Optional: `src/services/practice/practiceKeys.ts`

Recommended API functions:
- `getPracticeSubjects()`
- `getPracticePath(subjectId)`
- `getPracticeLesson(lessonId)`
- `submitPracticeAnswer(lessonId, challengeId, payload)`
- `completePracticeLesson(lessonId, payload)`
- `getPracticeSummary()`
- `getPracticeMistakes()`
- `requestPracticeHint(payload)` or reuse the existing Learning Assistant chat/help API with a practice context payload.

Recommended query hooks:
- `usePracticeSubjectsQuery`
- `usePracticePathQuery(subjectId)`
- `usePracticeLessonQuery(lessonId)`
- `useSubmitPracticeAnswerMutation`
- `useCompletePracticeLessonMutation`
- `usePracticeSummaryQuery`
- `usePracticeMistakesQuery`

Mutation behavior:
- On answer submit, update local lesson attempt state immediately.
- On lesson completion, invalidate practice path, practice summary, dashboard summary, and parent-report summary query keys.
- Keep canonical progress API-shaped, even if Phase 27 stores it in memory/mock data.

### Optional MSW or Demo Backend Endpoints

Default recommendation: use existing static mock data plus service-layer fallback first. Add MSW only if frontend/demo QA needs API-level interception without running FastAPI.

If adding MSW:
- Add `msw` as a dev dependency only.
- Keep handlers under `src/mocks/practiceHandlers.ts`.
- Start the worker only in explicit demo/mock mode so production-facing UI is not affected.
- Mirror the backend contract exactly; do not create a separate frontend-only contract.

If extending the local FastAPI demo backend:
- Add `/practice/subjects`
- Add `/practice/subjects/{subject_id}/path`
- Add `/practice/lessons/{lesson_id}`
- Add `/practice/lessons/{lesson_id}/answers`
- Add `/practice/lessons/{lesson_id}/complete`
- Add `/practice/summary`
- Add `/practice/mistakes`

Keep all state demo-only: in-memory or existing local demo reset data is enough. Do not introduce migrations, ORM work, or production persistence.

### Route Pages

Add student-facing pages in the existing React Router structure:
- `/practice` - subject overview and Continue Practice entry.
- `/practice/:subjectId` - subject path with units and lesson nodes.
- `/practice/lesson/:lessonId` - active challenge flow.
- `/practice/lesson/:lessonId/result` - summary and next-step actions.
- `/practice/mistakes` - recent mistakes review and hint/teacher-help handoff.

Integrate existing pages:
- Student Dashboard: Continue Practice card using `PracticeProgressSummary`.
- Parent Report: practice summary section with supportive wording, not leaderboard/gamified pressure.

### Lesson and Challenge UI

Build STOA-native components:
- `PracticePath`
- `PracticeLessonNode`
- `PracticeLessonShell`
- `PracticeProgressHeader`
- `PracticeChallengeCard`
- `MultipleChoiceChallenge`
- `TextInputChallenge`
- `OrderingChallenge`
- `ExplanationChallenge`
- `PracticeFeedbackPanel`
- `PracticeHintPanel`
- `PracticeLessonResult`
- `PracticeMistakesReview`

Use existing Tailwind, lucide icons, and STOA brand tokens. Do not add `react-circular-progressbar`; a CSS progress bar is sufficient. Do not add `react-confetti`; completion should feel premium and calm.

### Progress and Attempt State

Recommended split:
- **Server/demo state via TanStack Query:** subject path, completed lessons, mistake history, summary stats.
- **Local component state:** current challenge index, draft answer, immediate feedback status.
- **Optional Zustand store:** only for cross-page resume state if the user leaves a lesson mid-flow.

Track:
- lesson completion percentage
- correct/wrong attempts
- retry count
- recent mistake list
- daily goal/streak as gentle demo metadata
- hint requested
- teacher help requested

Avoid:
- punitive hearts/lives
- monetized points/gems
- competitive leaderboards
- production adaptive learning claims

### i18n

Add Practice Path keys to existing EN/DE/FR/IT locale files:
- route titles and nav labels
- subject names and lesson titles
- challenge prompts
- feedback states
- hint and teacher-help CTAs
- result summary
- parent-report summary copy
- empty/error/loading states

Use stable keys, not embedded English strings in mock lesson content. German/French/Italian button labels should have short variants for mobile.

## Explicit Non-Additions

Do not add:
- Clerk or any auth replacement. STOA already has its own auth/role boundary.
- Stripe, subscription bypasses, premium shop mechanics, gems, hearts, lives, or paid refills.
- Neon, Postgres, Drizzle, migrations, schema design, or any complex DB layer.
- Next.js, server actions, Vercel-specific runtime assumptions, or Bun-only workflow.
- React Admin or admin CRUD tooling for lesson content.
- Language-learning audio assets, pronunciation/audio challenge infrastructure, flags, mascot voice packs, or Freesound/ElevenLabs-style media.
- `react-confetti`, `react-circular-progressbar`, or `react-use` unless a later implementation proves a concrete need. Native React state, CSS, browser APIs, and existing packages are enough.
- Production adaptive learning, real AI diagnosis, real curriculum graph generation, or automated personalized sequencing.
- Direct frontend calls to AI providers. Practice hints should call existing STOA backend/Learning Assistant APIs with practice context.
- A new production backend. Any Phase 27 backend work should be demo-only contract support.

## Integration Notes

Recommended file shape:

```text
src/
  data/
    practiceMockData.ts
  pages/
    student/
      PracticeOverview.tsx
      PracticeSubjectPath.tsx
      PracticeLesson.tsx
      PracticeLessonResult.tsx
      PracticeMistakes.tsx
  services/
    practice/
      practiceApi.ts
      practiceKeys.ts
      practiceQueries.ts
  types/
    practice.ts
  components/
    practice/
      PracticePath.tsx
      PracticeLessonShell.tsx
      PracticeFeedbackPanel.tsx
      PracticeHintPanel.tsx
```

API contract should be backend-ready from day one:
- Request/response types live in `src/types/practice.ts`.
- Mock data should satisfy those types.
- Query hooks should not know whether data comes from mock data, MSW, or FastAPI.
- Dashboard and parent report should consume summary hooks rather than duplicating practice calculations.
- Learning Assistant handoff should pass subject, lesson, challenge, student answer, correct answer, and misconception label to the existing backend API. The UI should label it as a hint or tutor support path, never as provider-specific AI behavior.

Suggested implementation order:
1. Types and mock data.
2. Service API and query hooks.
3. Practice overview/path routes.
4. Lesson challenge shell and answer mutation.
5. Result and mistakes review.
6. Dashboard and parent-report integration.
7. i18n and Playwright coverage.
8. Optional MSW/FastAPI endpoint parity if mock fallback is not enough for QA.

## Risks

- **Over-copying the reference repo:** The repo's full-stack/auth/payment/database choices conflict with STOA's current architecture. Treat it as interaction research only.
- **Gamification tone drift:** Hearts, gems, shops, leaderboards, and punitive failure states would weaken STOA's premium education positioning. Use calm progress, daily goal, and supportive feedback instead.
- **State duplication:** Progress can easily diverge if stored in Zustand, mock data, and query cache at once. Keep canonical progress API-shaped and invalidate query keys after completion.
- **i18n content sprawl:** Challenge prompts and feedback need stable keys and reviewed EN/DE/FR/IT copy, not hardcoded English inside components.
- **Demo/prod boundary leakage:** MSW or FastAPI practice endpoints must stay explicitly demo-only until a real backend owns persistence and authorization.
- **Learning Assistant coupling:** Practice hints must remain backend-mediated. Do not expose model/provider names, prompt rules, or direct provider calls in frontend code.

## Sources

- STOA project context: `.planning/PROJECT.md`
- STOA current stack map: `.planning/codebase/STACK.md`
- STOA package manifest: `package.json`
- Reference README: https://github.com/sanidhyy/duolingo-clone/blob/main/README.md
- Reference package manifest: https://github.com/sanidhyy/duolingo-clone/blob/main/package.json
- Reference data model: https://github.com/sanidhyy/duolingo-clone/blob/main/db/schema.ts
- Reference queries: https://github.com/sanidhyy/duolingo-clone/blob/main/db/queries.ts
- Reference lesson flow: https://github.com/sanidhyy/duolingo-clone/tree/main/app/lesson
- TanStack Query v5 docs: https://tanstack.dev/query/v5/docs/framework/react
- MSW browser mocking docs: https://mswjs.io/
