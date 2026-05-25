# Phase 16 Research: Stack

## Sources

- i18next fallback documentation: https://www.i18next.com/principles/fallback
- react-i18next multiple translation files: https://react.i18next.com/guides/multiple-translation-files
- react-i18next `useTranslation`: https://react.i18next.com/latest/usetranslation-hook
- react-i18next i18next instance setup: https://react.i18next.com/latest/i18next-instance
- i18next browser language detector: https://github.com/i18next/i18next-browser-languageDetector
- W3C language attributes guidance: https://www.w3.org/International/geo/html-tech/tech-lang.html

## Recommended Stack Additions

Phase 16 should add:

- `i18next`
- `react-i18next`

Optional, but not required for the first implementation:

- `i18next-browser-languagedetector`

The user asked for explicit persistence in `localStorage` key `stoa_language`, so the first build can manually read/write that key and call `i18n.changeLanguage`. The detector package is useful later if STOA wants browser language fallback or query/path language detection.

## Why This Stack Fits

`react-i18next` exposes the `t` function and the i18n instance through `useTranslation`, which fits the current React component structure. It also supports namespace-based translation loading, matching the requested files such as `common`, `home`, `auth`, `chat`, `parent`, `tutor`, `pricing`, `billing`, `support`, `admin`, and `errors`.

i18next has built-in fallback behavior. This matters because Phase 16 can migrate P0/P1 pages first while leaving lower-priority demo pages to fall back cleanly until later work.

## Configuration Direction

Use bundled JSON imports at first:

- `src/i18n/index.ts`
- `src/i18n/languages.ts`
- `src/i18n/namespaces.ts`
- `src/i18n/locales/{en,de,fr,it}/{namespace}.json`

Initialize with:

- `fallbackLng: 'en'`
- `defaultNS: 'common'`
- `ns` listing all phase namespaces
- `interpolation.escapeValue: false`
- language from `localStorage.getItem('stoa_language') ?? 'en'`

On language change:

- call `i18n.changeLanguage(language)`
- write `localStorage.setItem('stoa_language', language)`
- update `document.documentElement.lang = language`

## What Not To Add Now

Do not add a CMS, remote translation backend, SEO routing, locale-prefixed URLs, automatic machine translation pipeline, or backend preference sync in Phase 16. These are beyond the milestone boundary and would slow the main objective: making the current demo/product surface multilingual and terminology-safe.
