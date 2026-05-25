# Phase 16 Research: Pitfalls

## Translation Scope Creep

Risk: Trying to localize every advanced demo page at once will delay the P0 student/parent/tutor flow.

Prevention: Define P0 and P1 explicitly. Lower-priority platform/organization/advanced analytics pages can remain later follow-up unless they expose high-visibility copy during demos.

## Reintroducing AI-Hype Copy

Risk: Some copy can be translated while still saying `AI`, `AI answer`, `AI tutor`, or `human backup`.

Prevention: Add a terminology replacement document, glossary, and QA grep checks for user-facing `AI`, `chatbot`, `robot`, `human backup`, `teacher backup`, `what we are selling`, `buy now`, and `customers`.

## Sentence Fragment Translation

Risk: Splitting sentences across JSX fragments creates unnatural German, French, and Italian grammar.

Prevention: Store full sentences in locale files. Use interpolation or `Trans` for links/emphasis instead of sentence assembly.

## German and French Layout Overflow

Risk: German and French strings are often longer than English. Fixed-width buttons, nav bars, pricing cards, and chat actions can overflow.

Prevention: Use flexible widths, wrapping labels, mobile menus, and route-level Playwright checks at mobile width for `de`, `fr`, and `it`.

## Hidden English Strings

Risk: Form validation schemas, toasts, loading states, empty states, and error handlers often keep hardcoded English after page text is localized.

Prevention: Treat `errors.json`, `common.status`, and toast keys as P0, and audit components for hardcoded strings.

## Accessibility Regression

Risk: Language switching without updating `<html lang>` harms screen readers and text processing.

Prevention: Set `document.documentElement.lang` on init and language change, and include it in QA.

## Overbuilding Localization Infrastructure

Risk: Adding CMS, remote translation backends, locale-prefixed routing, or backend preference sync before core migration creates unnecessary complexity.

Prevention: Start with local JSON imports and localStorage persistence. Document future backend preference sync separately.

## Legal Copy Risk

Risk: Translated privacy/terms copy may be mistaken as legally approved.

Prevention: Keep legal pages marked as launch drafts and document that final legal review is out of scope.
