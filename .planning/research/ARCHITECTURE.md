# Research: Architecture for Phase 27 Practice Path

**Project:** STOA Frontend  
**Phase:** v1.25 Phase 27 Practice Path  
**Researched:** 2026-05-26  
**Mode:** Architecture research  
**Overall confidence:** HIGH for STOA integration points; MEDIUM for reference-repo signals because the reference is a mechanism sample, not a product or stack match.

## Source Repo Signals

Reference inspected: `https://github.com/sanidhyy/duolingo-clone` and selected raw files from the same repository.

Signals worth adapting:

- The reference separates the learning-path overview from the lesson runtime. Its learn page loads user progress, active course, lesson percentage, and units, then renders a path of unit/lesson buttons. STOA should use the same conceptual split: `/practice` and `/practice/:subjectId` for planning, `/practice/lesson/:lessonId` for the active lesson.
- The reference models content hierarchically as course -> unit -> lesson -> challenge -> challenge option -> challenge progress. STOA should translate that to subject -> path module -> lesson -> challenge -> attempt/result, using school subjects and STOA learning goals rather than language-learning course mechanics.
- The reference quiz runtime keeps local UI state for active challenge, selected answer, correctness status, lesson percentage, and completion summary. STOA should do the same for in-lesson interaction, but persist only answer submissions and lesson completion through the service layer.
- The reference has quests, points, hearts, and streak mechanics. STOA should adapt only the progress and habit-loop mechanics: daily goal, streak, completion state, recent mistakes, and retry. Avoid hearts, leaderboards, shop, points economy, subscriptions-as-game-advantage, mascots, sounds, and confetti as primary mechanics.
- The reference has modal stores for practice/hearts. STOA should not add a global Practice Path store for ordinary server state. Use TanStack Query for practice data and component state for the current lesson attempt. Add Zustand only if a later phase needs cross-route unsaved attempt recovery.

Signals to reject:

- Do not copy Next.js app-router structure, Drizzle schema, Clerk auth, Stripe, assets, mascots, sounds, or code. STOA is React + TypeScript + Vite with a FastAPI demo backend and existing `httpClient`/TanStack Query boundary.
- Do not import the reference's gamification vocabulary directly. STOA's parent-facing tone is calm and education-centered, so progress labels should be "practice streak", "daily goal", "recent mistakes", "needs review", and "ready to continue", not high-pressure loss or currency language.

## STOA Integration Points

Current STOA architecture uses these patterns:

- Routes live in `src/app/router/AppRouter.tsx` and route metadata/navigation in `src/app/router/routeConfig.ts`.
- Authenticated student surfaces are wrapped by `ProtectedRoute` plus `RoleRoute allowedRoles={['student']}`.
- Student pages use `DashboardLayout`, `PageContainer`, `PageHeader`, and shared UI primitives under `src/components/ui`.
- Feature data flows through `src/services/<domain>/*Api.ts` and `src/hooks/<domain>/use*Query.ts` / `use*Mutation.ts`.
- Services call `httpClient` and, where appropriate, wrap requests in `withDemoFallback`.
- Existing demo fallback data lives under `src/data/*`.
- Parent reports use `src/services/parent/parentReportApi.ts`, `src/hooks/parent/useChildReportQuery.ts`, `src/types/parentReport.ts`, and parent report components under `src/components/parent`.
- Teacher escalation is already represented by `src/services/teacherHelp/teacherHelpApi.ts`, `src/hooks/chat/useTeacherHelpMutation.ts`, `src/components/chat/TeacherRequestInlineAction.tsx`, and the backend `POST /teacher-help/request`.
- Learning Assistant behavior is behind backend chat APIs. The frontend must not call provider-specific APIs, mention provider names, or own prompt logic.
- i18n namespaces are registered manually in `src/i18n/index.ts` and `src/i18n/namespaces.ts`; new Practice Path copy needs locale files for `en`, `de`, `fr`, and `it`.

