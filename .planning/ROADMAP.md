# Roadmap: STOA Frontend

## Milestones

- ✅ **v3.1 Home V2 Candidate Image Search And Shortlist** - Phases 240-243 (shipped 2026-07-03)
- ✅ **v2.8 Home V2 Image And Asset Strategy** - Phases 236-239 (shipped 2026-07-03)
- ✅ **v2.7 Home V2 Visual Direction Design** - Phases 232-235 (shipped 2026-07-03)
- ✅ **v2.6 Home V2 Positioning and Information Architecture** - Phases 228-231 (shipped 2026-07-03)

## Phases

- [x] **Phase 240: Search Source Screen And Candidate Pool** - Search candidate sources, apply license/source screening, and assemble the first Home V2 candidate pool.
- [x] **Phase 241: High-End Visual Scoring And Shortlist** - Score candidates against v2.7 high-end visual direction and select section-level shortlist recommendations.
- [x] **Phase 242: Download Metadata And Local Asset Ledger** - Download suitable free candidates, verify files, and record complete metadata.
- [x] **Phase 243: Handoff QA And Next Asset Insertion Plan** - Close the shortlist milestone with handoff, QA notes, and next-scope boundaries.

## Phase Details

### Phase 240: Search Source Screen And Candidate Pool

**Goal**: Home V2 has a searched, source-screened candidate pool for each section.
**Depends on**: Phase 239
**Requirements**: ASSET-01, ASSET-02, ASSET-03, ASSET-04
**Success Criteria**:
  1. Pexels candidate search produces section-relevant free candidates.
  2. iStock and Magnific remain documented as approval-gated or account-gated sources.
  3. Candidate records include source URL, creator/vendor, source type, and licensing status.
  4. No ambiguous, AI-looking, watermarked, or paid assets are downloaded as final-ready assets.
**Plans**: 240-PLAN.md
**UI hint**: no

### Phase 241: High-End Visual Scoring And Shortlist

**Goal**: Candidate images are scored through the Home V2 premium visual contract before local use.
**Depends on**: Phase 240
**Requirements**: ASSET-05, ASSET-06, ASSET-07, ASSET-08
**Success Criteria**:
  1. Each candidate has authenticity, Swiss-parent fit, learning relevance, crop flexibility, diversity/age fit, brand fit, and risk scores.
  2. Selected candidates support Editorial Luxury and Editorial Split without generic AI or SaaS feeling.
  3. Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, and Final CTA each have recommended or backup assets.
  4. Deferred or rejected candidates include a reason.
**Plans**: 241-PLAN.md
**UI hint**: yes

### Phase 242: Download Metadata And Local Asset Ledger

**Goal**: Suitable free assets are downloaded into a traceable Home V2 candidate namespace.
**Depends on**: Phase 241
**Requirements**: ASSET-09, ASSET-10, ASSET-11, ASSET-12
**Success Criteria**:
  1. Downloaded Pexels candidates are stored under `img/home-v2/candidates/pexels/`.
  2. Local filenames include source and asset IDs.
  3. Metadata ledger maps every local file back to source and license information.
  4. File type, dimensions, and repository status are verified.
**Plans**: 242-PLAN.md
**UI hint**: no

### Phase 243: Handoff QA And Next Asset Insertion Plan

**Goal**: The shortlist is ready for a later Home V2 implementation milestone.
**Depends on**: Phase 242
**Requirements**: ASSET-13, ASSET-14, ASSET-15, ASSET-16
**Success Criteria**:
  1. `docs/home/home-v2-image-shortlist.md` is self-contained.
  2. Paid/source-gated candidates are separated from downloaded candidates.
  3. Current `/`, React code, routes, and localization files remain unchanged.
  4. Next milestone can crop/optimize/insert assets without reopening source strategy.
  5. `git diff --check` passes.
**Plans**: 243-PLAN.md
**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 240. Search Source Screen And Candidate Pool | 1/1 | Complete | 2026-07-03 |
| 241. High-End Visual Scoring And Shortlist | 1/1 | Complete | 2026-07-03 |
| 242. Download Metadata And Local Asset Ledger | 1/1 | Complete | 2026-07-03 |
| 243. Handoff QA And Next Asset Insertion Plan | 1/1 | Complete | 2026-07-03 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 240 | 4 | ASSET-01, ASSET-02, ASSET-03, ASSET-04 |
| 241 | 4 | ASSET-05, ASSET-06, ASSET-07, ASSET-08 |
| 242 | 4 | ASSET-09, ASSET-10, ASSET-11, ASSET-12 |
| 243 | 4 | ASSET-13, ASSET-14, ASSET-15, ASSET-16 |

**Total requirements:** 16
**Mapped requirements:** 16
**Unmapped requirements:** 0

## Next Up

v3.1 is complete. Next Home V2 milestone should choose final assets, crop and optimize responsive variants, insert them into the `/home-v2` implementation, and run screenshot QA before any `/` switch decision.
