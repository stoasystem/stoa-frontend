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

## Milestone: v1.28 — Phase 30: Final Demo Curriculum Packaging, External Testing, and Product Story Refinement

**Shipped:** 2026-05-26
**Phases:** 6 | **Plans:** 6 | **Sessions:** 1

### What Was Built

- Final equation demo curriculum package covering scope, path summary, unit summaries, Practice-to-Chat, teacher support, parent reporting, limitations, and future curriculum requirements.
- Product story statements and 3-minute, 10-minute, and 15-minute external demo scripts.
- Student, parent, tutor, stakeholder, and internal reviewer testing materials.
- Structured Practice demo feedback form, feedback evaluation framework, severity model, and Phase 31 triage guidance.
- Parent value framing, learning report integration guidance, future backend handoff requirements, and Phase 31 follow-up backlog.
- README Phase 30 guidance, final demo story QA, milestone handoff, audit, archive, and build verification.

### What Worked

- Skipping new research was appropriate because Phase 30 packaged the already-researched Practice + Chat story instead of adding a new product area.
- Keeping the work documentation-only avoided destabilizing the Phase 29 UI and kept the milestone focused on external demo readiness.
- Committing each phase separately made the lifecycle audit straightforward and kept the phase history easy to inspect.

### What Was Inefficient

- The SDK milestone archive generated placeholder accomplishment bullets in `MILESTONES.md`, requiring manual cleanup.
- The close audit surfaced unrelated quick/debug artifacts from other workstreams; those had to be acknowledged as deferred so they did not pollute the Phase 30 result.
- Archiving phase directories after milestone completion made `roadmap.analyze` report complete disk status but lose live plan/summary counts, which is acceptable for archived history but worth remembering.

### Patterns Established

- Demo curriculum packages should separate what the demo proves from what future curriculum/backend work still needs.
- External testing docs should pair role-specific tasks with role-specific feedback questions so results are comparable.
- Parent value framing should treat Practice and Chat as one learning activity and avoid failure/ranking language.

### Key Lessons

1. Product-story milestones should produce scripts, task sheets, feedback forms, and handoff requirements together; any one artifact alone is too weak for external testing.
2. Equation-only scope remains useful because it keeps the demo short, explainable, and credible.
3. Future backend requirements should be documented while they are fresh, but clearly marked as handoff instead of implementation scope.

### Cost Observations

- Model mix: primary Codex execution, no subagents available in this runtime.
- Sessions: 1.
- Notable: The main cost was documentation breadth rather than code iteration; build verification stayed fast and passed.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.16 | 1 | 5 | Research-first multilingual refinement with final cross-locale visual QA evidence |
| v1.17 | 1 | 5 | Production-facing cleanup closed with integration-audit fail/pass loop |
| v1.28 | 1 | 6 | Documentation-only demo curriculum packaging with external testing and feedback handoff |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.16 | TypeScript, build, terminology grep, browser visual QA | 200 route/locale/viewport visual combinations | 6 docs plus locale layout utility |
| v1.17 | Build, dev server, prohibited-term grep, raw-status grep, integration audit | 43/43 requirements and P0/P1 copy/state audit | Env guards, display labels, error sanitizer, QA docs |
| v1.28 | Build, roadmap analyze, milestone audit | 33/33 requirements and 6/6 phases complete | Curriculum package, demo scripts, testing sheets, feedback form, handoff docs |

### Top Lessons

1. Treat language as product design: meaning and layout stability matter more than literal sentence matching.
2. Finish multilingual phases with both source-level terminology grep and rendered-route visual QA.
3. Treat fallback service data and thrown errors as potential UI copy during production-facing cleanup.
4. For external demos, package curriculum scope, story script, tester tasks, feedback forms, and backend handoff together.