Recommended route additions:

```text
/practice
  Student practice overview across Mathematics and Physics.

/practice/:subjectId
  Subject path with modules, lessons, progress, daily goal, and recent mistakes summary.

/practice/lesson/:lessonId
  Active lesson runtime with challenge sequence, hint-first support, answer feedback, and submit/continue.

/practice/lesson/:lessonId/result
  Lesson result and next-step routing.

/practice/mistakes
  Cross-subject mistakes review queue.
```

Add these under the existing student `RoleRoute`, not under `DemoSurfaceRoute`, because Phase 27 is a student product surface. The data may be demo-backed, but the user-facing surface should behave like a core student learning feature. Mark route metadata as `core` if the implementation is expected to stay; mark only backend support/docs as demo-specific.

Navigation integration:

- Add a student `navItems` entry for `Practice` at `/practice`, primary, core, mobile true.
- Add a new `AppNavIcon` value such as `practice` and map it in `AppLayout` if the layout has an icon switch. Use a lucide icon such as `Route`, `Target`, or `Dumbbell`.
- Add route metadata for all Practice Path routes. Detail routes should use `navPriority: 'hidden'`.

Dashboard integration:

- Modify `src/components/dashboard/ContinueLearningCard.tsx` to include "Continue practice" as the primary or co-primary action once practice data exists.
- Prefer a small `PracticeDashboardCard` or `PracticeSummaryStrip` under `src/components/practice` and render it from `StudentDashboardPage` if dashboard needs more than one CTA.
- Keep dashboard data source simple: use `usePracticeOverviewQuery` and show the active subject/lesson, streak, daily goal progress, and mistakes count. Do not fold practice into old static `mockDashboard.ts` except as a temporary fallback value.

Parent report integration:

- Extend `src/types/parentReport.ts` with an optional `practiceSummary` field instead of creating a separate parent report type.
- Add a parent report component such as `src/components/parent/ParentReportPracticeSummary.tsx` or reuse `src/components/practice/PracticeProgressSummary.tsx` if the copy can remain parent-safe.
- Update `ChildReportPage` and/or `ParentMonthlyReportPage` to render calm practice summary data: lessons completed, minutes practiced, recent mistakes reviewed, subjects practiced, and next recommended practice.
- Backend/demo endpoint `GET /parents/me/children/{child_id}/report` can include `practiceSummary`; frontend types should tolerate absence so older backend responses keep working.

## Proposed Module Map

Create:

