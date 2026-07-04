# Roadmap: STOA Frontend

## Milestones

- ◆ **v4.0 新版路由与组件骨架** - Phases 244-247 (planning)
- ✅ **v3.1 Home V2 Candidate Image Search And Shortlist** - Phases 240-243 (shipped 2026-07-03)
- ✅ **v2.8 Home V2 Image And Asset Strategy** - Phases 236-239 (shipped 2026-07-03)
- ✅ **v2.7 Home V2 Visual Direction Design** - Phases 232-235 (shipped 2026-07-03)
- ✅ **v2.6 Home V2 Positioning and Information Architecture** - Phases 228-231 (shipped 2026-07-03)

## Phases

- [x] **Phase 244: Home V2 Route And Public Inventory** - Add the isolated `/home-v2` public preview route while preserving the current `/` homepage and route inventory.
- [x] **Phase 245: Home V2 Component Namespace And i18n Skeleton** - Create the Home V2 page/component namespace and provisional `homeV2` i18n resources.
- [x] **Phase 246: Preview Layout And Visual Skeleton** - Build the previewable five-section layout with responsive rhythm and placeholder-safe proof surfaces.
- [ ] **Phase 247: Boundaries Verification And Handoff** - Verify lint/build, document deferred work, and close v4.0 with route/component handoff.

## Phase Details

### Phase 244: Home V2 Route And Public Inventory

**Goal**: Home V2 has a public preview route that is reachable without changing the existing homepage.
**Depends on**: Phase 243
**Requirements**: ROUTE-01, ROUTE-02, ROUTE-03
**Success Criteria**:
  1. `/home-v2` renders through `AppRouter` as a public route.
  2. `/` still renders the existing `HomePage` and current homepage component tree.
  3. `routeGroups.public` includes `/home-v2`.
  4. No auth, registration, quota, protected-route, or role-dashboard behavior changes are introduced.
**Plans**: 244-PLAN.md
**UI hint**: yes

### Phase 245: Home V2 Component Namespace And i18n Skeleton

**Goal**: Home V2 has an isolated page/component namespace and provisional multilingual copy plumbing.
**Depends on**: Phase 244
**Requirements**: SKEL-01, SKEL-02, SKEL-03, I18N-01, I18N-02, I18N-03
**Success Criteria**:
  1. `src/pages/home-v2/HomeV2Page.tsx` exists and owns the Home V2 page composition.
  2. `src/components/home-v2/` contains section-level Home V2 components.
  3. Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, and Final CTA all render.
  4. `homeV2` is registered in the i18n namespace list and resource setup.
  5. EN/DE/FR/IT provisional `homeV2.json` resources exist and visible skeleton copy reads from them.
**Plans**: 245-PLAN.md
**UI hint**: yes

### Phase 246: Preview Layout And Visual Skeleton

**Goal**: The `/home-v2` route becomes a previewable skeleton with real section rhythm and responsive layout.
**Depends on**: Phase 245
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03
**Success Criteria**:
  1. The page has visible layout rhythm, CTA placement, and placeholder media/proof surfaces.
  2. Hero uses an editorial split on desktop and a stable single-column mobile fallback.
  3. The five-section scroll narrative reads as one learning thread, not a generic feature-card grid.
  4. The skeleton avoids decorative gradient orbs, AI-forward hero language, nested page-section cards, and one-note palette behavior.
  5. Placeholder visual frames reserve later asset/proof slots without treating candidate images as final assets.
**Plans**: 246-PLAN.md
**UI hint**: yes

### Phase 247: Boundaries Verification And Handoff

**Goal**: v4.0 is verified and handed off as a route/component skeleton milestone, with later implementation work clearly deferred.
**Depends on**: Phase 246
**Requirements**: BOUND-01, VERIFY-01, VERIFY-02
**Success Criteria**:
  1. v4.0 explicitly excludes final image optimization, full animation choreography, final copywriting, screenshot QA, and `/` switch-over.
  2. `npm run lint` passes.
  3. `npm run build` passes.
  4. Documentation records route/component decisions, verification results, and deferred follow-up milestones.
  5. Current `/` remains unchanged after implementation verification.
**Plans**: 247-PLAN.md
**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 244. Home V2 Route And Public Inventory | 1/1 | Complete | 2026-07-04 |
| 245. Home V2 Component Namespace And i18n Skeleton | 1/1 | Complete | 2026-07-04 |
| 246. Preview Layout And Visual Skeleton | 1/1 | Complete | 2026-07-04 |
| 247. Boundaries Verification And Handoff | 0/1 | Pending | — |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 244 | 3 | ROUTE-01, ROUTE-02, ROUTE-03 |
| 245 | 6 | SKEL-01, SKEL-02, SKEL-03, I18N-01, I18N-02, I18N-03 |
| 246 | 3 | LAYOUT-01, LAYOUT-02, LAYOUT-03 |
| 247 | 3 | BOUND-01, VERIFY-01, VERIFY-02 |

**Total requirements:** 15
**Mapped requirements:** 15
**Unmapped requirements:** 0

## Next Up

Phase 244 should plan the route and public inventory changes first:

```text
$gsd-plan-phase 247
```
