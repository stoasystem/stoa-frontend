# Research: FEATURES for v1.25 Phase 27 Practice Path

**Project:** STOA Frontend
**Phase:** v1.25 / Phase 27 Practice Path
**Researched:** 2026-05-26
**Mode:** Ecosystem/reference feature audit
**Overall confidence:** MEDIUM-HIGH. Reference repo behavior was verified from README, schema, query, route, and component source files. STOA integration implications are based on current `.planning/PROJECT.md`, `.planning/ROADMAP.md`, and existing dashboard/parent report surfaces.

## Source Repo Signals

Reference: `sanidhyy/duolingo-clone` (`https://github.com/sanidhyy/duolingo-clone`)

The reference project is a Next.js language-learning clone, so STOA should adapt learning mechanics only. Do not copy its stack, auth, database, subscription, shop, leaderboard, mascot, audio/flag assets, route structure, or product framing.

Verified feature signals:

- **Content hierarchy:** `db/schema.ts` models `courses -> units -> lessons -> challenges -> challengeOptions`, with `challengeProgress` per user/challenge and `userProgress` holding `activeCourseId`, `hearts`, and `points`.
- **Course selection:** `/courses` lists course cards, marks the active course, and calls `upsertUserProgress(courseId)` to set `activeCourseId`; returning to the active course routes the learner to `/learn`.
- **Learning path:** `/learn` loads user progress, active course progress, lesson percentage, units, and subscription status. It redirects to course selection if no active course exists.
- **Units and nodes:** `Unit` renders a `UnitBanner` plus ordered `LessonButton` nodes. Each lesson is either completed, current, or locked. Current nodes show a circular progress indicator using the active lesson percentage.
- **Node progression:** `getCourseProgress()` finds the first lesson with an incomplete challenge and treats it as the active lesson. Later lessons remain locked until prior challenge completion.
- **Lesson player:** `Quiz` starts at the first incomplete challenge, tracks `selectedOption`, `status` (`none`, `wrong`, `correct`), `percentage`, `hearts`, and active challenge index.
- **Challenge types:** The reference only implements `SELECT` and `ASSIST`. Both are option-based; `ASSIST` changes layout/prompt framing rather than creating an open-ended hint system.
- **Feedback loop:** Correct answers call `upsertChallengeProgress()`, play correct feedback, mark status `correct`, and increment lesson percentage. Incorrect answers call `reduceHearts()`, set status `wrong`, and allow retry through the footer.
- **Attempts/hearts:** `MAX_HEARTS = 5`; wrong answers reduce hearts unless the challenge is already completed/practice or the user has an active subscription. Zero hearts opens a hearts modal.
- **Practice replay:** Completed lessons can be practiced again. Practice mode does not lose hearts/points and can restore a heart while still adding points.
- **Progress points:** Correct first-time answers add 10 points. Practice answers also add 10 points and can restore hearts.
- **Quests:** `QUESTS` are fixed point milestones (`20`, `50`, `100`, `250`, `500`, `1000` XP) rendered as progress bars. The source does not appear to implement true daily resets.
- **Result summary:** Lesson completion shows a celebratory summary with total XP and hearts left plus a continue/practice-again path.
- **Not present in source:** No math/physics subject model, hint-first tutor behavior, free-text math answer checking, ordering/explanation challenge types, mistakes-review page, streak persistence, parent report integration, dashboard integration, or multilingual education copy layer.

## Table Stakes

Features Phase 27 should include for a credible STOA Practice Path demo. Missing these would make the flow feel incomplete.

