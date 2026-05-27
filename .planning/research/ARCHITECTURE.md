# Research: Phase 33 Homepage Practice Entry Architecture

**Project:** STOA Frontend
**Research dimension:** Architecture and integration
**Date:** 2026-05-27
**Confidence:** HIGH for codebase integration, MEDIUM for final copy/mobile fit until visual QA runs

## Question

How should the homepage Practice entry integrate into the existing STOA frontend architecture and route/auth flow without backend/database changes or a broad redesign?

## Executive Recommendation

Keep the Practice entry as a homepage section inside the existing public marketing flow, not as a new public route or navbar item. The current homepage already renders `HomePracticeEntry` immediately after `HomeHero`, before the broader learning flow, which matches the documented hierarchy: Practice starts learning, Learning Chat explains, teacher support escalates, and Parent Report gives visibility. Evidence: `HomePage` places `HomePracticeEntry` between `HomeHero` and `HomeLearningFlow` in `src/pages/home/HomePage.tsx:10-20`, and the IA doc explicitly says Practice should be visible on the homepage but not become a standalone public marketing island in `docs/ia/site-layout-with-practice-entry.md:14-29`.

Implement Phase 33 as a small component split plus a navigation utility:

- `HomePracticeEntry`: section-level composition only.
- `PracticeEntryCard`: copy, CTAs, and role-aware start button wiring.
- `HomePracticePreview`: visual/flow preview, extracted from the current inline signals and `HomePracticeToChatFlow`.
- `startPracticeNavigation` utility: centralizes route decisions for unauthenticated and authenticated roles.

Do not change Practice backend APIs, lesson data, database shape, or the protected route tree. The `/practice` route already exists under the student `RoleRoute` in `src/app/router/AppRouter.tsx:104-114`. Parent, tutor, and admin destinations already exist in the same protected route tree at `/parent`, `/tutor`, and `/admin` in `src/app/router/AppRouter.tsx:115-176`.

## Current Architecture Evidence

| Area | Evidence | Implication |
|------|----------|-------------|
| Homepage placement | `HomePracticeEntry` is imported and rendered after `HomeHero` in `src/pages/home/HomePage.tsx:1-20`. | Preserve this placement; avoid a redesign of the homepage order. |
| Current Practice CTA | `HomePracticeEntry` hard-codes `<Link to="/login?next=/practice">` in `src/components/home/HomePracticeEntry.tsx:27-37`. | Replace hard-coded link with the shared navigation utility so authenticated users do not get sent to login. |
| Current section shape | `HomePracticeEntry` owns section wrapper, copy, signals, CTA buttons, and preview flow in `src/components/home/HomePracticeEntry.tsx:7-77`. | Split into smaller components without changing the visual role of the section. |
| Existing Practice preview | `HomePracticeToChatFlow` maps i18n flow entries into five cards in `src/components/home/HomePracticeToChatFlow.tsx:6-40`. | Reuse or wrap it inside `HomePracticePreview`; do not rebuild the flow from scratch. |
| Protected student Practice | `/practice` and lesson routes are student-only inside `RoleRoute allowedRoles={['student']}` in `src/app/router/AppRouter.tsx:104-114`. | Start navigation must not send non-students to `/practice`, or they will hit `/forbidden`. |
| Role home routes | Defaults are `/dashboard`, `/parent`, `/tutor`, `/admin`, `/organization` in `src/app/router/routeConfig.ts:51-57` and `src/lib/authRoutes.ts:3-20`. | Use existing role-home concepts instead of adding a new routing table. |
| Login redirect behavior | `useLoginMutation` reads `?next=`, but students are currently forced to `defaultRoute` in `src/hooks/auth/useLoginMutation.ts:20-32`. | Phase 33 must adjust login success so `student + next=/practice` lands on `/practice`. |
| Existing protected redirect | Anonymous direct access to protected pages redirects to `/login` via route state in `src/app/router/ProtectedRoute.tsx:4-12`. | The homepage CTA can use query `next=/practice`; direct route access still uses state-based fallback. |
| Existing role guard | Nonmatching roles redirect to `/forbidden` in `src/app/router/RoleRoute.tsx:21-23`. | Homepage entry should proactively route parent/tutor/admin to their own homes rather than relying on forbidden. |
| i18n resources | Four language resource sets are already registered for `home` and other namespaces in `src/i18n/index.ts:58-119`. | Add/adjust copy in existing `home.json` files only; no new namespace is needed. |
| Locale layout helpers | German/French already get wider/wrapping CTA treatment in `src/lib/localeLayout.ts:29-48`. | Reuse this pattern or a local variant for Practice CTAs with long labels. |
| QA expectations | Practice entry checklist requires homepage Practice, Practice-to-Chat, parent/tutor context, and build/demo validation in `docs/qa/phase31-practice-entry-checklist.md:3-35`. | Phase 33 QA should extend this checklist rather than create unrelated criteria. |

## Recommended Component Boundaries

### `HomePracticeEntry`

Responsibility: section shell and composition.

Keep:

