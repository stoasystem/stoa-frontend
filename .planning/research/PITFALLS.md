# Domain Pitfalls: Phase 27 Practice Path

**Project:** STOA Frontend v1.25 / Phase 27 Practice Path
**Researched:** 2026-05-26
**Mode:** Ecosystem / reference-risk research
**Overall confidence:** HIGH for local STOA risks and reference-repo risks; MEDIUM for broader product judgment about learner motivation and parent copy tone.

## Source Repo Risks

The reference repo `sanidhyy/duolingo-clone` is useful as an interaction reference, but it is a complete Next.js language-learning clone rather than a frontend-only React/Vite feature module. GitHub API metadata showed it was updated on 2026-05-24 and pushed on 2026-05-21; README and source inspection showed Next.js App Router, Clerk auth, Drizzle/Postgres via Neon, Stripe, Bun scripts, server actions, seeded database content, audio/SVG assets, hearts, points, quests, shop, leaderboard, and admin surfaces.

### Copying Backend Stack Into STOA

**What goes wrong:** A Practice Path phase accidentally imports the clone's architecture: Next.js server actions, Clerk auth, Drizzle schema, Neon/Postgres, Stripe subscription records, Bun commands, and database seed scripts.

**Why it happens:** The clone stores practice mechanics in backend-owned tables and server actions. Its core files include `db/schema.ts`, `db/queries.ts`, `actions/challenge-progress.ts`, `actions/user-progress.ts`, and `scripts/prod.ts`.

**Consequences:** STOA would violate Phase 27's frontend/demo-only constraint, duplicate existing auth/billing/backend contracts, and create a second backend model beside the existing FastAPI demo backend and React Query service layer.

**Prevention:** Use the clone only for flow vocabulary: path, lesson, challenge, feedback, retry, summary, and practice-again. Implement STOA contracts as typed frontend/demo API wrappers under the existing service pattern, with mock fallback data and documented future backend endpoints.

### Copying Language-Learning Domain Model

**What goes wrong:** STOA ships a "course/unit/lesson" clone with Spanish-style `SELECT` and `ASSIST` prompts, flag/audio/mascot assumptions, or language-learning phrasing.

**Why it happens:** The reference seed data is explicitly language-learning content, such as Spanish vocabulary challenges with image/audio options.

**Consequences:** Practice Path stops being subject-based Mathematics/Physics active practice and feels like a repurposed language app.

**Prevention:** Rename and reshape the domain around STOA: subject, topic, practice path, lesson, challenge, attempt, hint, mistake review, and teacher-support handoff. Keep the initial content to Mathematics and Physics demo lessons.

### Visual And Cartoon Overreach

**What goes wrong:** STOA copies mascot-heavy SVGs, confetti, loud success/failure colors, shop imagery, hearts, points icons, and playful motion.

**Why it happens:** The clone's UI relies on cartoon character assets, hearts, points, audio rewards, and confetti to create the Duolingo feeling.

**Consequences:** The feature clashes with STOA's premium, calm, parent-trust-oriented brand and can make a paid tutoring/learning platform feel juvenile.

**Prevention:** Translate the mechanic, not the aesthetic. Use STOA's existing platform theme, restrained progress indicators, subject cards, quiet feedback, and teacher-support affordances. Avoid mascot assets, shop-style icons, and celebratory effects beyond a subtle completion state.

### Harsh Hearts And Punishment Mechanics

**What goes wrong:** Wrong answers reduce hearts, block progress, push upgrades, or imply the student failed.

**Why it happens:** The clone has `MAX_HEARTS`, `reduceHearts`, hearts modals, "ran out of hearts" copy, "Get Pro for unlimited hearts", and a shop loop.

**Consequences:** This conflicts with STOA's supportive learning posture, creates parent anxiety, and can make premium access feel punitive instead of valuable.

**Prevention:** If hearts are referenced at all, treat them as visual inspiration only. STOA should use attempts, hints used, practice rhythm, confidence, and "needs review" language. Premium gating should be advisory and plan-based, not punishment-based.

### Inaccessible Challenge Controls

**What goes wrong:** Challenge options are implemented as clickable `div`s with keyboard shortcuts but without native button semantics, focus behavior, ARIA state, or form grouping.

**Why it happens:** The clone's `Card` component uses `onClick` on a `div` and `useKey` shortcuts; this is visually fast but fragile for keyboard and assistive tech users.

**Consequences:** STOA would regress Phase 21 accessibility gates and make practice impossible or confusing for keyboard-only and screen-reader users.

