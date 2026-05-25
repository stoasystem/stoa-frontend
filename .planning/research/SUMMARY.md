# Phase 16 Research Summary

## Sources Used

- i18next fallback documentation: https://www.i18next.com/principles/fallback
- react-i18next multiple translation files: https://react.i18next.com/guides/multiple-translation-files
- react-i18next `useTranslation`: https://react.i18next.com/latest/usetranslation-hook
- react-i18next i18next instance setup: https://react.i18next.com/latest/i18next-instance
- i18next browser language detector: https://github.com/i18next/i18next-browser-languageDetector
- W3C language attributes guidance: https://www.w3.org/International/geo/html-tech/tech-lang.html

## Key Findings

- `i18next` + `react-i18next` is the right Phase 16 stack. It supports React hooks, language switching, interpolation, fallback language, and namespace-based translation files.
- Namespace files match the requested page-group migration and reduce risk compared with one large translation file.
- i18next fallback behavior supports phased migration, but P0/P1 pages should still get explicit complete translations.
- `i18next-browser-languagedetector` can detect and cache language in localStorage/cookies, but Phase 16 can stay simpler by manually persisting `stoa_language`.
- The app should update the root `html lang` attribute when language changes. W3C guidance supports language attributes on the `html` element for default text-processing language.
- The biggest delivery risk is not library setup; it is hidden hardcoded strings in validation, toast, loading, empty, and error states.
- The biggest brand risk is translating old copy while leaving `AI`, `AI tutor`, `AI answer`, `human backup`, `teacher backup`, `what we are selling`, or purchase-heavy terms in place.

## Stack Recommendation

Add:

- `i18next`
- `react-i18next`

Defer unless needed:

- `i18next-browser-languagedetector`

## Milestone Build Order

1. i18n foundation, locale scaffolding, language switcher, and persistence.
2. Language glossary, copy style guide, terminology replacement guide, and translation QA checklist.
3. Public/home/auth localization and visible terminology replacement.
4. Chat and teacher escalation localization using `Learning Assistant` and `Professional teacher support`.
5. Parent, tutor, pricing, billing, support, and P1 app page localization.
6. Layout and copy QA for English, German, French, and Italian.
7. README update and final verification.

## Recommended Phase 16 Terminology Rule

User-visible product language should be:

> Learning Assistant first. Professional teacher support when needed. Parents stay informed.

Do not use `AI` as the primary visible product term. Technical implementation names and developer-facing docs may still use AI-related terms where they describe backend/provider internals.