```text
src/types/practice.ts
  PracticeSubject
  PracticePath
  PracticeModule
  PracticeLesson
  PracticeChallenge
  PracticeChallengeOption
  PracticeAttempt
  PracticeAnswerSubmission
  PracticeAnswerResult
  PracticeLessonResult
  PracticeMistake
  PracticeOverview
  PracticeParentSummary
  PracticeAssistantHintRequest
  PracticeTeacherEscalationContext

src/data/mockPractice.ts
  Mathematics and Physics subjects.
  Demo paths, lessons, challenge data, attempts, results, daily goal, streak, and mistakes.
  Small in-memory helpers only if needed for fallback mutation behavior.

src/services/practice/practiceApi.ts
  getPracticeOverview()
  getPracticeSubjectPath(subjectId)
  getPracticeLesson(lessonId)
  submitPracticeAnswer(lessonId, payload)
  completePracticeLesson(lessonId, payload)
  getPracticeMistakes()
  getPracticeAssistantHint(payload)
  requestPracticeTeacherHelp(payload)

src/services/practice/practiceQueryKeys.ts
  all
  overview
  subjectPath(subjectId)
  lesson(lessonId)
  mistakes
  result(lessonId)

src/hooks/practice/usePracticeOverviewQuery.ts
src/hooks/practice/usePracticeSubjectPathQuery.ts
src/hooks/practice/usePracticeLessonQuery.ts
src/hooks/practice/useSubmitPracticeAnswerMutation.ts
src/hooks/practice/useCompletePracticeLessonMutation.ts
src/hooks/practice/usePracticeMistakesQuery.ts
src/hooks/practice/usePracticeAssistantHintMutation.ts
src/hooks/practice/usePracticeTeacherHelpMutation.ts

src/components/practice/PracticeOverviewCard.tsx
src/components/practice/PracticeSubjectCard.tsx
src/components/practice/PracticePathMap.tsx
src/components/practice/PracticeModuleSection.tsx
src/components/practice/PracticeLessonNode.tsx
src/components/practice/PracticeDailyGoalCard.tsx
src/components/practice/PracticeStreakBadge.tsx
src/components/practice/PracticeChallengeShell.tsx
src/components/practice/MultipleChoiceChallenge.tsx
src/components/practice/TextInputChallenge.tsx
src/components/practice/OrderingChallenge.tsx
src/components/practice/ExplanationChallenge.tsx
src/components/practice/PracticeProgressBar.tsx
src/components/practice/PracticeFeedbackPanel.tsx
src/components/practice/PracticeHintPanel.tsx
src/components/practice/PracticeTeacherEscalationPanel.tsx
src/components/practice/PracticeLessonSummary.tsx
src/components/practice/PracticeMistakesList.tsx
src/components/practice/PracticeParentSummary.tsx

src/pages/practice/PracticeOverviewPage.tsx
src/pages/practice/PracticeSubjectPathPage.tsx
src/pages/practice/PracticeLessonPage.tsx
src/pages/practice/PracticeLessonResultPage.tsx
src/pages/practice/PracticeMistakesPage.tsx

src/i18n/locales/en/practice.json
src/i18n/locales/de/practice.json
src/i18n/locales/fr/practice.json
src/i18n/locales/it/practice.json
```

Modify:

```text
src/app/router/AppRouter.tsx
  Import and register student Practice Path routes.

src/app/router/routeConfig.ts
  Add practice icon type, student nav item, and route metadata.

src/layouts/AppLayout.tsx
  Add icon mapping only if AppNavIcon switch requires it.

src/pages/dashboard/StudentDashboardPage.tsx
  Add practice summary card or update ContinueLearningCard input wiring.

src/components/dashboard/ContinueLearningCard.tsx
  Route primary continue action to practice when a current practice lesson exists.

src/types/parentReport.ts
  Add optional practiceSummary.

src/pages/parent/ChildReportPage.tsx
src/pages/parent/ParentMonthlyReportPage.tsx
  Render Practice Path summary if present.

src/i18n/index.ts
src/i18n/namespaces.ts
  Register practice namespace and resources.

README.md
  Add Phase 27 run/QA/API-contract notes after implementation.
```

Optional demo backend changes:

```text
backend/app/main.py
  GET  /practice/overview
  GET  /practice/subjects/{subject_id}/path
  GET  /practice/lessons/{lesson_id}
  POST /practice/lessons/{lesson_id}/answers
  POST /practice/lessons/{lesson_id}/complete
  GET  /practice/mistakes
  POST /practice/hints
  POST /practice/teacher-help

backend/app/database.py
  Only add SQLite tables if mutation persistence is required for the demo.
  Prefer simple JSON/in-memory demo state if Phase 27 is frontend/demo-only.

backend/app/seed.py
  Seed Mathematics and Physics practice attempts/results if backend persistence is added.
```

Recommended demo backend stance: implement the frontend service contract first with `withDemoFallback` and `mockPractice.ts`. Add FastAPI endpoints only if Phase 27 acceptance requires local backend smoke tests for practice answer submission and completion. If endpoints are added, keep them minimal and demo-only; do not design a production curriculum database in this phase.

## Data Flow

Overview to subject path:

```text
PracticeOverviewPage
  -> usePracticeOverviewQuery()
  -> getPracticeOverview()
  -> GET /practice/overview
  -> withDemoFallback(mockPracticeOverview)
  -> subject cards + daily goal + streak + continue lesson + mistakes entry
```