**Prevention:** Implement options as native `button`, `radio`, `checkbox`, or form controls depending on challenge type. Preserve visible focus, disabled state, `aria-live` feedback, and non-color-only correctness indicators.

### Untestable Lesson State

**What goes wrong:** Lesson state lives in one large component with many `useState` calls, side effects, audio, routing, server mutations, and completion rules mixed together.

**Why it happens:** The clone's `Quiz` component owns active index, selected option, status, percentage, hearts, audio, confetti, route transitions, server action calls, and completion UI.

**Consequences:** STOA's lesson behavior becomes hard to unit test, hard to reset, and prone to stale progress after retries or locale changes.

**Prevention:** Extract a pure lesson reducer/state machine for answer selection, check, retry, next, hint, complete, and review. Keep rendering, API submission, analytics, and Learning Assistant handoff outside the reducer.

## STOA-Specific Pitfalls

### Scope Creep Beyond Phase 27

**What goes wrong:** Practice Path expands into leaderboards, a shop, XP economy, streak rescue, full curriculum CMS, real payment enforcement, real backend persistence, or production AI behavior.

**Why it happens:** The reference repo includes quests, shop, leaderboard, subscriptions, admin, database seed scripts, and premium prompts.

**Consequences:** Phase 27 stops being a controlled frontend/demo-backed feature and reopens backend, billing, content-management, and growth work that earlier milestones deliberately deferred.

**Prevention:** Lock Phase 27 to student practice overview, subject path, lesson, result, mistakes review, Student Dashboard entry, Parent Report summary, Learning Assistant hint handoff, mock/demo API contract, docs, and QA.

### Premium Boundary Becomes Either Too Weak Or Too Aggressive

**What goes wrong:** Practice is either visible as a free generic route with no plan positioning, or it becomes a hard upsell loop modeled after unlimited hearts.

**Why it happens:** STOA already has billing feature-access patterns, while the reference clone monetizes unlimited hearts and shop mechanics.

**Consequences:** The feature can undermine paid positioning or make premium feel like a penalty for mistakes.

**Prevention:** Keep Practice Path premium in copy and integration, but use calm gating: "included in your plan", "available with guided practice", or a pricing comparison prompt only where access is genuinely unavailable. Do not gate single wrong answers.

### Direct-Answer AI Behavior From Practice Mistakes

**What goes wrong:** A wrong answer sends the problem to the Learning Assistant and the assistant gives the final answer first.

**Why it happens:** Practice components often know the correct option, and Phase 26 explicitly hardened guided answer behavior because direct-answer-first responses are a known risk.

**Consequences:** Students can bypass active practice, and the feature becomes answer reveal rather than learning.

**Prevention:** The handoff payload should send challenge context, student's attempt, misconception tag, and a "hint-first" intent. The UI should offer "Get a hint" before "show solution", and teacher support should remain the escalation path for repeated confusion.

### Missing Route Integration

**What goes wrong:** Practice pages exist but are unreachable from `AppRouter`, absent from `routeConfig`, missing from student navigation/mobile navigation, or not reflected in route metadata and breadcrumbs.

**Why it happens:** STOA's route inventory and navigation are manually maintained across `src/app/router/AppRouter.tsx`, `routeConfig.ts`, route groups, layouts, and E2E expectations.

**Consequences:** Demo reviewers cannot find Practice Path, protected-route behavior may be inconsistent, and sidebar active states can regress.

**Prevention:** Add route registration, route metadata, student nav item, dashboard CTA, mobile behavior, breadcrumbs, and not-found/protected behavior in the same phase slice as the first visible practice page.

### Stale Mock Progress

**What goes wrong:** Dashboard, path page, lesson, result, mistakes review, and parent report show inconsistent progress numbers or dates.

**Why it happens:** STOA already has multiple mock data sources for dashboard, parent report, learning intelligence, billing, and demo backend fallback.

**Consequences:** The demo looks unreliable: a lesson can be complete in one place, "continue" elsewhere, and absent from parent reporting.

**Prevention:** Create one typed Practice Path mock dataset and derive dashboard, parent report, lesson progress, mistakes, and completion summaries from it. Avoid hand-entering the same progress in several files.

### Demo Backend Drift

**What goes wrong:** Frontend mock data, local FastAPI demo endpoints, docs, and React Query query keys diverge.

**Why it happens:** The current demo API contract is explicit, but Phase 27 adds a new mini-domain with several endpoints: subjects, paths, lessons, answer submission, completion, mistakes, and parent summaries.

