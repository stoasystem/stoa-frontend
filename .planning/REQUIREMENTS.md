# Requirements: STOA Frontend v2.7

**Defined:** 2026-07-03
**Core Value:** STOA can define a premium, Swiss-parent-first Home V2 visual direction before writing page code, choosing final images, or replacing the current homepage.

## v2.7 Requirements

### Visual Thesis

- [ ] **HVD-01**: Home V2 has a documented visual thesis that translates v2.6 IA into a premium Swiss education-service experience.
- [ ] **HVD-02**: Home V2 selects a clear high-end design archetype and explains how it adapts `high-end-visual-design` to STOA.
- [ ] **HVD-03**: Home V2 visual direction defines what it must avoid: generic SaaS, AI-tool spectacle, one-note beige, dominant purple/blue gradients, decorative orbs, and feature-card clutter.
- [ ] **HVD-04**: Home V2 visual direction preserves the existing `/` homepage and role app surfaces as separate design contexts.

### Design System Extension

- [ ] **HVD-05**: Home V2 defines typography roles for display, heading, body, nav, CTA, caption, and product-evidence labels.
- [ ] **HVD-06**: Home V2 defines color behavior using existing STOA brand signals while avoiding a one-note palette.
- [ ] **HVD-07**: Home V2 defines spacing, grid, section rhythm, and macro-whitespace rules for desktop and mobile.
- [ ] **HVD-08**: Home V2 defines surface architecture including double-bezel containers, image frames, evidence panels, and non-nested card rules.

### Composition, Imagery, And Motion

- [ ] **HVD-09**: Home V2 defines section-by-section layout composition for Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, and Final CTA.
- [ ] **HVD-10**: Home V2 defines image roles, crop ratios, quality criteria, and what existing or future assets must communicate.
- [ ] **HVD-11**: Home V2 defines CTA and navigation visual treatment, including nested trailing-icon behavior where applicable.
- [ ] **HVD-12**: Home V2 defines motion choreography using transform/opacity, custom cubic-bezier timing, reveal sequencing, and mobile/performance guardrails.

### Handoff And QA

- [ ] **HVD-13**: Home V2 visual direction documents responsive collapse rules for asymmetric layouts below tablet widths.
- [ ] **HVD-14**: Home V2 visual direction documents accessibility and readability checks for premium typography, contrast, tap targets, and localized text length.
- [ ] **HVD-15**: Home V2 visual direction documents implementation constraints for later React/Tailwind work without creating code in this milestone.
- [ ] **HVD-16**: The milestone produces a self-contained visual direction document ready for later image strategy, animation, copy, localization, implementation, and visual QA milestones.

## Future Requirements

| Requirement | Reason Deferred |
|-------------|-----------------|
| Home V2 route/component implementation | v2.7 defines visual direction only. |
| Final image sourcing, image generation, or asset insertion | Requires separate image strategy and approval. |
| Scroll animation implementation | Motion rules are defined now; implementation belongs after component scaffolding. |
| Final EN/DE/FR/IT marketing copy | Copywriting and localization follow visual direction and image choices. |
| Browser screenshot QA | Meaningful only after Home V2 components exist. |
| Switching `/` to Home V2 | Requires explicit later switch approval. |

## Out of Scope

| Item | Reason |
|------|--------|
| Modifying the current homepage route `/` | Home V2 remains a separate preview track. |
| Implementing React/Tailwind components | This milestone is design direction and documentation. |
| Adding dependencies or icon/font packages | Actual package choices belong to implementation planning. |
| Replacing app-surface design rules | Home V2 visual direction is for the public homepage only. |
| Decorative gradient orbs, large scrolling blur, and one-note beige/purple/blue themes | These conflict with STOA frontend design constraints. |
| Copying external website code, CSS, components, or assets | Home V2 must be an original STOA design. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HVD-01 | 232 | Pending |
| HVD-02 | 232 | Pending |
| HVD-03 | 232 | Pending |
| HVD-04 | 232 | Pending |
| HVD-05 | 233 | Pending |
| HVD-06 | 233 | Pending |
| HVD-07 | 233 | Pending |
| HVD-08 | 233 | Pending |
| HVD-09 | 234 | Pending |
| HVD-10 | 234 | Pending |
| HVD-11 | 234 | Pending |
| HVD-12 | 234 | Pending |
| HVD-13 | 235 | Pending |
| HVD-14 | 235 | Pending |
| HVD-15 | 235 | Pending |
| HVD-16 | 235 | Pending |

**Coverage:**
- v2.7 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-07-03*
*Last updated: 2026-07-03 after v2.7 milestone initialization*