Subject path to lesson:

```text
PracticeSubjectPathPage
  -> usePracticeSubjectPathQuery(subjectId)
  -> getPracticeSubjectPath(subjectId)
  -> GET /practice/subjects/{subjectId}/path
  -> PracticePathMap renders modules and lesson nodes
  -> lesson node links to /practice/lesson/{lessonId}
```

Lesson runtime:

```text
PracticeLessonPage
  -> usePracticeLessonQuery(lessonId)
  -> local reducer/state tracks activeChallengeIndex, selectedAnswer, answerStatus, submitted answers, hint state
  -> useSubmitPracticeAnswerMutation()
  -> POST /practice/lessons/{lessonId}/answers
  -> PracticeAnswerResult returns correctness, explanation, nextStep, mistakeId if incorrect
  -> UI shows feedback, retry, hint, continue
```

Lesson completion:

```text
Last challenge completed
  -> useCompletePracticeLessonMutation()
  -> POST /practice/lessons/{lessonId}/complete
  -> invalidate overview, subject path, mistakes, parent report-compatible summaries
  -> navigate /practice/lesson/{lessonId}/result
```

Result to mistakes:

```text
PracticeLessonResultPage
  -> shows score, completed/needs-review count, daily goal/streak update, next lesson
  -> incorrect answers link to /practice/mistakes

PracticeMistakesPage
  -> usePracticeMistakesQuery()
  -> GET /practice/mistakes
  -> filters recent unresolved mistakes by subject/topic/lesson
  -> retry routes back into lesson or mistake-specific challenge mode
```

Hint-first Learning Assistant flow:

```text
Student requests hint on a challenge
  -> usePracticeAssistantHintMutation()
  -> POST /practice/hints with subject, grade, lessonId, challengeId, attemptId, studentAnswer, mistake context
  -> backend may call existing Learning Assistant harness/provider layer
  -> frontend receives provider-neutral hint text and optional suggestedNextStep
  -> frontend displays hint without exposing prompt/provider/backend details
```

Teacher escalation from practice:

```text
Student remains stuck or requests teacher support
  -> usePracticeTeacherHelpMutation()
  -> POST /practice/teacher-help with lesson/challenge/mistake context
  -> backend can create or reuse a conversation and then create a teacher-help request
  -> frontend shows same teacher-help status model as chat
```

Contract recommendation: `POST /practice/teacher-help` should return the existing `TeacherHelpRequest` shape plus optional `conversationId`. The frontend can then link to `/chat` only after the backend has created or identified the provider-neutral conversation. Do not create fake chat messages in React to simulate escalation.

## Build Order

1. Define `src/types/practice.ts`.
   - Include all page-level response types before building components.
   - Keep `PracticeChallenge` discriminated by `type`: `multiple_choice`, `text_input`, `ordering`, `explanation`.

2. Create `src/data/mockPractice.ts`.
   - Include Mathematics and Physics paths.
   - Include one complete demo journey: overview -> Mathematics path -> lesson -> result -> mistakes.
   - Include one Physics lesson to prove subject generality.

3. Build service/query boundary.
   - Add `practiceApi.ts`, `practiceQueryKeys.ts`, and hooks.
   - Use `httpClient` and `withDemoFallback`.
   - Implement fallback mutation functions carefully so answer/result state is deterministic enough for QA.

4. Add routes and navigation.
   - Register `/practice`, `/practice/:subjectId`, `/practice/lesson/:lessonId`, `/practice/lesson/:lessonId/result`, `/practice/mistakes`.
   - Add student nav metadata.

5. Build pages from outside in.
   - Overview page first.
   - Subject path page second.
   - Lesson runtime third.
   - Result and mistakes pages fourth.

6. Integrate dashboard.
   - Update `ContinueLearningCard` after `usePracticeOverviewQuery` exists.
   - Add analytics events such as `practice_overview_viewed`, `practice_lesson_started`, `practice_answer_submitted`, `practice_hint_requested`, `practice_teacher_help_requested`, and `practice_lesson_completed`.