**Consequences:** `VITE_API_MODE` behavior becomes inconsistent; local demo works while API-backed mode fails, or docs promise endpoints the frontend does not call.

**Prevention:** Add practice endpoints to `docs/demo-backend/demo-api-contract.md` and implement matching demo fallback shapes. Use stable query keys such as `['practice', 'subjects']`, `['practice', subjectId, 'path']`, and `['practice', 'lesson', lessonId]`.

### Four-Language Label Overflow

**What goes wrong:** German, French, and Italian labels overflow challenge buttons, footer actions, progress cards, path nodes, and parent report summaries.

**Why it happens:** Current i18n namespaces are manually imported in `src/i18n/index.ts`; adding a new namespace requires updates for all four languages. German and French already need wider button/layout rules in `localeLayout.ts`.

**Consequences:** Practice controls become clipped or visually unstable on mobile, especially for labels like "Review mistakes", "Ask a teacher", "Continue practice", and subject-specific summaries.

**Prevention:** Add a dedicated `practice` namespace for `en`, `de`, `fr`, and `it`; import it into `index.ts`; add it to `namespaces.ts`; and QA mobile widths for the longest CTA in each language. Prefer compact action text and responsive wrapping over smaller viewport-scaled fonts.

### Parent Anxiety Language

**What goes wrong:** Parent-facing practice summaries use alarmist language: "failed", "lost hearts", "behind", "weak", "risk", or "wrong too often".

**Why it happens:** Duolingo-style systems surface streaks, errors, hearts, and ranking pressure; parent reports can amplify those signals.

**Consequences:** Parents may read practice as surveillance or crisis reporting rather than supportive insight.

**Prevention:** Use calm, pattern-based language: "needs review", "practiced twice", "hint helped", "ready for a short teacher check", "next useful topic". Show effort and support options, not punishment.

### Provider-Specific Or AI-Internal Leakage

**What goes wrong:** Practice hint flows mention Codex, provider names, prompt rules, demo harnesses, or model behavior.

**Why it happens:** Phase 25 and Phase 26 built a local provider harness behind the backend; Practice Path will naturally touch the Learning Assistant.

**Consequences:** STOA violates provider-agnostic frontend boundaries and exposes internal demo/testing details to students or parents.

**Prevention:** Frontend copy should say "Learning Assistant" and "teacher support" only. API payloads should call STOA backend/demo endpoints, never model-provider APIs.

### Build And Lint Risk

**What goes wrong:** A large feature lands with new route files, challenge components, namespace imports, data types, and tests, but build/lint fails because of unused imports, missing locale keys, incorrect React Router paths, or stale TypeScript types.

**Why it happens:** Phase 27 touches cross-cutting files that are easy to miss: route tables, navigation labels, i18n resource imports, demo data, services, hooks, parent report components, and E2E tests.

**Consequences:** The feature can appear visually complete while `npm run build`, `npm run lint`, or Playwright smoke checks fail.

**Prevention:** Keep commits phase-sized, run build/lint after route/i18n/service integration, and include E2E coverage for student practice entry, lesson attempt, hint request, result page, mistakes review, and parent report summary.

## Prevention Strategy

1. **Reference Audit Gate**
   - Document which mechanics are adopted: path, active lesson, challenge attempt, retry, hint, summary, mistake review.
   - Document which mechanics are rejected: Clerk, Drizzle, Neon, Stripe, Bun, Next.js server actions, shop, leaderboard, harsh hearts, mascot assets, audio rewards, confetti-heavy completion.

2. **STOA Domain Contract**
   - Define typed frontend/demo API models before building screens.
   - Use subject-based entities: `PracticeSubject`, `PracticePath`, `PracticeLesson`, `PracticeChallenge`, `PracticeAttempt`, `PracticeMistake`, and `PracticeSummary`.
   - Include Mathematics and Physics seed data only for the initial demo.

3. **Calm Premium Product Language**
   - Position Practice Path as premium guided practice, not a game economy.
   - Keep parent reporting focused on effort, patterns, and next support.
   - Avoid public labels that imply punishment or child failure.

4. **Accessible Challenge System**
   - Build challenge primitives around native controls and visible focus.
   - Support mouse, touch, keyboard, and screen-reader flows.
   - Announce correctness and hints with `aria-live`; do not rely on color alone.

5. **Testable Lesson State**
   - Build a pure reducer/state machine before page wiring.
   - Test reducer transitions for select/check/wrong/retry/correct/next/hint/complete/reset.
   - Keep API mutations and navigation as effects around the reducer.

