# Roadmap: STOA Frontend

## Milestones

- ✅ **v6.2 Home V2 Trust And Assurance Redesign** - Phases 252-256 (shipped 2026-07-05)
- ✅ **v6.1 Home V2 Parent Confidence Redesign** - Phases 248-251 (shipped 2026-07-05)
- ✅ **v4.0 新版路由与组件骨架** - Phases 244-247 (shipped 2026-07-04)
- ✅ **v3.1 Home V2 Candidate Image Search And Shortlist** - Phases 240-243 (shipped 2026-07-03)
- ✅ **v2.8 Home V2 Image And Asset Strategy** - Phases 236-239 (shipped 2026-07-03)
- ✅ **v2.7 Home V2 Visual Direction Design** - Phases 232-235 (shipped 2026-07-03)
- ✅ **v2.6 Home V2 Positioning and Information Architecture** - Phases 228-231 (shipped 2026-07-03)

## Phases

- [x] **Phase 252: Trust Art Direction And Asset Decision** - Lock the Trust image direction and decide whether the existing placeholder pool is sufficient.
- [x] **Phase 253: Trust Assurance Copy Contract** - Define the title, body, and assurance principles without slogan-heavy privacy or Swiss repetition.
- [x] **Phase 254: Trust Visual Structure Redesign** - Replace the feature-card grid with image-led editorial assurance and fine-line principles.
- [x] **Phase 255: Trust Assurance Implementation** - Update `HomeV2TrustLayer`, scoped styling, EN/DE/FR/IT copy, and approved placeholder/final image.
- [x] **Phase 256: Trust Verification And Visual QA** - Run technical gates, screenshot QA, and claim/image discipline checks.

## Phase Details

### Phase 252: Trust Art Direction And Asset Decision

**Goal**: The Trust/Assurance image direction is locked before layout implementation.
**Depends on**: Phase 251
**Requirements**: TA-02
**Success Criteria**:
  1. Existing Home V2 image candidates are reviewed for Trust/Assurance fit.
  2. Image acceptance criteria are recorded: warm, artistic, quiet, refined, and compatible with Swiss/European family education.
  3. The selected placeholder or source gap is documented with endorsement, identity, supervision, and stock-feel risk notes.
  4. Paid/commissioned image need is explicitly deferred if the current placeholder is only prototype-safe.
**Plans**: 252-PLAN.md
**UI hint**: yes

### Phase 253: Trust Assurance Copy Contract

**Goal**: The section has precise assurance language without privacy shouting or repeated Swiss labeling.
**Depends on**: Phase 252
**Requirements**: TA-01, TA-04
**Success Criteria**:
  1. Title and body are short, calm, and premium.
  2. Principle directions are concrete: enough context, support with boundaries, discussable progress, and no inflated promises.
  3. Copy avoids generic trust, compliance, privacy, AI, surveillance, monitoring, and feature-card language.
  4. EN/DE/FR/IT copy plan preserves the same restrained meaning naturally.
**Plans**: 253-PLAN.md
**UI hint**: yes

### Phase 254: Trust Visual Structure Redesign

**Goal**: The Trust section becomes an image-led editorial assurance layout rather than a card grid.
**Depends on**: Phase 253
**Requirements**: TA-03, TA-05
**Success Criteria**:
  1. Desktop layout composes image, title/body, and principle list as one editorial section.
  2. Principle rows use fine dividers, numbering, spacing, and restrained text rhythm.
  3. Narrow/tablet and mobile layouts stack without dense text, overlap, or image dominance.
  4. Existing Home V2 double-bezel depth is preserved without generic SaaS cards.
**Plans**: 254-PLAN.md
**UI hint**: yes

### Phase 255: Trust Assurance Implementation

**Goal**: `/home-v2` renders the redesigned Trust/Assurance section with scoped code changes.
**Depends on**: Phase 254
**Requirements**: TA-07
**Success Criteria**:
  1. `HomeV2TrustLayer.tsx` reflects the image-led assurance hierarchy.
  2. `home-v2-premium.css` changes are scoped to the Trust/Assurance section.
  3. EN/DE/FR/IT `homeV2` copy is updated only where v6.2 requires it.
  4. The current `/` homepage remains unchanged.
**Plans**: 255-PLAN.md
**UI hint**: yes

### Phase 256: Trust Verification And Visual QA

**Goal**: The redesigned section passes technical gates, responsive inspection, and claim/image discipline checks.
**Depends on**: Phase 255
**Requirements**: TA-06
**Success Criteria**:
  1. `npm run lint` passes.
  2. `npm run build` passes.
  3. `npm run test:e2e -- home-v2.spec.ts` passes.
  4. Desktop around 1440px, narrow/tablet around 900px, and mobile around 390px browser/screenshot checks show no incoherent overlap, image dominance, or text crowding.
  5. Copy avoids repeated "Swiss" and loud privacy claims; image does not imply surveillance or endorsement.
**Plans**: 256-PLAN.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 252. Trust Art Direction And Asset Decision | 1/1 | Complete | 2026-07-05 |
| 253. Trust Assurance Copy Contract | 1/1 | Complete | 2026-07-05 |
| 254. Trust Visual Structure Redesign | 1/1 | Complete | 2026-07-05 |
| 255. Trust Assurance Implementation | 1/1 | Complete | 2026-07-05 |
| 256. Trust Verification And Visual QA | 1/1 | Complete | 2026-07-05 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 252 | 1 | TA-02 |
| 253 | 2 | TA-01, TA-04 |
| 254 | 2 | TA-03, TA-05 |
| 255 | 1 | TA-07 |
| 256 | 1 | TA-06 |

**Total requirements:** 7
**Mapped requirements:** 7
**Unmapped requirements:** 0

## Next Up

v6.2 is complete. Trust/Assurance now uses an image-led editorial assurance layout with fine-line principles, restrained four-language copy, and verification evidence.