7. Integrate parent report.
   - Add optional `practiceSummary` to report types and mock report fallback.
   - Render only when present, so older API responses do not fail.

8. Add i18n.
   - Add `practice` namespace in all four locales and register it in `i18n/index.ts` and `i18n/namespaces.ts`.
   - Keep German/French/Italian buttons short; avoid long labels inside lesson controls.

9. Add optional FastAPI endpoints.
   - Only after the frontend flow is stable.
   - Mirror the service contract and keep persistence lightweight.

10. Document and verify.
   - README Phase 27 section.
   - API contract doc if the phase creates docs.
   - Build/lint plus a targeted manual QA route sequence.

## Contract Boundaries

Frontend owns:

- Practice navigation, route-level composition, local lesson interaction state, optimistic/perceived feedback states, i18n copy, and display of provider-neutral hints/results.
- Typed contracts in `src/types/practice.ts`.
- Query cache and invalidation.
- Demo fallback data when the API is unavailable or `VITE_API_MODE=mock`.

Frontend must not own:

- Production scoring policy beyond displaying `PracticeAnswerResult`.
- Prompt construction, model/provider routing, AI safety checks, or teacher assignment logic.
- Parent/child authorization, student identity, or role enforcement.
- Production curriculum authoring, mastery algorithms, or persistent database design.

Backend/demo API owns:

- Authorization for student and parent data.
- Answer evaluation response shape for demo lessons.
- Creation of hint responses through provider-neutral Learning Assistant APIs.
- Teacher-help request creation and status.
- Optional persistence for attempts, completion, mistakes, daily goal, and streak in local demo mode.

Learning Assistant boundary:

- Use a dedicated practice hint endpoint or a backend-owned bridge into the existing chat/harness layer.
- Request payload may include `subject`, `grade`, `lessonId`, `challengeId`, `attemptId`, `studentAnswer`, `correctAnswerLabel` if safe, and `mistakeSummary`.
- Response should be provider-neutral:

```ts
type PracticeAssistantHint = {
  hintId: string
  challengeId: string
  attemptId?: string
  message: string
  nextStep?: string
  teacherEscalationSuggested?: boolean
}
```

- UI copy should frame hints as a first step and teacher help as escalation when hints remain unclear.
- Do not expose "Codex", "model", "provider", "prompt", "demo", "mock", or backend implementation language in Practice Path UI.

Teacher escalation boundary:

- Prefer `POST /practice/teacher-help` over directly calling `createTeacherHelpRequest` with a fake conversation ID.
- Backend can internally create a conversation from the practice context, then call existing teacher-help creation logic.
- Frontend displays status using existing `TeacherHelpRequest`/`TeacherHelpStatus` concepts.

Suggested API contract:

```text
GET /practice/overview
GET /practice/subjects/{subject_id}/path
GET /practice/lessons/{lesson_id}
POST /practice/lessons/{lesson_id}/answers
POST /practice/lessons/{lesson_id}/complete
GET /practice/mistakes
POST /practice/hints
POST /practice/teacher-help
```

Suggested invalidation after mutations:

```text
submit answer:
  practice.lesson(lessonId)
  practice.mistakes()

complete lesson:
  practice.overview()
  practice.subjectPath(subjectId)
  practice.lesson(lessonId)
  practice.mistakes()
  parent.childReport(childId) only if current user context or backend contract supports it
```

## Architecture Risks

### Risk 1: Over-copying the reference repo

**What goes wrong:** STOA becomes a language-learning clone with hearts, points, mascot/sound mechanics, and unrelated Next.js/server-action architecture.  
**Prevention:** Use only the structural pattern: path overview, lesson nodes, challenge runtime, completion, mistakes. Keep STOA's stack, tone, services, and education/support boundaries.

