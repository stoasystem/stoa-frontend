# Requirements: STOA Frontend v2.8

**Defined:** 2026-07-03
**Core Value:** STOA can choose Home V2 image and asset sources with real-photo authenticity, clear licensing, Swiss-parent fit, and implementation-ready metadata before downloading final assets or changing the homepage.

## v2.8 Requirements

### Source Policy

- [ ] **IMG-01**: Home V2 has a documented source hierarchy that prioritizes real licensed photography and stock assets over AI-generated imagery.
- [ ] **IMG-02**: Home V2 has source-specific rules for Pexels, iStock, Magnific stock, and similar sources, including whether each source is free, paid, AI-assisted, or approval-gated.
- [ ] **IMG-03**: Home V2 has explicit licensing, attribution, model/property-release, endorsement, and trademark-risk checks for every candidate asset.
- [ ] **IMG-04**: Home V2 defines when AI upscaling, editing, or generation is allowed, with AI generation treated as a last resort rather than default.

### Asset Briefs And Search

- [ ] **IMG-05**: Home V2 defines section-specific asset briefs for Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, and Final CTA.
- [ ] **IMG-06**: Home V2 defines search taxonomy and keyword families for Swiss-parent, high-end education, family homework, teacher support, and learning-progress imagery.
- [ ] **IMG-07**: Home V2 defines candidate scoring criteria for authenticity, Swiss relevance, premium education tone, crop flexibility, diversity, age appropriateness, and non-stocky feel.
- [ ] **IMG-08**: Home V2 defines what visual content must be rejected, including AI-looking faces, staged stock cliches, surveillance framing, negative child portrayal, and unsupported outcome claims.

### Asset Operations

- [ ] **IMG-09**: Home V2 defines an asset metadata ledger format with source URL, license, creator/source, release risk, AI/enhancement status, candidate role, and approval state.
- [ ] **IMG-10**: Home V2 defines storage and naming conventions for future local assets under a Home V2 namespace.
- [ ] **IMG-11**: Home V2 defines crop, aspect-ratio, responsive image, and optimization expectations for later implementation.
- [ ] **IMG-12**: Home V2 defines a candidate shortlist process without committing final binaries in this milestone.

### Handoff And QA

- [ ] **IMG-13**: Home V2 defines handoff rules for later image insertion, including alt text intent, responsive variants, and visual QA checkpoints.
- [ ] **IMG-14**: Home V2 defines approval gates for paid assets, identifiable people, AI-edited assets, and homepage hero imagery.
- [ ] **IMG-15**: Home V2 keeps current `/` unchanged and does not implement React components, localized JSON, or asset imports in this milestone.
- [ ] **IMG-16**: The milestone produces a self-contained image and asset strategy document ready for later asset acquisition and implementation milestones.

## Future Requirements

| Requirement | Reason Deferred |
|-------------|-----------------|
| Downloading or purchasing final assets | Requires candidate approval and budget/source confirmation. |
| Committing binary image files | Belongs to the implementation or asset insertion milestone after strategy approval. |
| React image implementation | Requires Home V2 component scaffolding. |
| Final alt text and localized image-adjacent copy | Belongs to copy/localization and implementation milestones. |
| Browser screenshot QA | Meaningful only after Home V2 components and assets exist. |
| Switching `/` to Home V2 | Requires explicit later switch approval. |

## Out of Scope

| Item | Reason |
|------|--------|
| Modifying the current homepage route `/` | Home V2 remains a separate preview track. |
| Downloading, purchasing, or committing final image files | This milestone defines strategy and candidate rules only. |
| Treating iStock as free | iStock is a paid licensed source. |
| Using AI generation as the default hero source | User requested avoiding AI generation where possible. |
| Copying website assets without license review | Every asset needs source and license metadata before use. |
| Claiming model/property release safety without verification | Identifiable people and locations require explicit risk notes. |
| Implementing React/Tailwind components | Asset insertion belongs to a later build milestone. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMG-01 | 236 | Pending |
| IMG-02 | 236 | Pending |
| IMG-03 | 236 | Pending |
| IMG-04 | 236 | Pending |
| IMG-05 | 237 | Pending |
| IMG-06 | 237 | Pending |
| IMG-07 | 237 | Pending |
| IMG-08 | 237 | Pending |
| IMG-09 | 238 | Pending |
| IMG-10 | 238 | Pending |
| IMG-11 | 238 | Pending |
| IMG-12 | 238 | Pending |
| IMG-13 | 239 | Pending |
| IMG-14 | 239 | Pending |
| IMG-15 | 239 | Pending |
| IMG-16 | 239 | Pending |

**Coverage:**
- v2.8 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-07-03*
*Last updated: 2026-07-03 after v2.8 milestone initialization*
