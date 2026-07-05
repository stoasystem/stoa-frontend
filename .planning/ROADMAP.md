# Roadmap: STOA Frontend

## Milestones

- ⏳ **v6.2 Home V2 Trust And Assurance Redesign** - Planned
- ✅ **v6.1 Home V2 Parent Confidence Redesign** - Phases 248-251 (shipped 2026-07-05)
- ✅ **v4.0 新版路由与组件骨架** - Phases 244-247 (shipped 2026-07-04)
- ✅ **v3.1 Home V2 Candidate Image Search And Shortlist** - Phases 240-243 (shipped 2026-07-03)
- ✅ **v2.8 Home V2 Image And Asset Strategy** - Phases 236-239 (shipped 2026-07-03)
- ✅ **v2.7 Home V2 Visual Direction Design** - Phases 232-235 (shipped 2026-07-03)
- ✅ **v2.6 Home V2 Positioning and Information Architecture** - Phases 228-231 (shipped 2026-07-03)

## Phases

- [x] **Phase 248: Parent Confidence Audit And Copy Contract** - Lock the parent-facing emotional promise and remove dashboard-like wording before implementation.
- [x] **Phase 249: Parent Confidence Visual Structure** - Define the warm image-plus-note composition, responsive proportions, and proof surface behavior.
- [x] **Phase 250: Parent Confidence Implementation** - Update the Home V2 Parent Confidence component, scoped styles, and required EN/DE/FR/IT copy.
- [x] **Phase 251: Parent Confidence Verification And Polish** - Run quality gates, inspect desktop/tablet/mobile layouts, and fix visual density or responsive issues.

## Phase Details

### Phase 248: Parent Confidence Audit And Copy Contract

**Goal**: The section has a clear emotional contract: parents stay close without anxiously taking over homework.
**Depends on**: Phase 247
**Requirements**: PC-01
**Success Criteria**:
  1. Current `HomeV2ParentConfidence` layout, overlays, image use, and copy are audited.
  2. Dashboard-like, monitoring-heavy, AI-forward, or feature-list wording is identified for removal or softening.
  3. Final title/body/proof-note direction is defined before component edits.
  4. EN/DE/FR/IT copy changes keep the same semantic promise rather than literal translation.
**Plans**: 248-PLAN.md
**UI hint**: yes

### Phase 249: Parent Confidence Visual Structure

**Goal**: The section has a premium image-plus-note composition instead of a multi-pill feature overlay.
**Depends on**: Phase 248
**Requirements**: PC-02, PC-03
**Success Criteria**:
  1. The image treatment feels warm and family-oriented without implying surveillance or parent control.
  2. One restrained progress-note/proof surface replaces the current pill stack.
  3. Desktop, narrow/tablet, and mobile layout proportions are defined before styling.
  4. Existing Home V2 double-bezel depth is preserved without nested-card clutter.
**Plans**: 249-PLAN.md
**UI hint**: yes

### Phase 250: Parent Confidence Implementation

**Goal**: `/home-v2` renders the redesigned Parent Confidence section with scoped code changes.
**Depends on**: Phase 249
**Requirements**: PC-04
**Success Criteria**:
  1. `HomeV2ParentConfidence.tsx` reflects the new parent reassurance hierarchy.
  2. `home-v2-premium.css` changes are scoped to the section and do not destabilize other Home V2 sections.
  3. EN/DE/FR/IT `homeV2` copy is updated only where v6.1 requires it.
  4. The current `/` homepage remains unchanged.
**Plans**: 250-PLAN.md
**UI hint**: yes

### Phase 251: Parent Confidence Verification And Polish

**Goal**: The redesigned section passes technical gates and visual inspection across target viewports.
**Depends on**: Phase 250
**Requirements**: PC-05, PC-06
**Success Criteria**:
  1. `npm run lint` passes.
  2. `npm run build` passes.
  3. `npm run test:e2e -- home-v2.spec.ts` passes.
  4. Desktop around 1440px, narrow/tablet around 900px, and mobile around 390px browser/screenshot checks show no incoherent overlap, image dominance, or text crowding.
  5. Verification notes capture any remaining deferred asset/copy risks.
**Plans**: 251-PLAN.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 248. Parent Confidence Audit And Copy Contract | 1/1 | Complete | 2026-07-05 |
| 249. Parent Confidence Visual Structure | 1/1 | Complete | 2026-07-05 |
| 250. Parent Confidence Implementation | 1/1 | Complete | 2026-07-05 |
| 251. Parent Confidence Verification And Polish | 1/1 | Complete | 2026-07-05 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 248 | 1 | PC-01 |
| 249 | 2 | PC-02, PC-03 |
| 250 | 1 | PC-04 |
| 251 | 2 | PC-05, PC-06 |

**Total requirements:** 6
**Mapped requirements:** 6
**Unmapped requirements:** 0

## Next Up

v6.1 is complete. v6.2 should follow with the image-led Trust/Assurance redesign once approved.