### Risk 2: Practice state split across mocks, hooks, and components

**What goes wrong:** Answer submission, progress, result, and mistakes diverge between pages, making QA flaky.  
**Prevention:** Put all fallback state transitions in `src/data/mockPractice.ts` helpers or inside `practiceApi.ts`, not scattered in pages. Pages should call hooks and render returned state.

### Risk 3: Treating demo backend as production curriculum architecture

**What goes wrong:** Phase 27 grows into database schema design, content management, mastery algorithms, or production scoring.  
**Prevention:** Keep backend endpoints optional and minimal. Use typed contracts and mock data as the main frontend architecture. Flag production curriculum/persistence as later backend work.

### Risk 4: Learning Assistant provider leakage

**What goes wrong:** Practice hint UI or services expose provider-specific names, prompt behavior, or model assumptions.  
**Prevention:** Practice calls only `/practice/hints` or backend-owned chat APIs. Response contracts contain `message`, `nextStep`, and `teacherEscalationSuggested`, not provider metadata.

### Risk 5: Teacher escalation requires a conversation ID too early

**What goes wrong:** React fabricates chat conversations to satisfy `POST /teacher-help/request`, creating inconsistent support records.  
**Prevention:** Add a practice-specific escalation endpoint that accepts practice context and lets the backend create or reuse the conversation before returning a teacher-help request.

### Risk 6: Parent report coupling breaks older API responses

**What goes wrong:** Adding practice summary to report rendering assumes the backend always returns it, causing report failures in current demo or future partial deployments.  
**Prevention:** Make `practiceSummary` optional and render it conditionally.

### Risk 7: i18n namespace drift

**What goes wrong:** Practice copy lands in `common`, hardcoded English, or only one locale.  
**Prevention:** Add a `practice` namespace across `en`, `de`, `fr`, and `it`, then register it centrally. Keep button labels short from the first pass.

### Risk 8: Lesson runtime accessibility regressions

**What goes wrong:** Card-like answer options become mouse-only or feedback is visual-only.  
**Prevention:** Answer controls must be real buttons/radio-like controls, support keyboard selection, expose selected/correct/incorrect state with text, and use `aria-live` for feedback.

## Sources

- STOA local source: `src/app/router/AppRouter.tsx`, `src/app/router/routeConfig.ts`, `src/lib/navigation.ts`.
- STOA local source: `src/pages/dashboard/StudentDashboardPage.tsx`, `src/components/dashboard/ContinueLearningCard.tsx`.
- STOA local source: `src/pages/parent/ChildReportPage.tsx`, `src/pages/parent/ParentMonthlyReportPage.tsx`, `src/types/parentReport.ts`.
- STOA local source: `src/services/chat/chatApi.ts`, `src/services/teacherHelp/teacherHelpApi.ts`, `src/hooks/chat/useTeacherHelpMutation.ts`, `src/types/teacherHelp.ts`.
- STOA local source: `src/services/demo/demoFallback.ts`, `src/services/api/httpClient.ts`, `backend/app/main.py`, `backend/app/database.py`, `backend/app/seed.py`.
- Reference repository README: `https://github.com/sanidhyy/duolingo-clone/blob/main/README.md`.
- Reference repository lesson page: `https://github.com/sanidhyy/duolingo-clone/blob/main/app/lesson/page.tsx`.
- Reference repository quiz runtime: `https://github.com/sanidhyy/duolingo-clone/blob/main/app/lesson/quiz.tsx`.
- Reference repository learn page/unit: `https://github.com/sanidhyy/duolingo-clone/blob/main/app/(main)/learn/page.tsx` and `https://github.com/sanidhyy/duolingo-clone/blob/main/app/(main)/learn/unit.tsx`.
- Reference repository schema/progress action: `https://github.com/sanidhyy/duolingo-clone/blob/main/db/schema.ts` and `https://github.com/sanidhyy/duolingo-clone/blob/main/actions/challenge-progress.ts`.
