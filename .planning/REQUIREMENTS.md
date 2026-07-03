# Requirements: STOA Frontend v2.6

**Defined:** 2026-07-03
**Core Value:** STOA can plan a separate Swiss-parent-first Home V2 homepage with a clear information architecture before visual implementation or production-homepage replacement.

## v2.6 Requirements

### Positioning

- [x] **HVIA-01**: Home V2 defines Swiss parents as the primary public homepage audience while preserving student, tutor, parent, and admin app pages as role-specific experiences.
- [x] **HVIA-02**: Home V2 positioning states STOA as calm, teacher-backed, intelligent learning support for Swiss families instead of an AI homework tool.
- [x] **HVIA-03**: Home V2 uses a 70% Swiss private-school / high-end education service and 30% modern learning product direction as the IA and copy filter.
- [x] **HVIA-04**: Home V2 has one primary homepage action expressed in natural learning language, with `Start learning` as the preferred CTA direction.

### Content Architecture

- [x] **HVIA-05**: Every existing homepage section is inventoried and assigned a disposition: keep, merge, demote, delete, or rewrite.
- [x] **HVIA-06**: Home V2 defines a shorter section order centered on one learning thread rather than equal-weight feature modules.
- [x] **HVIA-07**: Practice, Learning Assistant, teacher support, and parent visibility are mapped as one coherent family learning story.
- [x] **HVIA-08**: Homepage content guardrails explicitly prohibit hero-level AI framing, instant-solver claims, generic SaaS structure, and unsupported production claims.

### Route And Journey

- [x] **HVIA-09**: Home V2 has a route proposal that keeps the current `/` homepage unchanged until explicit switch approval.
- [x] **HVIA-10**: Home V2 has a component namespace and translation namespace proposal that avoid mixing new redesign code with existing home components.
- [x] **HVIA-11**: The CTA journey from Home V2 to login/register is documented, including free-user trial quota semantics after registration.
- [x] **HVIA-12**: Public navigation impact is documented so Home V2 does not add clutter or expose student-only Practice behavior as a generic public nav island.

### Localization And Handoff

- [x] **HVIA-13**: English, German, French, and Italian IA risks are documented before writing final localized marketing copy.
- [x] **HVIA-14**: German title and CTA constraints are captured so long wording does not drive unstable hero layouts.
- [x] **HVIA-15**: The Home V2 IA handoff identifies what later milestones need for visual direction, image selection, animation, copywriting, localization, implementation, and QA.
- [x] **HVIA-16**: The milestone produces a self-contained information architecture document that future implementation phases can follow.

## Future Requirements

| Requirement | Reason Deferred |
|-------------|-----------------|
| Home V2 visual system implementation | This milestone locks positioning and IA first. |
| Home V2 image insertion or image generation | Asset selection depends on the approved IA and section composition. |
| Scroll animation, motion choreography, and interaction polish | Motion should follow the final narrative structure rather than lead it. |
| Home V2 localized copy files in EN/DE/FR/IT | Localization should start after IA and base copy direction are approved. |
| Browser QA, Playwright screenshots, and visual regression | Meaningful only after route/components exist. |
| Replacing `/` with Home V2 | Requires explicit later switch decision after review. |

## Out of Scope

| Item | Reason |
|------|--------|
| Modifying the current production homepage route `/` | User explicitly asked to preserve the existing webpage and build the new design separately. |
| Implementing Home V2 React components | v2.6 is positioning and IA, not UI build. |
| Adding new product capabilities | The homepage can explain existing support loops but must not create backend/product scope. |
| Changing registration, quota, payment, or auth behavior | CTA handoff is documented only; behavior remains unchanged. |
| Foregrounding AI or instant-answer language | Conflicts with the agreed intelligent learning platform positioning. |
| Copying external website code, CSS, components, or assets | Home V2 must remain an original STOA learning-platform design. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HVIA-01 | 228 | Complete |
| HVIA-02 | 228 | Complete |
| HVIA-03 | 228 | Complete |
| HVIA-04 | 228 | Complete |
| HVIA-05 | 229 | Complete |
| HVIA-06 | 229 | Complete |
| HVIA-07 | 229 | Complete |
| HVIA-08 | 229 | Complete |
| HVIA-09 | 230 | Complete |
| HVIA-10 | 230 | Complete |
| HVIA-11 | 230 | Complete |
| HVIA-12 | 230 | Complete |
| HVIA-13 | 231 | Complete |
| HVIA-14 | 231 | Complete |
| HVIA-15 | 231 | Complete |
| HVIA-16 | 231 | Complete |

**Coverage:**
- v2.6 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-07-03*
*Last updated: 2026-07-03 after v2.6 autonomous completion*
