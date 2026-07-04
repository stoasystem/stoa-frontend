# Requirements: STOA Frontend v4.0

**Defined:** 2026-07-04
**Core Value:** STOA can add an isolated, previewable Home V2 route and component skeleton that proves the Swiss-parent homepage structure without replacing the current `/` homepage.

## v4.0 Requirements

### Routing

- [ ] **ROUTE-01**: `/home-v2` renders as a public preview route.
- [ ] **ROUTE-02**: The current `/` homepage remains unchanged.
- [ ] **ROUTE-03**: `/home-v2` is added to the public route inventory.

### Component Skeleton

- [ ] **SKEL-01**: `HomeV2Page` exists under `src/pages/home-v2/`.
- [ ] **SKEL-02**: Home V2 section components exist under `src/components/home-v2/`.
- [ ] **SKEL-03**: The five locked Home V2 sections render: Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, and Final CTA.

### Preview Layout

- [ ] **LAYOUT-01**: The skeleton is previewable, with visible layout rhythm, CTA placement, and placeholder visual/proof surfaces.
- [ ] **LAYOUT-02**: The Hero uses an editorial split on desktop and a stable single-column mobile fallback.
- [ ] **LAYOUT-03**: The route respects v2.7 visual constraints by avoiding generic SaaS grids, decorative gradient orbs, nested card-heavy page sections, and AI-forward hero positioning.

### i18n

- [ ] **I18N-01**: A `homeV2` i18n namespace is added to the frontend i18n configuration.
- [ ] **I18N-02**: English, German, French, and Italian provisional `homeV2.json` locale files exist.
- [ ] **I18N-03**: Visible Home V2 skeleton copy uses i18n resources instead of hard-coded English strings.

### Boundaries And Verification

- [ ] **BOUND-01**: v4.0 excludes final image optimization, full animation choreography, final copywriting, screenshot QA, and `/` switch-over.
- [ ] **VERIFY-01**: Build and lint verification cover the new Home V2 route and skeleton.
- [ ] **VERIFY-02**: Documentation records the v4.0 implementation handoff and deferred items.

## Future Requirements

| Requirement | Reason Deferred |
|-------------|-----------------|
| Final Home V2 image crop/optimization and WebP/AVIF variants | Requires final asset approval and a dedicated asset implementation pass. |
| Full Home V2 animation choreography | Needs the route skeleton first, then motion design and browser performance QA. |
| Final EN/DE/FR/IT homepage copywriting | Needs route and section structure first; final copy should be its own reviewable milestone. |
| Screenshot and visual regression QA | Should run after the preview route has implemented layout and assets stable enough to inspect. |
| Switching `/` to Home V2 | Requires explicit later approval after route, assets, copy, localization, animation, and QA are complete. |
| Paid or commissioned Swiss Hero photography | Requires budget/source approval and final-use license review. |

## Out of Scope

| Item | Reason |
|------|--------|
| Replacing the current homepage route `/` | v4.0 creates an isolated preview route only. |
| Refactoring the current `src/components/home/` implementation | Home V2 should be isolated so the current homepage remains stable. |
| Adding new backend, auth, registration, quota, payment, or role-dashboard behavior | The milestone is frontend route/component skeleton work only. |
| Treating candidate images as final production assets | Candidate images remain unoptimized and not final-approved. |
| Hero-level AI, instant-solver, OCR, guaranteed-improvement, or teacher-replacement claims | These conflict with the agreed Swiss high-end education positioning and current product capabilities. |
| Adding a new animation or image-processing dependency | Research found no new dependency is required for the skeleton milestone. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROUTE-01 | 244 | Complete |
| ROUTE-02 | 244 | Complete |
| ROUTE-03 | 244 | Complete |
| SKEL-01 | 245 | Complete |
| SKEL-02 | 245 | Complete |
| SKEL-03 | 245 | Complete |
| I18N-01 | 245 | Complete |
| I18N-02 | 245 | Complete |
| I18N-03 | 245 | Complete |
| LAYOUT-01 | 246 | Complete |
| LAYOUT-02 | 246 | Complete |
| LAYOUT-03 | 246 | Complete |
| BOUND-01 | 247 | Pending |
| VERIFY-01 | 247 | Pending |
| VERIFY-02 | 247 | Pending |

**Coverage:**
- v4.0 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-07-04*
*Last updated: 2026-07-04 after v4.0 requirements definition*
