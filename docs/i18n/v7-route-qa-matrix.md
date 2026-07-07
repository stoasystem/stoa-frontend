# v7 Route QA Matrix

**Date:** 2026-07-07
**Status:** Planning handoff

## QA Principle

v7 multilingual QA must be route-based. Four-language support is not complete when JSON files exist; it is complete when the relevant routes render correctly, controls switch language at runtime, visible copy is role-appropriate, and mobile layouts survive the longest realistic locale strings.

## P0: Four-Language Screenshot QA

P0 routes require screenshots in EN/DE/FR/IT at desktop and mobile widths. Tablet is required where the layout has special breakpoints.

| Area | Routes | Required Checks |
|------|--------|-----------------|
| Current public homepage | `/` | Existing page still works; no switch-over side effects; nav/login/language behavior remains stable if shared components change. |
| Home V2 preview | `/home-v2` | Premium language control, mobile menu chips, hero, learning thread, parent confidence, trust, final CTA, image overlays, motion-safe fit. |
| Auth | `/login`, `/register`, `/forgot-password` | Labels, placeholders, errors, CTAs, role selection, mobile fit, no internal auth/debug language. |
| Public marketing/support | `/pricing`, `/contact`, `/support`, `/for-parents`, `/teacher-support`, `/qa` | Parent/public tone, CTA fit, pricing terms, contact/support clarity. |
| Legal entry points | `/privacy`, `/terms` | Clear legal language, review markers handled as intended, no broken layout in DE/FR/IT. |
| Core student | `/dashboard`, `/chat`, `/practice`, `/question-bank`, `/classroom` | Student tone, practice/chat/classroom labels, upload wording, next-step language, no AI-solver claims. |

## P1: Four-Language Route Smoke QA

P1 routes require runtime smoke checks in EN/DE/FR/IT and targeted screenshots when layout risk is high.

| Area | Routes / Route Families | Required Checks |
|------|-------------------------|-----------------|
| Practice detail | subject/topic/unit/lesson/challenge/result/mistakes routes | Long labels, challenge feedback, hint copy, retry/start/continue CTAs. |
| Practice Library | question set/session/result/mistakes/saved routes | Library wording, upload handoff, feedback states, saved-set labels. |
| Parent | parent dashboard, child summary, child history, reports, classroom visibility | Parent tone, progress visibility language, no surveillance framing. |
| Teacher/Tutor | tutor dashboard, request queue/detail, classroom lobby/room/summary, profile, availability | Professional context copy, status labels, next actions, compact table/card fit. |
| Billing/Growth | billing, referrals, checkout success/cancel, quota, feature access | Trial, subscription, plan, refund-sensitive language, CTA fit. |
| Support | support tickets, ticket detail, create request | Support wording, empty/error states, status labels. |
| Organization | organization dashboard, students, tutors, reports, analytics | Role labels, table fit, admin vs school wording. |
| Admin core | admin dashboard, usage, help requests, support overview | Operational labels, no marketing phrasing, no missing keys. |

## P2: Static And Deep Coverage

P2 checks prevent broken multilingual coverage in lower-frequency routes.

| Check | Scope |
|-------|-------|
| Missing key scan | All EN/DE/FR/IT resource files and route namespaces. |
| Raw English scan | Non-English locales should not retain visible English strings unless intentionally branded. |
| Internal-term scan | `mock`, `demo`, `provider`, `prompt`, model names, debug labels, and TODO-like visible copy. |
| Admin deep routes | analytics, retention, moderation, curriculum graph, report operations, learning automation. |
| Edge routes | 401, 403, 404, empty states, loading states, network errors, duplicate submit guards. |
| Legal deep copy | cookies, retention, processor/subprocessor, user rights, payment/refund language once drafted. |

## Visual Fit Checks

Every P0 route should be checked for:

- German long labels and compounds.
- French apostrophes and line breaks.
- Italian CTA length.
- mobile nav/menu height.
- button text fit.
- card heading fit.
- form placeholder fit.
- no text overlap with images, nav, badges, or controls.
- no layout shift when switching language.

## Suggested Verification Commands

Use the repo's available commands once implementation starts:

```bash
npm run lint
npm run build
npm run test:e2e
```

For screenshot work, extend or add focused Playwright specs that iterate:

- `en`
- `de`
- `fr`
- `it`

Recommended screenshot buckets:

- `p0-public`
- `p0-auth`
- `p0-student`
- `p1-role-surfaces`
- `p2-static`

## Release Criteria

v7 cannot be called complete until:

- FR/IT are selectable at runtime.
- P0 screenshot QA passes for all four languages.
- P1 route smoke passes for all four languages.
- P2 static scans pass or have documented exceptions.
- Home V2 language control meets the premium visual requirement.
- Legal/privacy/terms drafts are clearly marked with review status and unknown facts.
