# Roadmap: STOA Frontend

## Milestones

- ✅ **v2.8 Home V2 Image And Asset Strategy** - Phases 236-239 (shipped 2026-07-03)
- ✅ **v2.6 Home V2 Positioning and Information Architecture** - Phases 228-231 (shipped 2026-07-03)
- ✅ **v2.7 Home V2 Visual Direction Design** - Phases 232-235 (shipped 2026-07-03)

## Phases

- [x] **Phase 236: Source Policy And Licensing Screen** - Define source hierarchy, source-specific license rules, risk checks, and AI-use boundaries.
- [x] **Phase 237: Section Asset Briefs And Search Taxonomy** - Define asset briefs, search language, candidate scoring, and rejection criteria for each Home V2 section.
- [x] **Phase 238: Asset Metadata, Storage, And Optimization Strategy** - Define metadata ledger, storage namespace, responsive crop, optimization, and shortlist process.
- [x] **Phase 239: Asset Handoff, Approval Gates, And QA Readiness** - Define implementation handoff, approval gates, deferred scope, and QA readiness for later asset insertion.

## Phase Details

### Phase 236: Source Policy And Licensing Screen

**Goal**: Home V2 has a clear source and licensing policy that prioritizes real licensed imagery and avoids AI generation by default.
**Depends on**: Phase 235
**Requirements**: IMG-01, IMG-02, IMG-03, IMG-04
**Success Criteria**:
  1. Pexels, iStock, Magnific, and similar sources have source-specific usage notes.
  2. Free, paid, stock, AI-assisted, and approval-gated sources are distinguished.
  3. Licensing, attribution, release, endorsement, and trademark risks are documented.
  4. AI generation is defined as last-resort scope, not the default.
**Plans**: 236-PLAN.md
**UI hint**: no

### Phase 237: Section Asset Briefs And Search Taxonomy

**Goal**: Every Home V2 section has a precise asset brief, search taxonomy, candidate scoring criteria, and rejection rules.
**Depends on**: Phase 236
**Requirements**: IMG-05, IMG-06, IMG-07, IMG-08
**Success Criteria**:
  1. Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, and Final CTA each have asset briefs.
  2. Search terms cover Swiss-parent, family-learning, high-end education, teacher support, and progress-proof imagery.
  3. Candidate scoring balances authenticity, Swiss fit, premium tone, crop flexibility, diversity, and non-stock feel.
  4. Rejection criteria block AI-looking, staged, surveillance, negative, or unsupported-outcome imagery.
**Plans**: 237-PLAN.md
**UI hint**: yes

### Phase 238: Asset Metadata, Storage, And Optimization Strategy

**Goal**: Future asset insertion can use a repeatable metadata, storage, crop, optimization, and shortlist process.
**Depends on**: Phase 237
**Requirements**: IMG-09, IMG-10, IMG-11, IMG-12
**Success Criteria**:
  1. Candidate assets have a metadata ledger format.
  2. Future local files have a Home V2 namespace and naming convention.
  3. Crop ratios and responsive image expectations are documented.
  4. Shortlist work can proceed without committing final binaries in this milestone.
**Plans**: 238-PLAN.md
**UI hint**: no

### Phase 239: Asset Handoff, Approval Gates, And QA Readiness

**Goal**: Later Home V2 implementation can insert approved assets with clear approval, alt text, responsive variant, and visual QA gates.
**Depends on**: Phase 238
**Requirements**: IMG-13, IMG-14, IMG-15, IMG-16
**Success Criteria**:
  1. Handoff includes alt text intent, responsive variant needs, and implementation checklist.
  2. Paid assets, identifiable people, AI-edited assets, and hero imagery have approval gates.
  3. Current `/`, React components, localized JSON, and asset imports remain unchanged.
  4. The image and asset strategy document is self-contained.
  5. `git diff --check` passes for documentation changes.
**Plans**: 239-PLAN.md
**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 236. Source Policy And Licensing Screen | 1/1 | Complete | 2026-07-03 |
| 237. Section Asset Briefs And Search Taxonomy | 1/1 | Complete | 2026-07-03 |
| 238. Asset Metadata, Storage, And Optimization Strategy | 1/1 | Complete | 2026-07-03 |
| 239. Asset Handoff, Approval Gates, And QA Readiness | 1/1 | Complete | 2026-07-03 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 236 | 4 | IMG-01, IMG-02, IMG-03, IMG-04 |
| 237 | 4 | IMG-05, IMG-06, IMG-07, IMG-08 |
| 238 | 4 | IMG-09, IMG-10, IMG-11, IMG-12 |
| 239 | 4 | IMG-13, IMG-14, IMG-15, IMG-16 |

**Total requirements:** 16
**Mapped requirements:** 16
**Unmapped requirements:** 0

## Next Up

v2.8 is complete. Next Home V2 milestone should cover candidate asset search/shortlist, asset acquisition/insertion, or implementation scaffolding depending on priority.
