# Research Summary: v1.25 Phase 27 Practice Path

**Project:** STOA Frontend
**Milestone:** v1.25 Phase 27: Duolingo-Style Learning Quest Integration and Practice Flow Design
**Researched:** 2026-05-26
**Confidence:** HIGH for STOA stack and architecture fit; MEDIUM-HIGH for feature recommendations; MEDIUM for motivational/product-tone judgments

## Executive Summary

Phase 27 should introduce a STOA-native Practice Path: a calm, premium, subject-based active practice flow for Mathematics and Physics. The `sanidhyy/duolingo-clone` repo is useful only as a mechanism reference for path progression, current lesson selection, challenge attempts, immediate feedback, retry, completion summary, and practice-again loops. It must not be treated as a product, visual, backend, auth, billing, or stack template.

The recommended implementation is a React/Vite frontend slice using STOA's existing routes, protected student layout, service/query layer, demo fallback pattern, i18n system, dashboard, parent report, Learning Assistant, and teacher-support boundaries. Define typed practice contracts and one canonical mock dataset first, then build student routes, lesson runtime, result/mistakes review, and integration surfaces from those contracts.

The main risks are over-copying the clone's Next.js/Clerk/Drizzle/Stripe stack, importing juvenile or punitive game mechanics, splitting mock progress across pages, and leaking AI/provider internals through practice hints. Mitigate by locking scope early, using neutral attempts instead of hearts, deriving all summaries from one practice dataset, keeping hints backend-mediated and hint-first, and making accessibility/i18n QA release blockers.

## Source Repo Signals

- Useful mechanics: course/subject selection, ordered units and lessons, current lesson from first incomplete challenge, lesson node states, one-challenge-at-a-time runtime, answer feedback, retry, completion summary, and practice replay.
- Useful data shape: course -> unit -> lesson -> challenge -> options -> challenge progress -> user progress, translated for STOA as subject -> module/path -> lesson -> challenge -> attempt/result/mistake.
- Useful UI decomposition: path overview, lesson node, lesson shell, progress header, challenge options, feedback footer, result screen.
- Reject: Next.js App Router, server actions, Clerk, Neon/Postgres, Drizzle, Stripe, Bun workflow, React Admin, mascot/audio/flag assets, shop, leaderboard, hearts, gems, confetti-heavy celebration, and subscription-as-game-advantage.

## Stack Additions / Non-Additions

**Use existing STOA stack:**
- React + TypeScript + Vite for the feature surface.
- React Router route registration under the authenticated student area.
- TanStack Query for overview, path, lesson, submit-answer, complete-lesson, mistakes, dashboard, and parent-report summaries.
- Existing `httpClient` plus `withDemoFallback` for backend-ready service contracts.
- Tailwind/shared UI primitives/lucide/sonner for premium, restrained interface states.
- Existing i18n system with a new `practice` namespace for EN/DE/FR/IT.
- Existing Playwright flow coverage, extended for practice and parent-report smoke checks.

**Add only if needed:**
- `src/types/practice.ts`, `src/data/mockPractice.ts`, `src/services/practice/*`, `src/hooks/practice/*`, `src/components/practice/*`, and `src/pages/practice/*`.
- Optional MSW or minimal FastAPI demo endpoints only if QA requires API-level practice submission/completion; keep them demo-only and contract-identical.

**Do not add:**
- Next.js, Clerk, Drizzle, Neon/Postgres, Stripe, Bun-only scripts, React Admin, new production backend architecture, direct frontend AI provider calls, `react-confetti`, `react-circular-progressbar`, shop/rewards economy, leaderboards, hearts/lives scarcity, or production adaptive-learning claims.

## Feature Table Stakes