- `<section>` wrapper, spacing, max width, and homepage ordering.
- Wiring of `PracticeEntryCard` and `HomePracticePreview`.
- No auth logic beyond reading the current auth state and passing it down, if needed.

Avoid:

- Direct `Link to="/login?next=/practice"` hard-coding.
- Fetching Practice data.
- Duplicating the full student Practice overview.

### `PracticeEntryCard`

Responsibility: left-side copy, primary CTA, secondary CTA.

Recommended props:

```ts
type PracticeEntryCardProps = {
  title: string
  eyebrow: string
  body: string
  primaryCta: string
  secondaryCta: string
  onStartPractice: () => void
}
```

Use a button for the primary action because the destination depends on auth/role. Keep the secondary action as a static link to `/how-it-works`, matching the existing secondary CTA in `src/components/home/HomePracticeEntry.tsx:34-37`.

### `HomePracticePreview`

Responsibility: right-side explanatory preview.

Use the existing structure:

- Two signal cards currently rendered by `PracticeSignal` in `src/components/home/HomePracticeEntry.tsx:41-77`.
- Five-step flow currently rendered by `HomePracticeToChatFlow` in `src/components/home/HomePracticeToChatFlow.tsx:13-39`.

Recommended implementation: move `PracticeSignal` into `HomePracticePreview`, keep `HomePracticeToChatFlow` as-is or have `HomePracticePreview` import it. This avoids churn and keeps the Phase 31 Practice-to-Chat framing intact.

### `startPracticeNavigation`

Responsibility: single route decision for the homepage Practice CTA.

Recommended location: `src/lib/navigation.ts`, because this file already centralizes role-based navigation helpers like `getHomePathForUserRole` in `src/lib/navigation.ts:33-39`.

Recommended behavior:

```ts
export function getStartPracticePath(user: User | null): string {
  if (!user) return '/login?next=/practice'

  switch (user.role) {
    case 'student':
      return '/practice'
    case 'parent':
      return '/parent'
    case 'tutor':
      return '/tutor'
    case 'admin':
      return '/admin'
    case 'organization_admin':
    case 'school_teacher':
    case 'school_viewer':
      return '/organization'
    default:
      return '/login?next=/practice'
  }
}
```

Then expose either:

- `getStartPracticePath(user)` for `Link` usage, or
- `startPracticeNavigation({ user, navigate })` if the implementation prefers an imperative button handler.

The user request names `startPracticeNavigation`, so implement that wrapper even if it delegates to a pure `getStartPracticePath` helper. Keep the pure helper testable.

## Auth and Route Flow Recommendation

Required target behavior:

| Current user | Click homepage Practice CTA | Why |
|--------------|-----------------------------|-----|
| Unauthenticated | `/login?next=/practice` | Preserves public-to-student conversion. |
| Student | `/practice` | Student is the only role allowed to access Practice. |
| Parent | `/parent` | Avoids sending parent into a student-only route and avoids `/forbidden`. |
| Tutor | `/tutor` | Tutors should see request work, not student Practice. |
| Admin | `/admin` | Admins should see operations, not student Practice. |
| Organization roles | `/organization` | Existing app maps school/organization users to organization home. |

Critical implementation note: the current login success path blocks the requested unauthenticated flow for students. `useLoginMutation` computes `queryNext`, but if `data.user.role === 'student'`, it chooses `defaultRoute` before considering `queryNext` in `src/hooks/auth/useLoginMutation.ts:20-32`. Since `getDefaultRouteForRole('student')` returns `/dashboard` in `src/lib/authRoutes.ts:3-7`, `/login?next=/practice` currently lands a student on `/dashboard`, not `/practice`.

Recommended fix:

1. Validate `queryNext` with the existing same-origin path guard: starts with `/` and not `//`.
2. Allow student `queryNext` only for student-owned paths: `/practice`, `/practice/...`, `/chat`, `/dashboard`, `/learning-history`, `/profile`.
3. For non-students, keep using role defaults unless the `next` path belongs to that role. For this Phase 33 requirement, parent/tutor/admin should ignore `next=/practice` and use `/parent`, `/tutor`, `/admin`.

This is frontend-only and does not require backend/database changes.

## i18n and Mobile Fit

Use the existing `home` namespace. All four language files already include `practiceEntry` copy, including German and French labels in `src/i18n/locales/de/home.json:26-43` and `src/i18n/locales/fr/home.json:26-43`.

Recommended i18n structure:

```json
{
  "practiceEntry": {
    "eyebrow": "...",
    "title": "...",
    "body": "...",
    "primaryCta": "...",
    "secondaryCta": "...",
    "signals": [{ "title": "...", "body": "..." }],
    "flow": [{ "label": "...", "detail": "..." }]
  }
}
```

Mobile fit requirements:

