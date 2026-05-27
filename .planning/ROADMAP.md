# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.33 Phase 35: Practice Roadmap UI, Lesson Progression, and Challenge Journey Experience** - Phases 186-190 (shipped 2026-05-27)
- ⏳ **v1.34 Phase 36: Engineering Quality, CI Reliability, and Local Workflow Hardening** - Phases 191-194 (in progress)

## Phases

- [ ] **Phase 191: CI Failure Reproduction and ESLint Environment Fix** - Reproduce the GitHub Actions lint failure locally, fix the Node/browser ESLint boundary, and verify lint/build parity for the known failure.
- [ ] **Phase 192: Tooling, Script, and Workflow Drift Audit** - Audit npm scripts, GitHub Actions, TypeScript/Vite config, lockfile state, ignore rules, and generated artifacts for drift; fix low-risk issues that would cause repeat CI failures.
- [ ] **Phase 193: Local Quality Gate Verification and Targeted Smoke Checks** - Run the repository's core quality gates and targeted local smoke checks, record results, and classify any residual risks.
- [ ] **Phase 194: Documentation, Milestone Audit, and Handoff** - Update developer docs and planning state with the verified workflow, quality-gate expectations, and any intentionally deferred follow-ups.

## Phase Details

### Phase 191: CI Failure Reproduction and ESLint Environment Fix

**Goal**: The observed `Frontend CI / build` failure is reproduced locally and fixed at the tooling configuration boundary.
**Depends on**: Phase 190
**Requirements**: CI36-01, CI36-02, CONFIG36-01, CONFIG36-02, QA36-01
**Success Criteria** (what must be TRUE):
  1. The current CI command sequence is identified from `.github/workflows/frontend-ci.yml`.
  2. The local lint failure is reproduced before fixing.
  3. Node-executed scripts such as `scripts/vite.mjs` are linted with the correct Node globals.
  4. Browser application source remains linted without weakening the general quality gate.
  5. `npm run lint` and `npm run build` pass after the fix.
**Plans**: 191-PLAN.md
**UI hint**: no

### Phase 192: Tooling, Script, and Workflow Drift Audit

**Goal**: The frontend toolchain is audited for configuration drift that could create more false CI failures or local/CI mismatch.
**Depends on**: Phase 191
**Requirements**: SCRIPT36-01, SCRIPT36-02, CONFIG36-03, CONFIG36-04, HYGIENE36-01, HYGIENE36-02
**Success Criteria** (what must be TRUE):
  1. `package.json`, `package-lock.json`, npm scripts, and `.github/workflows/frontend-ci.yml` are checked for command and dependency consistency.
  2. TypeScript, Vite, ESLint, Playwright, and Node script configuration boundaries are inspected.
  3. `.gitignore` protects generated artifacts such as `node_modules/`, `dist/`, local env files, and test reports.
  4. Any low-risk drift found during the audit is fixed.
  5. Any risky or out-of-scope drift is documented instead of silently changed.
**Plans**: 192-PLAN.md
**UI hint**: no

### Phase 193: Local Quality Gate Verification and Targeted Smoke Checks

**Goal**: The repaired workflow is validated through local commands that mirror CI and through targeted smoke checks for the affected developer surfaces.
**Depends on**: Phase 192
**Requirements**: QA36-01, QA36-02, QA36-03, QA36-04
**Success Criteria** (what must be TRUE):
  1. `npm run lint` passes.
  2. `npm run build` passes.
  3. Dependency-install parity is checked or explicitly explained if skipped.
  4. Targeted smoke checks cover the scripts or routes most likely affected by configuration changes.
  5. Verification evidence is recorded in phase or milestone artifacts.
**Plans**: 193-PLAN.md
**UI hint**: no

### Phase 194: Documentation, Milestone Audit, and Handoff

**Goal**: Developers can understand why CI failed, what was fixed, which commands are authoritative, and what remains deferred.
**Depends on**: Phase 193
**Requirements**: DOC36-01, DOC36-02, DOC36-03, QA36-05
**Success Criteria** (what must be TRUE):
  1. README or developer documentation reflects the current CI/local quality-gate workflow.
  2. Planning artifacts summarize root cause, fix, verification, and deferred follow-ups.
  3. Requirements traceability maps every v1.34 requirement to one phase.
  4. Milestone audit confirms all v1.34 requirements are complete or explicitly deferred.
  5. Repository status is clean except for intentional committed changes.
**Plans**: 194-PLAN.md
**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 191. CI Failure Reproduction and ESLint Environment Fix | 0/1 | Pending | — |
| 192. Tooling, Script, and Workflow Drift Audit | 0/1 | Pending | — |
| 193. Local Quality Gate Verification and Targeted Smoke Checks | 0/1 | Pending | — |
| 194. Documentation, Milestone Audit, and Handoff | 0/1 | Pending | — |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 191 | 5 | CI36-01, CI36-02, CONFIG36-01, CONFIG36-02, QA36-01 |
| 192 | 6 | SCRIPT36-01, SCRIPT36-02, CONFIG36-03, CONFIG36-04, HYGIENE36-01, HYGIENE36-02 |
| 193 | 4 | QA36-01, QA36-02, QA36-03, QA36-04 |
| 194 | 4 | DOC36-01, DOC36-02, DOC36-03, QA36-05 |

**Total requirements:** 18
**Mapped requirements:** 18
**Unmapped requirements:** 0

## Next Up

Phase 191 should reproduce and fix the CI lint failure before broader workflow audit work continues.
