# Roadmap: STOA Frontend

## Milestones

- [ ] **v9 Home V2 Final Issue Cleanup** - Phases 298-303 (active)
- [x] **v8 Home V2 Visual QA And Switch Decision** - Phases 291-297 (shipped 2026-07-07)
- [x] **v7 Full-Site Multilingual Adaptation Execution** - Phases 284-290 (shipped 2026-07-07)
- [x] **v7.0 Full-Site Multilingual Adaptation Planning** - Phases 277-283 (shipped 2026-07-07)

## Phases

- [x] **Phase 298: v9 Scope And Acceptance Contract** - Lock cleanup scope, acceptance gates, and no-route-switch boundary.
- [x] **Phase 299: Home V2 Responsive Fixes** - Fix localized Hero overflow, mobile image rhythm, final CTA fit, and nav visibility.
- [x] **Phase 300: Legal Page Presentation Cleanup** - Make legal pages read as complete public-facing drafts while keeping review status internal.
- [x] **Phase 301: SEO Routing Rollback Plan** - Add basic metadata and document future canonical/sitemap/rollback route-switch requirements.
- [x] **Phase 302: Verification Pass** - Re-run screenshots, layout audits, legal render checks, lint, build, and Home V2 E2E.
- [x] **Phase 303: Final Readiness Decision** - Produce the v9 final decision and remaining switch-over conditions.

## Phase Details

### Phase 298: v9 Scope And Acceptance Contract

**Goal**: v9 has a precise implementation boundary and acceptance contract.
**Depends on**: v8
**Requirements**: SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04
**Success Criteria**:
  1. Current `/` is explicitly preserved.
  2. `/home-v2` is the only cleanup target.
  3. v8 blockers are mapped into v9 work.
  4. Final decision labels are defined before verification.
**Plans**: 298-PLAN.md
**UI hint**: no

### Phase 299: Home V2 Responsive Fixes

**Goal**: Home V2 no longer fails on localized mobile/desktop layout fit.
**Depends on**: Phase 298
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05
**Success Criteria**:
  1. FR mobile has no body-level horizontal overflow.
  2. FR/IT long Hero titles stay inside their containers.
  3. Mobile Hero image reads as a composed frame, not a full-screen takeover.
  4. Final CTA tolerates long localized text.
  5. Header navigation labels are more legible.
**Plans**: 299-PLAN.md
**UI hint**: yes

### Phase 300: Legal Page Presentation Cleanup

**Goal**: legal pages look complete enough for internal testing without visibly declaring unfinished status.
**Depends on**: Phase 299
**Requirements**: LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04
**Success Criteria**:
  1. `/privacy` and `/terms` no longer expose draft/review/candidate framing in page hero copy.
  2. Page text avoids claiming final legal approval.
  3. Unresolved legal facts remain documented internally.
  4. EN/DE/FR/IT legal pages render.
**Plans**: 300-PLAN.md
**UI hint**: no

### Phase 301: SEO Routing Rollback Plan

**Goal**: Home V2 has basic metadata now and a documented route-switch plan later.
**Depends on**: Phase 300
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, ASSET-01, ASSET-02, ASSET-03
**Success Criteria**:
  1. Default document metadata is product-appropriate.
  2. Home V2 and legal routes set route-level title/meta.
  3. Future canonical/sitemap/old-home/rollback plan is documented.
  4. Current preview images have explicit temporary-public approval status.
**Plans**: 301-PLAN.md
**UI hint**: no

### Phase 302: Verification Pass

**Goal**: v9 fixes are verified with browser and command evidence.
**Depends on**: Phase 301
**Requirements**: VERIFY-01, VERIFY-02, VERIFY-03, VERIFY-04
**Success Criteria**:
  1. `/home-v2` EN/DE/FR/IT desktop and mobile screenshots are captured outside the repo.
  2. Layout audit reports no critical body overflow.
  3. Legal render audit passes in EN/DE/FR/IT.
  4. Lint, build, and Home V2 relevant E2E pass.
**Plans**: 302-PLAN.md
**UI hint**: yes

### Phase 303: Final Readiness Decision

**Goal**: v9 has a clear, non-launch final decision.
**Depends on**: Phase 302
**Requirements**: SCOPE-04
**Success Criteria**:
  1. Final decision is recorded as Ready for switch-over planning, Conditional, or Still No-Go.
  2. Remaining public-launch conditions are explicit.
  3. `/` remains unchanged.
  4. Handoff is ready for the next stage.
**Plans**: 303-PLAN.md
**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 298. v9 Scope And Acceptance Contract | 1/1 | Complete | 2026-07-07 |
| 299. Home V2 Responsive Fixes | 1/1 | Complete | 2026-07-07 |
| 300. Legal Page Presentation Cleanup | 1/1 | Complete | 2026-07-07 |
| 301. SEO Routing Rollback Plan | 1/1 | Complete | 2026-07-07 |
| 302. Verification Pass | 1/1 | Complete | 2026-07-07 |
| 303. Final Readiness Decision | 1/1 | Complete | 2026-07-07 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 298 | 4 | SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04 |
| 299 | 5 | LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05 |
| 300 | 4 | LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04 |
| 301 | 7 | SEO-01, SEO-02, SEO-03, SEO-04, ASSET-01, ASSET-02, ASSET-03 |
| 302 | 4 | VERIFY-01, VERIFY-02, VERIFY-03, VERIFY-04 |
| 303 | 1 | SCOPE-04 |

**Total requirements:** 25
**Mapped requirements:** 25
**Unmapped requirements:** 0

## Next Up

v9 is in execution. Final output should be a verified readiness decision for switch-over planning, not a route replacement.
