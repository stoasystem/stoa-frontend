# Phase 32 Final Language QA Report

## Scope

Phase 32 reviewed user-facing copy in English, German, French, and Italian across public pages, authenticated student/parent/tutor surfaces, billing, Practice, Learning Chat, Parent Report, tutor request detail, shared navigation, footer, state copy, and legacy route stubs.

This phase did not add new product features, pages, languages, curriculum, backend behavior, database behavior, payment behavior, or company-homepage source changes.

## Pages Checked

- Public: homepage, How it works, For parents, Teacher support, Pricing, Q&A, Contact, Login, Register, Privacy, Terms.
- Student: Dashboard, Practice overview, Practice lesson/result surfaces, Learning Chat, Learning History, Profile.
- Parent: Dashboard, child summary, Parent Report, learning activity summary, billing-related entry points.
- Tutor: Dashboard, request list, request detail, Practice context, availability/support-adjacent surfaces.
- Shared: navbar, footer, language switcher, forms, buttons, cards, badges, loading/error/empty messages.

## Languages Checked

- English: calm, accurate, education-oriented, not sales-heavy or technical.
- German: concise, natural, not a literal English translation, suitable for Swiss/German-speaking education context.
- French: natural phrasing, typographic apostrophes, clear education language.
- Italian: warm, compact, natural CTA and state copy.

## Major Issues Found

- Practice surfaces still contained visible development-demo wording.
- Billing i18n keys and checkout pages used mock/preview terminology in user-facing areas.
- Chat errors exposed overly technical or abrupt failure wording.
- Legacy route stubs still displayed TODO-style placeholder text if reached directly.
- A homepage detail used `prompt` where `hint` better matched product language.
- German had a valid homepage `hero.titleLines` key without equivalent keys in other locales, which made parity checks noisy.

## Issues Fixed

- Replaced visible Practice `demo path` and lesson-result `student demo flow` wording.
- Renamed billing copy and keys from mock checkout wording to plan-selection review wording.
- Replaced checkout preview copy with plan review copy.
- Rewrote Learning Chat load/create/upload/teacher request failures into friendly retry language.
- Replaced legacy TODO route text with product-safe directional messages.
- Renamed `AIResponseFeedback` to `LearningResponseFeedback`.
- Replaced homepage `prompt` copy with `hint`.
- Added equivalent `hero.titleLines` keys for English, French, and Italian.

## Verification

- `npm run build` passed.
- Locale key parity passed across `en`, `de`, `fr`, and `it`.
- French apostrophe scan passed.
- Forbidden/high-risk user-facing term scan passed with one expected internal hit in `src/lib/userFacingText.ts`, which is the sanitizer blocklist itself.
- Playwright smoke passed: 184 route/locale/viewport checks across EN/DE/FR/IT, public widths 375/430/768/1024/1440, and authenticated app widths 430/1024.
- Smoke routes included homepage, register, pricing, contact, Q&A, teacher support, student dashboard, Practice, Learning Chat, billing, parent dashboard, Parent Report, tutor dashboard, and tutor request detail.

## Known Issues

- Internal code identifiers, mock data/service names, demo fallback behavior, route aliases, tests, and developer docs still contain technical terms where they are not rendered as normal user-facing UI.
- The `/ai-homework-help` route remains as a compatibility alias, but visible page copy does not present STOA as an AI product.
- Formal translator review remains a future operational step before wider external launch.

## Approval Decision

Approved for Phase 32. The current frontend presents user-facing STOA copy as a credible four-language education platform without visible development artifacts in the reviewed normal UI surfaces.
