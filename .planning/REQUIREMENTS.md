# Requirements: STOA Frontend v1.34

**Defined:** 2026-05-27
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with reliable local and CI quality gates.

## v1 Requirements

### CI Reliability

- [ ] **CI36-01**: Developer can identify the authoritative GitHub Actions command sequence for frontend CI.
- [ ] **CI36-02**: Developer can reproduce the reported CI lint failure locally before accepting a fix.

### Tooling Configuration

- [ ] **CONFIG36-01**: Node-executed repository scripts are linted with Node globals and module semantics.
- [ ] **CONFIG36-02**: Browser React/TypeScript source remains linted without broad suppression of quality rules.
- [ ] **CONFIG36-03**: TypeScript, Vite, ESLint, and Playwright configuration files are checked for environment-boundary drift.
- [ ] **CONFIG36-04**: Low-risk configuration drift that can cause false CI failures is fixed.

### Scripts and Dependency Hygiene

- [ ] **SCRIPT36-01**: `package.json` npm scripts align with the commands run by CI.
- [ ] **SCRIPT36-02**: `package-lock.json` and dependency metadata are consistent with the package manifest.
- [ ] **HYGIENE36-01**: Generated artifacts and local-only files remain ignored and uncommitted.
- [ ] **HYGIENE36-02**: Risky or out-of-scope drift is documented instead of silently changed.

### Verification

- [ ] **QA36-01**: `npm run lint` passes after the tooling fix.
- [ ] **QA36-02**: `npm run build` passes after the tooling fix.
- [ ] **QA36-03**: Dependency install parity is checked or explicitly explained if skipped.
- [ ] **QA36-04**: Targeted smoke checks cover the scripts or routes most likely affected by configuration changes.
- [ ] **QA36-05**: Milestone audit confirms all v1.34 requirements are complete or explicitly deferred.

### Documentation

- [ ] **DOC36-01**: Developer documentation explains the current CI/local quality-gate workflow.
- [ ] **DOC36-02**: Planning artifacts record root cause, implemented fix, verification, and residual risk.
- [ ] **DOC36-03**: Requirements traceability maps every v1.34 requirement to exactly one phase.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Quality Automation

- **QA-AUTO-01**: CI can run a broader browser smoke suite on pull requests when runtime cost and flakiness are acceptable.
- **QA-AUTO-02**: CI can publish structured lint/build/test artifacts for easier debugging from notification emails.
- **QA-AUTO-03**: CI can run backend harness tests when Python environment setup is standardized for GitHub Actions.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Product feature expansion | This milestone is limited to engineering quality and workflow reliability. |
| Broad UI redesign | CI reliability does not require changing user-facing design. |
| New dependency stack | The current problem should be fixed with existing ESLint/npm configuration unless a reproducible tooling gap demands otherwise. |
| Production backend changes | The reported failure is in frontend CI and local frontend tooling. |
| Full Playwright matrix in CI | Useful later, but this milestone focuses on current CI parity and low-risk local smoke verification. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CI36-01 | Phase 191 | Complete |
| CI36-02 | Phase 191 | Complete |
| CONFIG36-01 | Phase 191 | Complete |
| CONFIG36-02 | Phase 191 | Complete |
| CONFIG36-03 | Phase 192 | Pending |
| CONFIG36-04 | Phase 192 | Pending |
| SCRIPT36-01 | Phase 192 | Pending |
| SCRIPT36-02 | Phase 192 | Pending |
| HYGIENE36-01 | Phase 192 | Pending |
| HYGIENE36-02 | Phase 192 | Pending |
| QA36-01 | Phase 193 | Complete |
| QA36-02 | Phase 193 | Pending |
| QA36-03 | Phase 193 | Pending |
| QA36-04 | Phase 193 | Pending |
| DOC36-01 | Phase 194 | Pending |
| DOC36-02 | Phase 194 | Pending |
| DOC36-03 | Phase 194 | Pending |
| QA36-05 | Phase 194 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-05-27*
*Last updated: 2026-05-27 after milestone definition*