- Subject overview for Mathematics and Physics with continue-practice entry.
- Subject path with ordered units/modules, lesson nodes, completed/current/locked states, and accessible progress indicators.
- Lesson runtime with progress bar, attempts left, answer selection/input, check/retry/continue controls, exit handling, and deterministic state transitions.
- Challenge types for a credible STOA demo: multiple choice, numeric/text input, ordering, and short explanation.
- Immediate correct/incorrect feedback with calm copy, retry, hint-first support, and no direct final-answer-first behavior.
- Result summary with accuracy, progress points, attempts used, mistakes count, next lesson, review action, and support actions.
- Mistakes review page that records incorrect attempts and routes to hint, retry, solution steps, or teacher support.
- Student Dashboard Continue Practice card/strip driven by practice overview data.
- Parent report practice summary with lessons completed, effort, accuracy, topics practiced, recent mistakes, and next supportive action.
- Four-language UI copy for all visible practice, feedback, dashboard, and parent-report surfaces.

## STOA Differentiators

- Subject-based practice, not language courses: Mathematics and Physics content, school topics, formulas, units, reasoning, and conceptual checks.
- Hint-first Learning Assistant handoff: incorrect answers offer guided help through STOA backend APIs without provider names or prompt details.
- Teacher-support escalation: repeated confusion can route to existing teacher-help patterns with practice context.
- Attempts instead of hearts: neutral, supportive retry framing without monetized failure or emotional scarcity.
- Daily learning goals instead of quests: "Today's practice goal", routine, and progress points as calm habit framing.
- Mistakes review as a learning loop: durable review signals, hint history, and parent-safe support recommendations.
- Parent-trust tone: report effort and patterns without alarmist labels such as failed, weak, behind, or lost hearts.

## Architecture Integration Points

- Routes: add `/practice`, `/practice/:subjectId`, `/practice/lesson/:lessonId`, `/practice/lesson/:lessonId/result`, and `/practice/mistakes` under existing student `ProtectedRoute` and `RoleRoute`.
- Navigation: add a primary student nav item for Practice plus hidden metadata for detail routes; map a lucide icon such as `Route`, `Target`, or `Dumbbell`.
- Contracts: define `PracticeSubject`, `PracticePath`, `PracticeModule`, `PracticeLesson`, discriminated `PracticeChallenge`, `PracticeAttempt`, `PracticeAnswerResult`, `PracticeLessonResult`, `PracticeMistake`, `PracticeOverview`, and `PracticeParentSummary`.
- Service boundary: implement `practiceApi`, query keys, and hooks; pages must not know whether data comes from mock fallback, MSW, FastAPI, or future production endpoints.
- Lesson state: use a pure reducer/state machine for select/check/wrong/retry/correct/next/hint/complete/reset; keep API mutations and navigation as effects around it.
- Dashboard and parent reports: consume practice summary hooks/types rather than duplicating calculations in static dashboard or report mocks.
- Learning Assistant: call `/practice/hints` or a backend-owned chat bridge with subject, lesson, challenge, attempt, answer, and misconception context; render provider-neutral hint responses.
- Teacher help: prefer `POST /practice/teacher-help` so the backend can create/reuse conversations before returning the existing teacher-help request shape.
- i18n: add and register `practice` locale resources in EN/DE/FR/IT; QA long German/French/Italian labels on mobile.

## Watch-Outs / Pitfalls

- Over-copying the reference stack or product model: use mechanics only; keep STOA's architecture and domain.
- Game-tone drift: avoid mascots, loud reward loops, shops, public ranking, hearts, scarcity, and punitive copy.
- Stale mock progress: keep one canonical practice dataset and derive overview, path, lesson, result, mistakes, dashboard, and parent summaries from it.
- Untestable lesson runtime: avoid one large component with mixed state, effects, routing, and mutation logic; build a reducer first.
- Accessibility regressions: answer controls must be native buttons/forms with visible focus, keyboard support, ARIA state, and non-color-only feedback.
- AI/provider leakage: frontend copy says Learning Assistant and teacher support only; no provider, prompt, demo, mock, or model wording.
- Parent anxiety language: use "needs review", "hint helped", "ready for a short teacher check", and "next useful topic" instead of failure language.
- Demo backend drift: if endpoints are added, document and mirror exact shapes for `/practice/overview`, paths, lessons, answers, completion, mistakes, hints, and teacher-help.

## Requirement and Roadmap Implications

**Recommended phase shape:**

