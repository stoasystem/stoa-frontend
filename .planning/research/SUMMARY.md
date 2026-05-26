# Phase 20 Research Summary

**Milestone:** v1.19 Phase 20: Cross-Locale Copy Refinement, German Style Alignment, and Layout Adaptation
**Date:** 2026-05-26

## Stack Additions

No new dependencies are needed. Phase 20 should use the existing `react-i18next` locale files, `src/lib/localeLayout.ts`, Tailwind utilities, Phase 19 brand tokens, and Playwright/browser visual QA.

## German Style Findings

Source: `/Users/zhdeng/newweb`, read-only.

Pre-work source status:

```text
 M img/team/.DS_Store
```

This was pre-existing and must remain untouched.

Observed German style:

- Hero rhythm is short, editorial, and split into concise phrases.
- CTAs are direct and short: `Mehr erfahren`, `Jetzt anmelden`, `Kontakt aufnehmen`.
- Brand tone is formal, calm, premium, and education-centered.
- Explanatory text often uses `Schülerinnen und Schüler`, `Lehrpersonen`, `Verständnis`, `Sicherheit`, `Selbstvertrauen`, `Lernfortschritt`, `Begleitung`, `Förderung`, and `Lernumgebung`.
- `Nachhilfe` is acceptable for service-category clarity, but higher-brand moments lean toward `Lernunterstützung`, `Begleitung`, `Förderung`, and `Lernen`.
- Longer explanations are placed in paragraphs, while headings and CTAs remain compact.

## Feature Table Stakes

- Document company homepage German style study and copy reference.
- Create/update English, German, French, and Italian copy rules.
- Create cross-locale copy review matrix.
- Create cross-locale visual QA matrix.
- Refine core locale JSON for homepage, register, chat, parent report, pricing, billing, and support.
- Update locale layout hints and components only where copy length requires it.
- Verify build/dev and source read-only safety.

## Watch Outs

- Do not modify `/Users/zhdeng/newweb`.
- Do not copy homepage components or full text.
- Do not force literal translation across locales.
- Do not add new product functionality.
- Treat copy and layout as a coupled system.
- Preserve Phase 18 production-facing copy safety and Phase 19 brand visuals.

## Recommended Phase Structure

1. Source Safety and German Style Study.
2. Cross-Locale Copy Rules and Review Matrix.
3. Core Locale Copy Refinement.
4. Locale Layout Adaptation and Component Fit.
5. Cross-Locale Visual QA, README, and Handoff.

