# Phase 20 Research: Stack

**Milestone:** v1.19 Phase 20: Cross-Locale Copy Refinement, German Style Alignment, and Layout Adaptation
**Date:** 2026-05-26

## Stack Additions

No new runtime dependencies are needed.

Phase 20 should use the existing frontend stack:

- React + TypeScript + Vite.
- Existing `i18next` / `react-i18next` locale namespace files.
- Existing `src/lib/localeLayout.ts` locale layout hints.
- Existing Tailwind utilities, STOA brand tokens, and `platform-theme.css`.
- Existing Playwright setup for route/viewport visual checks.

## Current Locale Infrastructure

Locale files exist for:

- `en`
- `de`
- `fr`
- `it`

Namespaces currently include:

- `admin`
- `auth`
- `billing`
- `chat`
- `common`
- `errors`
- `home`
- `parent`
- `pricing`
- `support`
- `tutor`

This is enough for Phase 20. The work should refine existing JSON copy and layout use, not add a translation system.

## Current Layout Infrastructure

`src/lib/localeLayout.ts` already supports:

- Locale-specific hero title variant.
- German stacked hero title.
- Per-locale hero max-width classes.
- Per-locale subtitle width.
- Per-locale action wrapping.
- Basic button sizing hints.

Phase 20 should extend this conservatively if needed, for example:

- CTA short/long selection guidance.
- Button width or wrapping hints.
- Card/list layout hints for German/French/Italian long text.
- Text wrapping classes for specific surfaces.

## Read-Only Source

`/Users/zhdeng/newweb` is a static HTML/CSS company homepage project with German and English copy in `js/language-switcher.js` and German fallback text in HTML pages. Phase 20 may inspect it only.

Pre-work source status:

```text
 M img/team/.DS_Store
```

This appears to be a pre-existing external change. Phase 20 must not modify it.

## What Not To Add

- No new i18n framework.
- No CMS.
- No automatic translation service.
- No browser-side language preference backend sync.
- No new UI library.
- No formatter/build/install commands inside `/Users/zhdeng/newweb`.
- No copied homepage components or full text blocks.