- Keep CTA containers `flex-col` by default and only switch to row at `sm`, as the current entry already does in `src/components/home/HomePracticeEntry.tsx:27`.
- Use `whitespace-normal`, `text-center`, and a stable min-height on CTA buttons. The marketing header already uses this pattern for long CTA labels in `src/layouts/MarketingLayout.tsx:41-43`.
- Keep card content `min-w-0` and avoid fixed-width text.
- For German/French, prefer short CTA labels over shrinking font size. Existing copy already uses shorter labels: German `Lernen starten` / `Übungsweg ansehen`, French `Commencer` / `Voir le parcours`.
- If labels still wrap poorly on mobile, add a local `practiceEntry.shortPrimaryCta` and `shortSecondaryCta` rather than reducing all locales to generic copy.

No new i18n framework work is needed; `i18n/index.ts` already registers `home` resources for `en`, `de`, `fr`, and `it` in `src/i18n/index.ts:58-119`.

## Docs, QA, and Demo Updates

Keep documentation updates narrow:

- Update `docs/qa/phase31-practice-entry-checklist.md` or create a Phase 33 checklist only for the new CTA routing matrix, i18n mobile visual checks, and login redirect regression. The existing checklist already covers Practice entry, Practice-to-Chat, parent/tutor context, and build/demo in `docs/qa/phase31-practice-entry-checklist.md:3-35`.
- Update `docs/demo/practice-as-learning-chat-entry-demo.md` to mention that homepage Practice CTA sends anonymous users through login and lands student users on `/practice`. The current demo flow already frames Practice as the low-friction entry in `docs/demo/practice-as-learning-chat-entry-demo.md:3-18`.
- Update `docs/demo/current-project-demo-guide.md`, which still describes the public demo as Start Learning -> `/chat` in `docs/demo/current-project-demo-guide.md:7-17`. Phase 33 should document Practice as the homepage entry without removing Chat as the explanation destination.

Do not update backend integration docs unless a future phase changes Practice persistence or API payloads.

## Anti-Patterns to Avoid

### Sending Every User to `/practice`

Why bad: `/practice` is protected by the student-only role route in `src/app/router/AppRouter.tsx:104-114`. Parent, tutor, and admin users would hit `/forbidden` through `RoleRoute` in `src/app/router/RoleRoute.tsx:21-23`.

Instead: route by role before navigation.

### Adding Practice to the Public Navbar

Why bad: the IA guidance says public navigation should stay focused and should not add Practice as a top-level navbar item in `docs/ia/site-layout-with-practice-entry.md:14-29`.

Instead: keep Practice as a homepage section and student app nav item. Student nav already includes Practice and Learning Chat as primary items in `src/app/router/routeConfig.ts:67-97`.

### Expanding Phase 33 Into Backend Work

Why bad: the requested scope is homepage entry, route/auth flow, i18n, and docs/QA/demo. Practice data already has frontend hooks and routes; no database change is needed for the entry CTA.

Instead: keep the change frontend-only and verify with route tests or Playwright.

### Treating Practice as a Game-First Product

Why bad: existing IA and demo docs explicitly warn that Practice should not overshadow Learning Chat or teacher support. See `docs/ia/site-layout-with-practice-entry.md:42-47` and `docs/demo/practice-as-learning-chat-entry-demo.md:20-32`.

Instead: preserve copy that says Practice starts learning, Chat explains, teacher support escalates, and parents see the full activity.

## Verification Recommendations

Minimum Phase 33 checks:

1. Anonymous homepage CTA opens `/login?next=/practice`.
2. Student login from that URL lands on `/practice`, not `/dashboard`.
3. Authenticated student clicking the homepage Practice CTA lands on `/practice`.
4. Authenticated parent/tutor/admin clicking the homepage Practice CTA lands on `/parent`, `/tutor`, `/admin`.
5. Direct anonymous `/practice` still redirects through protected routing.
6. German and French homepage Practice entry at mobile width has no clipped CTA text, card overflow, or unreadable wrapping.
7. `npm run build` passes.

Suggested automated coverage:

- Unit test the pure path helper, if a test runner exists in the phase.
- Playwright route-flow coverage for anonymous login redirect and authenticated role destinations.

## Sources

No external web sources were used. Findings are based on current repository evidence:

- `src/pages/home/HomePage.tsx:10-20`
- `src/components/home/HomePracticeEntry.tsx:7-77`
- `src/components/home/HomePracticeToChatFlow.tsx:6-40`
- `src/app/router/AppRouter.tsx:70-180`
- `src/app/router/ProtectedRoute.tsx:4-12`
- `src/app/router/RoleRoute.tsx:5-25`
- `src/app/router/routeConfig.ts:51-97`
- `src/lib/navigation.ts:33-39`
- `src/lib/authRoutes.ts:3-20`
- `src/hooks/auth/useLoginMutation.ts:20-32`
- `src/i18n/index.ts:58-119`
- `src/lib/localeLayout.ts:29-48`
- `src/i18n/locales/de/home.json:26-43`
- `src/i18n/locales/fr/home.json:26-43`
- `docs/ia/site-layout-with-practice-entry.md:14-127`
- `docs/qa/phase31-practice-entry-checklist.md:3-35`
- `docs/demo/practice-as-learning-chat-entry-demo.md:3-40`
- `docs/demo/current-project-demo-guide.md:7-17`