1. **Reference audit and scope lock** - explicitly adopt path, active lesson, challenge, retry, hint, summary, and mistake-review mechanics; explicitly reject clone stack, visuals, shop, leaderboard, hearts, and backend/product cloning.
2. **Practice contract, mock data, and lesson state model** - define typed contracts, canonical Mathematics/Physics demo data, query keys, fallback mutation behavior, and reducer transitions before UI wiring.
3. **Student route, navigation, and core practice flow** - register protected routes, add nav/dashboard entry, build overview, subject path, lesson runtime, result, and mistakes review from the service layer.
4. **Learning Assistant and teacher-support handoff** - add hint-first and stuck/escalation flows after challenge state is stable; preserve provider-agnostic backend boundaries.
5. **Dashboard and parent report integration** - surface practice as the student's next action and parent-visible learning signal once practice data is coherent.
6. **Localization, accessibility, and verification** - add all four locales, mobile label checks, keyboard/screen-reader behavior, build/lint, Playwright student practice smoke, and parent-report smoke.

**Research flags:**
- Needs deeper planning/research: Learning Assistant hint contract, teacher-help practice endpoint, optional demo backend persistence, text/numeric answer evaluation tolerance, and parent-report wording.
- Standard patterns: React routes, TanStack Query hooks, demo fallback services, typed mock data, route metadata, i18n namespace registration, dashboard card wiring, and Playwright route smoke tests.

**Acceptance should require:**
- No Duolingo/source branding, hearts, shop, leaderboard, mascot/audio dependency, provider names, prompt/debug language, or direct frontend AI calls.
- Practice routes reachable from student navigation/dashboard and protected by existing role boundaries.
- One consistent progress source across practice pages, dashboard, and parent report.
- EN/DE/FR/IT copy present with no mobile overflow in core controls.
- Build/lint plus student and parent smoke coverage.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | STOA's existing React/Vite/Query/service/i18n stack directly supports the phase; reference stack is clearly unsuitable. |
| Features | MEDIUM-HIGH | Reference mechanics are verified; STOA differentiators are strong but product-tone choices need validation in copy/design review. |
| Architecture | HIGH | Integration points are concrete in current STOA route, service, dashboard, parent-report, i18n, and teacher-help patterns. |
| Pitfalls | HIGH | Risks are grounded in the reference repo and current STOA cross-cutting files. |

**Gaps to address during planning:**
- Whether Phase 27 needs FastAPI demo endpoints or frontend fallback is enough for acceptance.
- Exact answer-evaluation rules for numeric/text and explanation challenges.
- Whether practice teacher escalation should be a new `/practice/teacher-help` endpoint or an extension of existing teacher-help APIs.
- Final parent-facing language and premium access positioning.
- Whether a test runner is available for reducer unit tests; otherwise capture reducer cases in QA and backlog.

## Source Links

- Reference repo: https://github.com/sanidhyy/duolingo-clone
- Reference README: https://github.com/sanidhyy/duolingo-clone/blob/main/README.md
- Reference package manifest: https://github.com/sanidhyy/duolingo-clone/blob/main/package.json
- Reference schema: https://github.com/sanidhyy/duolingo-clone/blob/main/db/schema.ts
- Reference queries: https://github.com/sanidhyy/duolingo-clone/blob/main/db/queries.ts
- Reference learn page: https://github.com/sanidhyy/duolingo-clone/blob/main/app/(main)/learn/page.tsx
- Reference unit/path component: https://github.com/sanidhyy/duolingo-clone/blob/main/app/(main)/learn/unit.tsx
- Reference lesson runtime: https://github.com/sanidhyy/duolingo-clone/blob/main/app/lesson/quiz.tsx
- Reference challenge progress action: https://github.com/sanidhyy/duolingo-clone/blob/main/actions/challenge-progress.ts
- Reference user progress action: https://github.com/sanidhyy/duolingo-clone/blob/main/actions/user-progress.ts
- STOA research inputs: `.planning/research/STACK.md`, `.planning/research/FEATURES.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`

---
*Research completed: 2026-05-26*
*Ready for requirements and roadmap: yes*
