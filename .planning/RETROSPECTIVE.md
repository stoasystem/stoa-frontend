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

## Milestone: v1.17 — Phase 18: Production-Facing Cleanup, Stability Hardening, and Demo Artifact Removal

**Shipped:** 2026-05-26
**Phases:** 5 | **Plans:** 5 | **Sessions:** 1

### What Was Built

- Production-facing copy audit, demo artifact removal checklist, and stability hardening checklist.
- Typed environment and demo visibility guards for demo accounts, demo navigation, demo route surfaces, checkout previews, and internal debug UI.
- Product-safe copy cleanup across auth/register, chat, parent, tutor, pricing, billing, support, admin, and related P0/P1 surfaces.
- Display-label and user-facing error boundaries that prevent raw statuses, raw plan IDs, provider/model/backend terms, and unsafe API errors from rendering.
- Duplicate-submit guards and safer empty/error/loading behavior across key auth, chat, support, tutor, billing, and checkout paths.
- README, QA evidence, and milestone audit documentation for Phase 18 closeout.

### What Worked

- The initial source inventory prevented over-cleaning: internal identifiers, tests, and developer docs could remain while rendered UI was cleaned or gated.
- Environment guard helpers gave a single place to reason about demo-only UI instead of scattering production checks.
- The integration checker caught real cross-phase misses before archival, especially admin diagnostics and chat error rendering.

### What Was Inefficient

- Phase 107 initially accepted source-scan evidence too broadly; user-visible admin/support/billing copy still needed a second integration pass.
- Some technical terms were hidden in fallback data and error paths rather than obvious page copy, so direct route review alone was not enough.
- The SDK milestone completion generated placeholder accomplishments, requiring manual correction in `MILESTONES.md`.

### Patterns Established

- Production-facing cleanup needs a render-boundary rule: service fallback strings and thrown errors count as user-facing if they can flow into UI.
- Internal debug panels should be the only normal place for environment/API diagnostics, and they must stay gated by explicit development flags.
- User-facing status and error text should go through shared mapping/sanitization helpers rather than direct enum or exception rendering.

### Key Lessons

1. Copy audits should include fallback service strings and mutation errors, not only page components and locale JSON.
2. A milestone audit should be allowed to fail late; fixing those findings before archival is cheaper than carrying them as vague tech debt.
3. Production-facing payment copy should describe plan readiness and contact paths, not disabled modes or environment state.

### Cost Observations

- Model mix: primary Codex execution plus one GSD integration checker subagent.
- Sessions: 1.
- Notable: The integration checker produced a useful fail/pass loop and prevented premature milestone closeout.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.16 | 1 | 5 | Research-first multilingual refinement with final cross-locale visual QA evidence |
| v1.17 | 1 | 5 | Production-facing cleanup closed with integration-audit fail/pass loop |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.16 | TypeScript, build, terminology grep, browser visual QA | 200 route/locale/viewport visual combinations | 6 docs plus locale layout utility |
| v1.17 | Build, dev server, prohibited-term grep, raw-status grep, integration audit | 43/43 requirements and P0/P1 copy/state audit | Env guards, display labels, error sanitizer, QA docs |

### Top Lessons

1. Treat language as product design: meaning and layout stability matter more than literal sentence matching.
2. Finish multilingual phases with both source-level terminology grep and rendered-route visual QA.
3. Treat fallback service data and thrown errors as potential UI copy during production-facing cleanup.