| Feature | STOA Adaptation | Complexity | Requirement Implication |
|---------|-----------------|------------|-------------------------|
| Subject selection | Replace language courses with Mathematics and Physics subject cards. Persist active subject in practice state/API. | Low | Add practice subject overview route and typed subject payloads. |
| Unit path | Group each subject into ordered units such as Algebra foundations, Linear functions, Motion, Forces. | Medium | Demo data must contain subject, unit, order, title, description, and visible progress state. |
| Lesson nodes | Show current/completed/locked lesson nodes with an accessible progress indicator. | Medium | Use STOA visual system, not Duolingo mascot/green path styling. Node state must be deterministic from mock/demo data. |
| Continue practice | Student Dashboard should surface the active subject, next lesson, progress percentage, and last practice result. | Low-Medium | Replace or extend the existing `ContinueLearningCard` with Practice Path CTA while preserving chat entry. |
| Lesson session | A focused lesson route should present one challenge at a time with progress bar, attempts left, check/continue/retry controls, and exit confirmation. | Medium | Needs lesson state machine: `idle -> answeredCorrect/answeredIncorrect -> next/completed`. |
| Challenge types | MVP should include multiple choice, numeric/text input, ordering, and short explanation prompts. | Medium-High | Source repo has only option-based `SELECT`/`ASSIST`; STOA needs subject-appropriate challenge schemas. |
| Correct/incorrect feedback | Immediate feedback with calm language, correct answer reveal only after attempt/hint rules, and next-step copy. | Medium | Avoid punitive language; feedback must be localized EN/DE/FR/IT. |
| Attempts | Adapt hearts into attempts for a lesson/session, not emotional hearts or paid scarcity. | Low-Medium | Use labels like "Attempts left" or "Try again" and never upsell unlimited attempts in Phase 27. |
| Progress points | Adapt XP into progress points tied to practice completion and dashboard/report summaries. | Low | Points are a motivational metric, not leaderboard currency. |
| Daily goal | Adapt quests into a daily learning goal such as "Complete 2 practice lessons" or "Earn 30 progress points". | Medium | Implement as local/demo progress for Phase 27; do not imply production habit tracking if backend is mock/demo. |
| Result summary | After lesson completion show accuracy, points earned, attempts used, mistakes to review, and next recommendation. | Medium | Summary should route to subject path, mistakes review, dashboard, or Learning Assistant. |
| Mistakes review entry | Capture incorrect challenge IDs and expose a review flow after completion. | Medium | Source lacks this; STOA should add it because it directly supports learning outcomes and parent visibility. |
| Parent report summary | Parent report should summarize subject practiced, lessons completed, accuracy, effort, recent mistakes, and support moments. | Medium | Extend parent report data contract with practice summary fields or add a practice summary subsection fed by mock/demo API. |
| Four-language UI | Practice copy must exist in English, German, French, and Italian with short button labels. | Medium | Add practice namespace/copy matrix and verify German/French/Italian button fit. |

## STOA Differentiators

Features STOA should actively adapt because they fit the product strategy better than a straight clone.

| Differentiator | Why It Matters | Implementation Direction |
|----------------|----------------|--------------------------|
| Subject-based active practice | STOA is a Mathematics/Physics learning platform, not a language-learning app. | Build subject paths and challenge content around demo lessons, formulas, units, reasoning, and conceptual understanding. |
| Hint-first Learning Assistant handoff | Phase 25/26 already established guided, grade-scoped, no-direct-answer-first behavior. | From an incorrect answer, offer "Show a hint" before "Explain with STOA"; send challenge context to backend chat/assistant contract without exposing provider details. |
| Teacher-support escalation from mistakes | STOA's current value proposition includes professional teacher support when confusion persists. | Add escalation CTA after repeated incorrect attempts or low-confidence result summary; connect to existing teacher-help flow, not a new support channel. |
| Attempts instead of hearts | Hearts are emotionally loaded and tied to monetization in the reference. STOA should be calm, premium, and parent-trustworthy. | Use neutral attempts/session guidance. Do not block learning with scarcity in the demo. |
| Daily learning goals instead of quests | Quests are useful as progress framing, but STOA should avoid game-first language. | Use "Today's practice goal", "Progress points", and "Practice routine" instead of quests/XP-heavy copy. |
| Mistakes review as a learning loop | Reference retry is local to a challenge; STOA needs a durable learning signal. | Store incorrect challenge attempts and show review cards with hint, solution steps, and teacher-support option. |
| Dashboard integration | Practice Path should become the next action for students, not a detached mini-game. | Dashboard card should show "Continue Practice", active subject, next lesson, daily goal progress, and recent mistakes. |
| Parent reporting | Parents care about consistency, confidence, and where help is needed. | Parent weekly/monthly report should summarize effort, accuracy, topics practiced, common mistakes, and support escalation without over-gamified rankings. |
| Premium multilingual copy | Phase 16-20 established four-language product quality. | All Practice Path labels need localized product-safe phrasing; avoid "XP", "hearts", "quests", "game over", and childlike mascot tone. |
| STOA result summary | The source result screen celebrates completion but is shallow. | Summarize what improved, what to review, which hint helped, and the next recommended lesson. |

