# Roadmap: STOA Frontend

## Milestones

- [x] **v8 Home V2 Visual QA And Switch Decision** - Phases 291-297 (shipped 2026-07-07)
- [x] **v7 Full-Site Multilingual Adaptation Execution** - Phases 284-290 (shipped 2026-07-07)
- [x] **v7.0 Full-Site Multilingual Adaptation Planning** - Phases 277-283 (shipped 2026-07-07)
- [x] **v6.6 Home V2 V6 Completion Handoff** - Phases 272-276 (shipped 2026-07-06)

## Phases

- [x] **Phase 291: v8 Scope And Evidence Plan** - Lock QA boundary, evidence rules, hard gates, and output structure.
- [x] **Phase 292: Screenshot Capture Matrix** - Capture `/home-v2` EN/DE/FR/IT desktop/mobile screenshots and current `/` comparison screenshots.
- [x] **Phase 293: Design And Asset Readiness Review** - Review visual quality, image readiness, motion, nav, Login, and language controls.
- [x] **Phase 294: Cross-Locale Content Layout Review** - Review EN/DE/FR/IT copy fit, layout stability, and mobile behavior.
- [x] **Phase 295: Legal Draft Completeness Review** - Review `/privacy` and `/terms` as complete internal-test and lawyer-review drafts.
- [x] **Phase 296: SEO Routing Rollback Readiness** - Review switch-over prerequisites without switching routes.
- [x] **Phase 297: Go No-Go Decision And v9 Backlog** - Produce final decision and remediation backlog for v9.

## Phase Details

### Phase 291: v8 Scope And Evidence Plan

**Goal**: v8 has a clear no-code-change QA contract.
**Depends on**: v7
**Requirements**: SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04
**Success Criteria**:
  1. QA scope names `/home-v2` as primary and `/` as comparison-only.
  2. v8 explicitly forbids runtime code changes and screenshot commits.
  3. Output docs and Go/No-Go gate rules are defined.
  4. v9 is identified as the remediation stage.
**Plans**: 291-PLAN.md
**UI hint**: yes

### Phase 292: Screenshot Capture Matrix

**Goal**: Screenshot evidence exists outside the repository.
**Depends on**: Phase 291
**Requirements**: SHOT-01, SHOT-02, SHOT-03, SHOT-04
**Success Criteria**:
  1. `/home-v2` EN/DE/FR/IT desktop screenshots are captured.
  2. `/home-v2` EN/DE/FR/IT mobile screenshots are captured.
  3. Current `/` desktop/mobile comparison screenshots are captured.
  4. Screenshot matrix records path, viewport, route, locale, and notes.
**Plans**: 292-PLAN.md
**UI hint**: yes

### Phase 293: Design And Asset Readiness Review

**Goal**: Visual quality and asset readiness are judged against the agreed premium direction.
**Depends on**: Phase 292
**Requirements**: VISUAL-01, VISUAL-02, VISUAL-03, VISUAL-04
**Success Criteria**:
  1. Visual review covers Hero, Parent Confidence, Learning Thread, Trust, final CTA, header, Login, and language controls.
  2. Image readiness is classified as final-approved, preview-approved, or not ready.
  3. Motion is reviewed for restraint, warmth, and readability.
  4. Visual findings are evidence-backed and severity-ranked.
**Plans**: 293-PLAN.md
**UI hint**: yes

### Phase 294: Cross-Locale Content Layout Review

**Goal**: EN/DE/FR/IT content and layout readiness are assessed.
**Depends on**: Phase 293
**Requirements**: LOCALE-01, LOCALE-02, LOCALE-03
**Success Criteria**:
  1. Four-language desktop and mobile screenshots are checked for overflow, overlap, and wrapping.
  2. Copy tone is reviewed for restrained confidence and clear parent value.
  3. Navigation, Login, and language controls remain discoverable.
**Plans**: 294-PLAN.md
**UI hint**: yes

### Phase 295: Legal Draft Completeness Review

**Goal**: legal pages are evaluated as complete drafts for internal testing and lawyer review.
**Depends on**: Phase 294
**Requirements**: LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04
**Success Criteria**:
  1. `/privacy` and `/terms` render in EN/DE/FR/IT.
  2. Pages read as complete drafts, not empty placeholders.
  3. Pages avoid public claims of final legal approval.
  4. Open legal facts are documented as internal launch risk.
**Plans**: 295-PLAN.md
**UI hint**: no

### Phase 296: SEO Routing Rollback Readiness

**Goal**: switch-over prerequisites are reviewed without switching routes.
**Depends on**: Phase 295
**Requirements**: SWITCH-01, SWITCH-02, SWITCH-03, SWITCH-04
**Success Criteria**:
  1. Title/meta/canonical/sitemap readiness is assessed.
  2. Current `/` preservation and rollback path are assessed.
  3. Analytics/monitoring needs are assessed.
  4. Visual readiness is separated from switch readiness.
**Plans**: 296-PLAN.md
**UI hint**: no

### Phase 297: Go No-Go Decision And v9 Backlog

**Goal**: final v8 decision and v9 input are complete.
**Depends on**: Phase 296
**Requirements**: DECISION-01, DECISION-02, DECISION-03, DECISION-04
**Success Criteria**:
  1. Final verdict is Go, Conditional Go, or No-Go.
  2. Verdict separates visual readiness from public launch readiness.
  3. v9 backlog has severity, evidence, scope, and recommended treatment.
  4. `/` remains unchanged and switch-over is deferred.
**Plans**: 297-PLAN.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 291. v8 Scope And Evidence Plan | 1/1 | Complete | 2026-07-07 |
| 292. Screenshot Capture Matrix | 1/1 | Complete | 2026-07-07 |
| 293. Design And Asset Readiness Review | 1/1 | Complete | 2026-07-07 |
| 294. Cross-Locale Content Layout Review | 1/1 | Complete | 2026-07-07 |
| 295. Legal Draft Completeness Review | 1/1 | Complete | 2026-07-07 |
| 296. SEO Routing Rollback Readiness | 1/1 | Complete | 2026-07-07 |
| 297. Go No-Go Decision And v9 Backlog | 1/1 | Complete | 2026-07-07 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 291 | 4 | SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04 |
| 292 | 4 | SHOT-01, SHOT-02, SHOT-03, SHOT-04 |
| 293 | 4 | VISUAL-01, VISUAL-02, VISUAL-03, VISUAL-04 |
| 294 | 3 | LOCALE-01, LOCALE-02, LOCALE-03 |
| 295 | 4 | LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04 |
| 296 | 4 | SWITCH-01, SWITCH-02, SWITCH-03, SWITCH-04 |
| 297 | 4 | DECISION-01, DECISION-02, DECISION-03, DECISION-04 |

**Total requirements:** 27
**Mapped requirements:** 27
**Unmapped requirements:** 0

## Next Up

v8 is complete. Final decision: `/home-v2` is the stronger visual direction, but replacing `/` is No-Go until v9 remediation addresses final imagery, FR mobile overflow, legal-page presentation, SEO/routing, and rollback readiness.