6. **Single Practice Data Source**
   - Keep one canonical mock dataset for practice progress.
   - Derive dashboard CTA, path status, lesson summary, mistakes review, and parent report widgets from that dataset.
   - Add demo backend fixtures from the same contract to reduce frontend/backend drift.

7. **Four-Language Implementation Discipline**
   - Add all practice copy in all four locales in the same change.
   - Test German/French/Italian mobile layouts early, especially sticky footers and answer buttons.
   - Use locale-specific short labels where actions must fit compact controls.

## Phase Placement Recommendations

1. **Phase 27.1: Reference Audit And Scope Lock**
   - Finish before implementation.
   - Output should explicitly reject backend stack copying, shop/leaderboard scope, direct clone visuals, and punitive hearts.

2. **Phase 27.2: Practice Contract, Mock Data, And State Model**
   - Build typed models, canonical mock data, query keys, and lesson reducer first.
   - This prevents stale mock progress and untestable lesson state.

3. **Phase 27.3: Student Route And Navigation Integration**
   - Add protected student routes, route metadata, nav entry, dashboard Continue Practice CTA, subject overview, path page, lesson page, result page, and mistakes review.
   - Do not leave Practice Path as an orphan route.

4. **Phase 27.4: Learning Assistant And Teacher-Support Handoff**
   - Add hint-first handoff only after challenge state is stable.
   - Preserve provider-agnostic copy and API boundaries.

5. **Phase 27.5: Parent Report Integration**
   - Add parent-facing practice summary after student practice data is coherent.
   - Use calm, non-anxious wording and avoid punishment metrics.

6. **Phase 27.6: Four-Language, Accessibility, And Build QA**
   - Treat i18n, keyboard/screen-reader behavior, and build/lint/E2E as release blockers, not polish.

## QA Implications

### Required Functional Checks

| Area | Check |
|------|-------|
| Route integration | `/practice`, subject path, lesson, result, and mistakes review are protected student routes and reachable from dashboard/nav. |
| Dashboard CTA | Continue Practice links to the active lesson or next recommended practice state, not always the same stale page. |
| Parent report | Parent summary uses the same practice dataset and avoids alarmist labels. |
| Demo API fallback | Mock mode, demo backend mode, and documented contracts return matching shapes. |
| Premium boundary | Practice is presented as premium without blocking progress after a wrong answer. |
| Hint handoff | Learning Assistant receives hint-first context and does not reveal the final answer first. |
| Teacher support | Repeated confusion or "still stuck" path escalates to existing teacher-support patterns. |

### Required Accessibility Checks

| Area | Check |
|------|-------|
| Answer options | Every answer is reachable and operable by keyboard with visible focus. |
| Challenge grouping | Multiple-choice and ordering controls have clear labels/instructions. |
| Feedback | Correct/wrong/hint feedback is announced and not color-only. |
| Sticky footer | Check/Next/Retry controls remain reachable on mobile and do not cover content. |
| Motion/audio | No required audio cue; celebratory motion is absent or minimal and nonessential. |

### Required Locale Checks

| Language | Risk To Check |
|----------|---------------|
| English | Calm premium tone; no "game economy" leakage. |
| German | Long labels in buttons, path cards, sticky footers, and parent summaries. |
| French | Apostrophes and longer CTA phrases in compact challenge controls. |
| Italian | Warm but concise action labels; no overflow in lesson/result pages. |

### Required Automation

- `npm run build` after route, i18n, type, and service integration.
- `npm run lint` after component and hook work.
- Playwright student smoke: login, dashboard Practice CTA, start lesson, answer wrong, request hint, retry, answer correct, complete lesson, view mistakes.
- Playwright parent smoke: login, open child report, verify practice summary and non-anxious copy.
- Reducer/unit-level tests if a test runner is available in the phase; otherwise document reducer transition cases in QA and add them to the testing backlog.

## Sources

- Reference repo metadata and source, inspected 2026-05-26: https://github.com/sanidhyy/duolingo-clone
- Reference README, package, schema, queries, actions, quiz, challenge, footer, hearts modal, practice modal, constants, and seed script from `sanidhyy/duolingo-clone`.
- Local STOA context: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md`.
- Local STOA routing/i18n/demo/test context: `src/app/router/AppRouter.tsx`, `src/app/router/routeConfig.ts`, `src/i18n/index.ts`, `src/i18n/namespaces.ts`, `src/i18n/languages.ts`, `src/lib/localeLayout.ts`, `docs/demo-backend/demo-api-contract.md`, `tests/e2e/student-chat.spec.ts`, `tests/e2e/parent-dashboard.spec.ts`.
