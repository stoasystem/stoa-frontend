# Requirements: STOA Frontend v7

**Defined:** 2026-07-07
**Core Value:** The STOA frontend must be runtime-ready, readable, and visually stable in English, German, French, and Italian across the full product surface, with premium language controls, route-level QA evidence, lawyer-review privacy/terms draft material, and a clear acknowledgement that Romansh is intentionally deferred.

## v7 Requirements

### Language Policy And Runtime

- [x] **LANG-01**: EN/DE/FR/IT must be the launch runtime languages.
- [x] **LANG-02**: FR/IT locale resources must be registered in i18n runtime, not only present on disk.
- [x] **LANG-03**: Language persistence, document `lang`, and authenticated locale preference behavior must work for all four launch languages.
- [x] **LANG-04**: Romansh must be documented as acknowledged and deferred; it must not appear as a disabled or broken selectable UI language.

### Language Controls

- [x] **CONTROL-01**: Shared `LanguageSwitcher` must expose EN/DE/FR/IT.
- [x] **CONTROL-02**: Home V2 desktop header must include a premium inline segmented language control with lower visual weight than Login.
- [x] **CONTROL-03**: Home V2 mobile menu must include EN/DE/FR/IT language chips inside the expanded menu.
- [x] **CONTROL-04**: Language controls must avoid flags and avoid dropdown treatment on Home V2.

### Copy And Tone Coverage

- [x] **COPY-01**: Public/Home/Auth P0 surfaces must have launch-quality EN/DE/FR/IT copy coverage or documented review findings.
- [x] **COPY-02**: Student/Parent/Tutor core role surfaces must have role-appropriate multilingual copy coverage or documented review findings.
- [x] **COPY-03**: Admin/Ops/Billing/Support/edge surfaces must have coverage-quality multilingual checks or documented follow-up.
- [x] **COPY-04**: Visible product copy must continue downplaying raw AI language while preserving the Learning Assistant and teacher-backed support value.

### Legal And Compliance Draft Readiness

- [x] **LEGAL-01**: Legal research notes must cite primary Swiss/EU sources.
- [x] **LEGAL-02**: Privacy/Terms draft material must be marked as lawyer-review candidate text, not final legal advice.
- [x] **LEGAL-03**: Unknown operational facts must be listed before legal text can be finalized.
- [x] **LEGAL-04**: EN source drafts and DE/FR/IT candidate legal translation structure must exist.

### QA And Handoff

- [x] **QA-01**: Key i18n structures must be checked for EN/DE/FR/IT parity.
- [x] **QA-02**: Runtime language switching must be verified by tests.
- [x] **QA-03**: Home V2 language controls must be covered by tests.
- [x] **QA-04**: Build and lint must pass.
- [x] **QA-05**: v7 completion docs must record verification, deferred risks, and next steps.

## Out of Scope

| Item | Reason |
|------|--------|
| Replacing `/` with `/home-v2` | Requires separate switch-over approval. |
| Runtime Romansh | Acknowledged and deferred until justified. |
| Broad redesign | v7 allows language-control and fit work only. |
| Final legal approval | Requires qualified legal review. |
| New backend/product features | v7 is multilingual adaptation and readiness. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LANG-01 | 284 | Complete |
| LANG-02 | 284 | Complete |
| LANG-03 | 284 | Complete |
| LANG-04 | 284 | Complete |
| CONTROL-01 | 285 | Complete |
| CONTROL-02 | 285 | Complete |
| CONTROL-03 | 285 | Complete |
| CONTROL-04 | 285 | Complete |
| COPY-01 | 286 | Complete |
| COPY-02 | 287 | Complete |
| COPY-03 | 288 | Complete |
| COPY-04 | 286, 287, 288 | Complete |
| LEGAL-01 | 289 | Complete |
| LEGAL-02 | 289 | Complete |
| LEGAL-03 | 289 | Complete |
| LEGAL-04 | 289 | Complete |
| QA-01 | 290 | Complete |
| QA-02 | 290 | Complete |
| QA-03 | 290 | Complete |
| QA-04 | 290 | Complete |
| QA-05 | 290 | Complete |

**Coverage:**
- v7 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-07-07*
*Last updated: 2026-07-07 after completing v7 execution*