## Deferred/Future

Useful later, but not necessary for Phase 27's credible demo slice.

| Feature | Defer Reason | Future Direction |
|---------|--------------|------------------|
| True streak engine | Requires date-aware persistence, reset rules, timezone handling, and parent-safe habit language. | Add after backend-owned practice history exists. |
| Adaptive sequencing | Needs enough real performance data to avoid fake personalization. | Use later to reorder review lessons based on mistakes and confidence. |
| Full spaced repetition | Valuable, but larger than a demo path. | Add review queues by topic and forgetting interval once practice attempts are stored. |
| Leaderboards | Misaligned with STOA's calm premium parent/student positioning. | If ever used, restrict to private self-progress, not public ranking. |
| Shop/rewards economy | Reference shop/hearts/pro upsell is not aligned with Phase 27. | Keep subscription messaging outside the practice mechanics. |
| Audio/image language assets | Reference relies on language-learning media. | For STOA, use diagrams, formulas, graphs, units, and worked-step visuals later. |
| Full content authoring UI | Phase 27 can use typed mock/demo data. | Later add backend/admin curriculum content management. |
| Formal grading engine | Math/physics open-answer checking can become complex. | MVP can use deterministic answer keys/tolerance; defer symbolic algebra and rich proof checking. |
| Advanced analytics dashboards | Parent summary is enough for Phase 27. | Later connect practice history to learning profile, weak-point diagnosis, and organization reports. |

## Anti-Features

Features to explicitly avoid in Phase 27.

| Anti-Feature | Why Avoid | What To Do Instead |
|--------------|-----------|--------------------|
| Copying Duolingo clone code or structure | STOA uses React + TypeScript + Vite, existing routes/services/i18n, and a different product domain. | Use the repo only as behavior inspiration. Implement in STOA patterns. |
| Language-course framing | Misrepresents STOA Mathematics/Physics demo scope. | Use subjects, units, lessons, topics, and practice challenges. |
| Hearts as emotional scarcity | Can feel punitive and clashes with parent-trust positioning. | Use neutral attempts with supportive retry/hint language. |
| Paid unlimited attempts | Phase 27 should not create a monetized failure mechanic. | Keep premium four-language UI independent from practice attempt count. |
| Leaderboards/public ranking | Adds pressure and distracts from mastery. | Use personal progress, daily goal progress, and parent-visible effort. |
| Shop/currency/reward store | Unnecessary and over-gamified for the current roadmap. | Use progress points only as lightweight completion feedback. |
| Mascot-heavy game tone | Conflicts with STOA's premium, brand-aligned learning platform. | Use restrained STOA visual design and supportive copy. |
| Direct final-answer reveal on wrong attempts | Conflicts with Phase 25/26 hint-first Learning Assistant behavior. | Offer hints, guided explanation, retry, then summary. |
| Frontend provider logic | Existing constraints prohibit frontend coupling to AI providers. | Practice pages call STOA APIs; backend/harness owns assistant behavior. |
| Production-grade curriculum/backend claims | Phase 27 is frontend/demo-backed. | Label internally as mock/demo API support and document future backend contract. |
| Anxiety-inducing streak loss | Can make learning feel punitive and requires robust date logic. | Defer streaks or show gentle routine indicators without loss framing. |

## Requirement Implications

Recommended Phase 27 requirement categories:

1. **Reference Audit and Scope Boundary**
   - Document source repo mechanics and explicitly state non-copy boundaries.
   - Confirm STOA adapts mechanics only: course selection -> subject selection, hearts -> attempts, quests -> daily goals, XP -> progress points.

