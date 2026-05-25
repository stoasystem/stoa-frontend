# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.16 — Phase 17: Locale-Specific Copywriting, Responsive Typography, and Multilingual UI Refinement

**Shipped:** 2026-05-25
**Phases:** 5 | **Plans:** 5 | **Sessions:** 1

### What Was Built

- Locale-specific copywriting rules for English, German, French, and Italian.
- Language-specific German, French, and Italian copy-rule docs for headline rhythm, CTA tone, punctuation, sentence length, and UI fit.
- Rewritten four-language P0 copy across homepage, registration, chat, parent, tutor, pricing, billing, support, and shared states.
- `HomeHero` support for localized `titleLines` plus typed `localeLayout` hints for German stacked titles and long-label handling.
- Copy review matrix, visual QA by locale documentation, README Phase 17 handoff notes, and final terminology/build evidence.

### What Worked

- Research first was useful: it kept Phase 17 focused on product-localized writing rather than literal translation.
- Keeping layout infrastructure separate from copy changes made the German hero title fix clean and reusable.
- Running browser QA across locales exposed real mobile overflow before completion.

### What Was Inefficient

- The full 200-combination visual QA matrix initially ran slowly because authenticated routes needed the Vite API proxy (`VITE_API_BASE_URL=/api`) to avoid CORS.
- The first copy matrix used a logical hero CTA key instead of the actual rendered key, which the integration checker caught.

### Patterns Established

- Locale files may use different title structures when the UI needs it, with component code handling `titleLines` safely.
- High-risk localized UI should be checked at 375px, 430px, 768px, 1024px, and 1440px.
- Pricing comparison tables can use contained horizontal scroll on mobile, while page-level overflow remains a failure.

### Key Lessons

1. Localized copy QA should trace documented keys to actual rendered i18n keys, not only product concepts.
2. Authenticated visual QA should run through the same API mode the app expects locally, especially when Vite proxy behavior matters.
3. German hero and CTA fit is best solved with shorter structure and scoped layout hints, not global font-size reduction.

### Cost Observations

- Model mix: primary Codex execution plus one GSD integration checker subagent.
- Sessions: 1.
- Notable: The most expensive step was browser QA iteration, but it found and fixed a real tutor mobile overflow.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.16 | 1 | 5 | Research-first multilingual refinement with final cross-locale visual QA evidence |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.16 | TypeScript, build, terminology grep, browser visual QA | 200 route/locale/viewport visual combinations | 6 docs plus locale layout utility |

### Top Lessons

1. Treat language as product design: meaning and layout stability matter more than literal sentence matching.
2. Finish multilingual phases with both source-level terminology grep and rendered-route visual QA.
