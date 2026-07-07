# Roadmap: STOA Frontend

## Milestones

- [x] **v7 Full-Site Multilingual Adaptation Execution** - Phases 284-290 (shipped 2026-07-07)
- [x] **v7.0 Full-Site Multilingual Adaptation Planning** - Phases 277-283 (shipped 2026-07-07)
- [x] **v6.6 Home V2 V6 Completion Handoff** - Phases 272-276 (shipped 2026-07-06)

## Phases

- [x] **Phase 284: Runtime Locale Enablement** - Register EN/DE/FR/IT runtime languages and preserve Romansh deferral.
- [x] **Phase 285: Language Controls Implementation** - Upgrade shared app switcher and add premium Home V2 desktop/mobile language controls.
- [x] **Phase 286: Public Auth Home Copy QA** - Verify public/auth/Home copy coverage and document P0 findings.
- [x] **Phase 287: Core Product Role Copy QA** - Verify student/parent/tutor core role copy coverage and document findings.
- [x] **Phase 288: Admin Ops Billing Edge Coverage** - Verify admin/ops/billing/support/edge multilingual coverage and document findings.
- [x] **Phase 289: Legal Privacy Terms Research Drafts** - Create legal source notes, unknown facts, EN drafts, and DE/FR/IT candidate translation structure.
- [x] **Phase 290: Cross Locale Verification And Handoff** - Run tests/checks, update docs, and close v7.

## Phase Details

### Phase 284: Runtime Locale Enablement

**Goal**: EN/DE/FR/IT work at runtime.
**Depends on**: Phase 283
**Requirements**: LANG-01, LANG-02, LANG-03, LANG-04
**Success Criteria**:
  1. `supportedLanguages` includes EN/DE/FR/IT.
  2. FR/IT resources are imported and registered.
  3. Document `lang`, persistence, validation, and preference code accept FR/IT.
  4. Romansh deferral is documented and not exposed as selectable UI.
**Plans**: 284-PLAN.md
**UI hint**: yes

### Phase 285: Language Controls Implementation

**Goal**: language controls are usable and premium where required.
**Depends on**: Phase 284
**Requirements**: CONTROL-01, CONTROL-02, CONTROL-03, CONTROL-04
**Success Criteria**:
  1. Shared switcher renders four launch languages.
  2. Home V2 desktop renders inline segmented EN/DE/FR/IT control.
  3. Home V2 mobile menu renders language chips.
  4. Home V2 uses no flags and no dropdown language control.
**Plans**: 285-PLAN.md
**UI hint**: yes

### Phase 286: Public Auth Home Copy QA

**Goal**: P0 public/auth/Home copy readiness is documented.
**Depends on**: Phase 285
**Requirements**: COPY-01, COPY-04
**Success Criteria**:
  1. Public/Auth/Home locale structures are checked.
  2. P0 copy issues and follow-ups are recorded.
  3. Raw AI/internal wording risk is scanned.
**Plans**: 286-PLAN.md
**UI hint**: yes

### Phase 287: Core Product Role Copy QA

**Goal**: student/parent/tutor core multilingual copy readiness is documented.
**Depends on**: Phase 286
**Requirements**: COPY-02, COPY-04
**Success Criteria**:
  1. Student core namespaces are checked.
  2. Parent namespaces are checked for visibility-without-surveillance tone.
  3. Tutor/teacher namespaces are checked for professional support tone.
**Plans**: 287-PLAN.md
**UI hint**: yes

### Phase 288: Admin Ops Billing Edge Coverage

**Goal**: lower-frequency multilingual surfaces are covered.
**Depends on**: Phase 287
**Requirements**: COPY-03, COPY-04
**Success Criteria**:
  1. Admin, billing, support, contact, errors, and edge-state namespaces are checked.
  2. Missing-key and raw-English risks are recorded.
  3. Follow-up risks are documented.
**Plans**: 288-PLAN.md
**UI hint**: yes

### Phase 289: Legal Privacy Terms Research Drafts

**Goal**: legal/privacy/terms draft material is ready for legal review.
**Depends on**: Phase 288
**Requirements**: LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04
**Success Criteria**:
  1. Primary source notes are documented.
  2. Unknown facts are listed.
  3. EN privacy/terms draft skeleton exists.
  4. DE/FR/IT candidate translation structure exists.
**Plans**: 289-PLAN.md
**UI hint**: no

### Phase 290: Cross Locale Verification And Handoff

**Goal**: v7 is verified and handed off.
**Depends on**: Phase 289
**Requirements**: QA-01, QA-02, QA-03, QA-04, QA-05
**Success Criteria**:
  1. i18n parity checks pass.
  2. Language-switching tests pass.
  3. Home V2 language-control tests pass.
  4. Lint/build pass.
  5. v7 handoff docs are complete.
**Plans**: 290-PLAN.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 284. Runtime Locale Enablement | 1/1 | Complete | 2026-07-07 |
| 285. Language Controls Implementation | 1/1 | Complete | 2026-07-07 |
| 286. Public Auth Home Copy QA | 1/1 | Complete | 2026-07-07 |
| 287. Core Product Role Copy QA | 1/1 | Complete | 2026-07-07 |
| 288. Admin Ops Billing Edge Coverage | 1/1 | Complete | 2026-07-07 |
| 289. Legal Privacy Terms Research Drafts | 1/1 | Complete | 2026-07-07 |
| 290. Cross Locale Verification And Handoff | 1/1 | Complete | 2026-07-07 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 284 | 4 | LANG-01, LANG-02, LANG-03, LANG-04 |
| 285 | 4 | CONTROL-01, CONTROL-02, CONTROL-03, CONTROL-04 |
| 286 | 2 | COPY-01, COPY-04 |
| 287 | 2 | COPY-02, COPY-04 |
| 288 | 2 | COPY-03, COPY-04 |
| 289 | 4 | LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04 |
| 290 | 5 | QA-01, QA-02, QA-03, QA-04, QA-05 |

**Total requirements:** 21
**Mapped requirements:** 21
**Unmapped requirements:** 0

## Next Up

v7 execution is complete. Future work should focus on full screenshot QA, legal review, or a separate `/home-v2` switch-over program.
