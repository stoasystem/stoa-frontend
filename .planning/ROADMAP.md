# Roadmap: STOA Frontend

## Milestones

- ✅ **v2.6 Home V2 Positioning and Information Architecture** - Phases 228-231 (shipped 2026-07-03)
- ◆ **v2.7 Home V2 Visual Direction Design** - Phases 232-235

## Phases

- [ ] **Phase 232: Premium Visual Thesis And Anti-Pattern Contract** - Define the high-end visual archetype, visual promise, design mood, and hard exclusions for Home V2.
- [ ] **Phase 233: Home V2 Design System Extension** - Define typography, color, spacing, grid, surface, CTA, and section rhythm rules for Home V2.
- [ ] **Phase 234: Section Composition, Imagery, And Motion Blueprint** - Translate the IA into section-level layout, image, navigation, CTA, and motion direction.
- [ ] **Phase 235: Responsive, Accessibility, And Implementation Handoff** - Define mobile collapse, accessibility, performance, localization, and implementation handoff checks.

## Phase Details

### Phase 232: Premium Visual Thesis And Anti-Pattern Contract

**Goal**: Home V2 has a clear high-end visual direction that feels like Swiss education service, not generic SaaS or AI spectacle.
**Depends on**: Phase 231
**Requirements**: HVD-01, HVD-02, HVD-03, HVD-04
**Success Criteria**:
  1. Visual thesis connects directly to the v2.6 Home V2 IA.
  2. A high-end archetype is selected and adapted to STOA.
  3. Anti-patterns are explicit enough to block generic redesigns.
  4. Current `/` and role app surfaces remain separate.
  5. `high-end-visual-design` guidance is adapted, not copied literally.
**Plans**: 232-PLAN.md
**UI hint**: yes

### Phase 233: Home V2 Design System Extension

**Goal**: Home V2 has visual rules for typography, color, spacing, grid, surfaces, and CTAs before implementation begins.
**Depends on**: Phase 232
**Requirements**: HVD-05, HVD-06, HVD-07, HVD-08
**Success Criteria**:
  1. Display, heading, body, nav, CTA, caption, and evidence label roles are defined.
  2. Color behavior extends STOA tokens without becoming one-note.
  3. Desktop/mobile spacing and grid rules are documented.
  4. Double-bezel and non-nested-card rules are documented.
  5. Design system rules are scoped to Home V2 public marketing surfaces.
**Plans**: 233-PLAN.md
**UI hint**: yes

### Phase 234: Section Composition, Imagery, And Motion Blueprint

**Goal**: Every Home V2 section has a layout, image, CTA/navigation, and motion direction that future implementation can follow.
**Depends on**: Phase 233
**Requirements**: HVD-09, HVD-10, HVD-11, HVD-12
**Success Criteria**:
  1. Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, and Final CTA each have layout guidance.
  2. Image roles and crop expectations are documented.
  3. CTA and nav visual treatment is documented.
  4. Motion uses transform/opacity and custom cubic-bezier timing.
  5. Motion rules avoid mobile performance traps.
**Plans**: 234-PLAN.md
**UI hint**: yes

### Phase 235: Responsive, Accessibility, And Implementation Handoff

**Goal**: Later implementation can build Home V2 with clear mobile, accessibility, localization, performance, and QA guardrails.
**Depends on**: Phase 234
**Requirements**: HVD-13, HVD-14, HVD-15, HVD-16
**Success Criteria**:
  1. Asymmetric desktop layouts have explicit mobile collapse rules.
  2. Typography, contrast, tap target, and localized text risks are documented.
  3. Implementation constraints are clear without writing code in this milestone.
  4. Visual direction handoff links to the v2.6 IA and future milestone plan.
  5. `git diff --check` passes for documentation changes.
**Plans**: 235-PLAN.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 232. Premium Visual Thesis And Anti-Pattern Contract | 0/1 | Pending | — |
| 233. Home V2 Design System Extension | 0/1 | Pending | — |
| 234. Section Composition, Imagery, And Motion Blueprint | 0/1 | Pending | — |
| 235. Responsive, Accessibility, And Implementation Handoff | 0/1 | Pending | — |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 232 | 4 | HVD-01, HVD-02, HVD-03, HVD-04 |
| 233 | 4 | HVD-05, HVD-06, HVD-07, HVD-08 |
| 234 | 4 | HVD-09, HVD-10, HVD-11, HVD-12 |
| 235 | 4 | HVD-13, HVD-14, HVD-15, HVD-16 |

**Total requirements:** 16
**Mapped requirements:** 16
**Unmapped requirements:** 0

## Next Up

Phase 232: Premium Visual Thesis And Anti-Pattern Contract.