2. **Practice Data and API Contract**
   - Define `PracticeSubject`, `PracticeUnit`, `PracticeLessonNode`, `PracticeChallenge`, `PracticeAttempt`, `PracticeResult`, `PracticeMistake`, and `PracticeDailyGoal`.
   - Add mock/demo endpoints or service fallbacks for subjects, subject path, lesson detail, answer submission, lesson completion, mistakes review, dashboard summary, and parent report summary.
   - Ensure answer submission supports multiple choice, text/numeric input, ordering, and explanation challenges with deterministic demo evaluation.

3. **Student Practice Surfaces**
   - Add subject overview, subject path, lesson player, result summary, and mistakes-review page.
   - Lesson player must include progress bar, attempts left, selected answer state, correct/incorrect feedback, retry, hint, and completion summary.
   - Result summary must show accuracy, points, attempts used, mistakes count, next lesson, and Learning Assistant/teacher support actions.

4. **Learning Assistant and Teacher Support Integration**
   - Incorrect answers should offer hint-first guidance before final explanation.
   - Repeated misses or "still confused" actions should route into existing teacher-support escalation.
   - Assistant handoff payload should include subject, topic, lesson, challenge, student answer, correct answer metadata, and previous hints, while preserving provider boundaries.

5. **Dashboard and Parent Reporting**
   - Student Dashboard should include Continue Practice, active subject, next lesson, daily goal progress, streak/routine placeholder if used, and recent mistakes.
   - Parent weekly/monthly report should include practice summary: lessons completed, accuracy, effort/points, topics practiced, recent mistakes, and support recommendations.
   - Parent copy should emphasize consistency, understanding, and next actions rather than game performance.

6. **Localization and Visual QA**
   - Add EN/DE/FR/IT practice copy for P0 labels, feedback, hints, attempts, daily goal, result summary, mistakes review, dashboard, and parent report.
   - German/French/Italian buttons must use short labels and responsive layouts.
   - UI should follow existing STOA premium/platform styling, not the reference's bright game identity.

7. **QA and Verification**
   - Route smoke: subject overview, Mathematics path, Physics path, lesson player, result summary, mistakes review, dashboard card, parent report summary.
   - Behavior smoke: correct answer, incorrect answer, retry, hint, attempts exhausted, lesson complete, practice replay, daily goal progress, teacher-support escalation.
   - i18n smoke: EN/DE/FR/IT for lesson controls and parent/dashboard summary.
   - Boundary checks: no provider/debug wording, no Duolingo/source repo branding, no hearts/shop/leaderboard language.

Recommended MVP ordering:

1. Define contracts and demo data first; all pages depend on stable subject/unit/lesson/challenge/result shapes.
2. Build student subject path and lesson player next; this is the core active practice loop.
3. Add result summary and mistakes review; these make practice educational rather than just quiz-like.
4. Integrate Learning Assistant/teacher support from mistakes; this is STOA's main differentiator.
5. Add dashboard and parent report summaries last; they should consume practice state rather than invent separate data.

Sources:

- Reference README and folder map: `https://github.com/sanidhyy/duolingo-clone`
- Reference schema: `https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/db/schema.ts`
- Reference learning path: `https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/app/%28main%29/learn/page.tsx`
- Reference unit/node components: `https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/app/%28main%29/learn/unit.tsx`, `https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/app/%28main%29/learn/lesson-button.tsx`
- Reference lesson player: `https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/app/lesson/quiz.tsx`
- Reference feedback/actions: `https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/actions/challenge-progress.ts`, `https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/actions/user-progress.ts`
- Reference quests/constants: `https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/components/quests.tsx`, `https://raw.githubusercontent.com/sanidhyy/duolingo-clone/main/constants.ts`
- Local STOA planning context: `.planning/PROJECT.md`, `.planning/ROADMAP.md`
- Existing STOA integration surfaces: `src/pages/dashboard/StudentDashboardPage.tsx`, `src/components/dashboard/ContinueLearningCard.tsx`, `src/pages/parent/ChildReportPage.tsx`, `src/components/parent/ParentReportSummaryCard.tsx`
