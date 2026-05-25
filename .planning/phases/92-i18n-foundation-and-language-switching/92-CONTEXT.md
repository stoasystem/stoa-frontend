# Phase 92 Context

Goal: establish STOA's multilingual frontend foundation without adding business functionality.

Inputs:
- Phase 16 milestone brief
- i18next/react-i18next documentation research
- Swiss multilingual requirements for English, German, French, and Italian

Decisions:
- Use `i18next` and `react-i18next`.
- Store language in `localStorage` key `stoa_language`.
- Update `document.documentElement.lang` after initialization and on language changes.
- Keep language preference frontend-local for this milestone; demo/auth payloads can optionally carry `preferredLanguage`.
