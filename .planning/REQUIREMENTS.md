# Requirements: STOA Frontend

**Defined:** 2026-05-26
**Milestone:** v1.17 Phase 18: Production-Facing Cleanup, Stability Hardening, and Demo Artifact Removal
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent demo flows, multilingual Swiss-market language support, natural locale-specific product copy, production-facing user language, and a clean path to future real backend integration.

## v1.17 Requirements

Requirements for Phase 18. Each requirement maps to exactly one roadmap phase.

### Audit Calibration and Scope Control

- [ ] **AUDIT18-01**: Developers can review `docs/qa/production-facing-copy-audit.md` to see the Phase 18 route, locale, state, and banned-term audit scope.
- [ ] **AUDIT18-02**: Developers can review `docs/qa/demo-artifact-removal-checklist.md` to understand which demo, mock, test, sample, placeholder, Codex, development, and internal terms are prohibited in normal user-facing UI.
- [ ] **AUDIT18-03**: Developers can review `docs/qa/stability-hardening-checklist.md` to see the Phase 18 loading, empty, error, success, duplicate-submit, and route-fallback stability checks.
- [ ] **AUDIT18-04**: The milestone has a calibrated source inventory that separates rendered product copy, developer-only UI, internal identifiers, tests, fixtures, documentation, and backend/API contract strings.
- [ ] **AUDIT18-05**: The milestone records P0, P1, and P2 cleanup priorities without expanding STOA into new business features, new languages, production payment, production backend work, or a redesign.
- [ ] **AUDIT18-06**: Existing demo mechanics needed for local development and E2E are identified before any UI cleanup removes or gates them.

### Environment Guards and Demo Surface Isolation

- [ ] **GUARD18-01**: `src/lib/env.ts` exposes typed, semantic public configuration for demo accounts, demo badges, checkout preview, demo surfaces, and internal debug visibility.
- [ ] **GUARD18-02**: Demo accounts are hidden by default from normal login, register, homepage, and user-facing help paths unless an explicit demo/development flag enables them.
- [ ] **GUARD18-03**: Demo badges, demo-only navigation, mock/virtual checkout affordances, and internal debug surfaces are hidden by default in production-facing and staging-pilot modes.
- [ ] **GUARD18-04**: Demo-only routes or placeholder surfaces are either gated, redirected, or relabeled so normal users do not see development language.
- [ ] **GUARD18-05**: `InternalDebugPanel` or equivalent developer diagnostics are available only in development with an explicit debug flag and do not expose secrets, tokens, passwords, or full private chat content.
- [ ] **GUARD18-06**: Local/demo workflows and E2E flows that depend on demo accounts, demo fallback, or virtual checkout remain available under explicit non-production flags.

### Production-Facing Copy Cleanup

- [ ] **COPY18-01**: Homepage, login, register, onboarding, chat, parent, parent report, tutor, pricing, billing, support, and admin primary surfaces do not show user-facing `demo`, `mock`, `test account`, `Codex`, `fake`, `sample`, `placeholder`, `development`, or equivalent internal wording in normal mode.
- [ ] **COPY18-02**: Register and onboarding copy presents account setup, role selection, student, parent, and teacher paths as real product flows instead of demo onboarding paths or public admin-account rules.
- [ ] **COPY18-03**: Login copy does not display demo account credentials or test-account shortcuts in normal mode.
- [ ] **COPY18-04**: Chat copy does not expose provider, model, Codex, mock assistant, mock response, or internal backend wording.
- [ ] **COPY18-05**: Parent dashboard and report copy does not expose demo child, sample report, or alarmist progress language.
- [ ] **COPY18-06**: Tutor and teacher-help copy does not expose mock request, demo student, raw queue status, or teacher-as-backup wording.
- [ ] **COPY18-07**: Pricing and billing copy does not expose mock checkout, fake subscription, virtual payment, or aggressive `buy now` phrasing; if payment is not live, the UI uses product-safe preparation/contact wording.
- [ ] **COPY18-08**: Support, feedback, toast, loading, empty, error, and success states use localized, user-friendly copy instead of internal/debug/provider/backend terms.
- [ ] **COPY18-09**: English, German, French, and Italian locale files are updated together for all changed P0 user-facing copy.

### Display Labels and User-Facing Text Boundaries

- [ ] **LABEL18-01**: `src/lib/displayLabels.ts` or equivalent mapping prevents raw internal statuses from rendering directly in user-facing UI.
- [ ] **LABEL18-02**: Teacher-help statuses, support ticket statuses, billing/subscription statuses, onboarding/review statuses, attachment states, route statuses, and admin/learning statuses render through localized user-facing labels.
- [ ] **LABEL18-03**: `SafeStatusLabel` or equivalent shared component handles unknown, empty, deprecated, or internal status values with product-safe fallback copy.
- [ ] **LABEL18-04**: `src/lib/userFacingText.ts` or equivalent helper sanitizes backend/API errors so endpoint names, provider names, raw exception text, internal codes, and mock/demo terms do not reach users.
- [ ] **LABEL18-05**: UI code avoids direct display of snake_case, kebab-case, raw enum IDs, route IDs, plan IDs, API status strings, and fallback demo-data labels.
- [ ] **LABEL18-06**: User-facing label mappings preserve internal identifiers where useful for code stability, but the rendered text remains localized and product-safe.

### Stability Hardening

- [ ] **STATE18-01**: Login and register submissions cannot be accidentally submitted twice while pending, and failed submissions remain retryable.
- [ ] **STATE18-02**: Chat message sends, attachment sends, retry actions, and teacher-help requests cannot create duplicate requests through repeated clicks while pending.
- [ ] **STATE18-03**: Tutor status updates, support ticket submissions, billing/checkout actions, uploads, and partnership/support forms use pending guards and preserve user input on failure.
- [ ] **STATE18-04**: Core query surfaces handle loading, error, empty, and success states for auth, chat, parent, parent report, tutor, pricing, billing, support, and admin flows.
- [ ] **STATE18-05**: Empty states for no conversations, no parent children, no reports, no tutor requests, no billing usage, and no support tickets do not crash and provide a clear next action or expectation.
- [ ] **STATE18-06**: API errors render user-friendly recovery actions such as retry, return, contact support, or sign in, without exposing backend internals.
- [ ] **STATE18-07**: Unknown routes, unauthorized routes, forbidden role access, unknown roles, and gated demo-only routes resolve to user-friendly fallback pages or redirects.
- [ ] **STATE18-08**: Stability hardening preserves existing route behavior and demo/E2E coverage unless the roadmap explicitly gates a surface in production-facing mode.

### QA Evidence and Documentation

- [ ] **QA18-01**: Production-facing copy audit evidence confirms normal user-facing P0/P1 surfaces do not expose prohibited demo/mock/test/Codex/development/sample/placeholder wording.
- [ ] **QA18-02**: Environment guard evidence confirms demo accounts, demo badges, demo-only UI, checkout previews, and internal debug panels are hidden by default and visible only under explicit allowed flags.
- [ ] **QA18-03**: Raw-status audit evidence confirms user-facing P0/P1 surfaces do not display internal status IDs or unlocalized fallback labels.
- [ ] **QA18-04**: Runtime/browser QA covers P0 pages: homepage, login, register, chat, pricing, billing, parent report, tutor, and support in normal production-facing mode.
- [ ] **QA18-05**: Multilingual QA confirms cleaned P0 copy is available in English, German, French, and Italian without English-only fallback on changed keys.
- [ ] **QA18-06**: Verification confirms `npm install`, `npm run dev`, and `npm run build` are documented or executed as appropriate for Phase 18 closure.
- [ ] **QA18-07**: README documents Phase 18 production-facing cleanup, demo-artifact removal, environment guards, state hardening, and the rule that demo backend mechanics may exist internally but must not leak into normal UI.
- [ ] **QA18-08**: Phase 18 handoff notes identify any remaining deferred accessibility, cross-browser, visual regression, or release-gate work for Phase 19.

## Future Requirements

Deferred to later milestones. Tracked but not in the current roadmap.

### Phase 19 Accessibility, Cross-Browser QA, and Release Quality Gate

- **A11Y19-01**: App has accessibility audit coverage for keyboard navigation, screen reader labels, focus states, language attributes, color contrast, route changes, forms, and chat status updates.
- **A11Y19-02**: Critical workflows are usable with keyboard-only navigation and announce dynamic loading, error, and success states to assistive technologies.
- **XBROWSER19-01**: App has cross-browser QA evidence for the main supported browsers and mobile device classes.
- **VISUAL19-01**: App has visual regression or screenshot comparison coverage for major route surfaces across supported languages and viewports.
- **PERF19-01**: App has a performance sanity check for core flows and public pages.
- **RELEASE19-01**: Team can run a final pre-launch release quality gate with accessibility, browser, locale, performance, and documentation criteria.

### Production Backend and Payments

- **BACKEND-01**: Formal backend implements production authentication, authorization, persistence, AI orchestration, payment webhooks, subscription enforcement, analytics storage, support workflows, admin operations, parent invitations, tutor verification, and preferred language persistence.
- **PAYMENT-01**: Formal billing implementation supports real checkout sessions, payment status, subscription lifecycle, receipts, cancellation, and support workflows.
- **AWS-01**: Production infrastructure deploys through a separately planned backend/cloud milestone.

### Future Localization

- **L10N-SEO-01**: App can support locale-aware SEO metadata and route strategy if STOA moves beyond demo/pilot surfaces.
- **L10N-CMS-01**: Team can manage high-volume translated content through a CMS or translation platform if content volume grows.
- **L10N-LEGAL-01**: Legal copy receives professional translation and legal review before broad public launch.
- **L10N-EMAIL-01**: Email templates can be localized if STOA adds production email flows.

## Out of Scope

Explicitly excluded from v1.17 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New product modules | Phase 18 cleans and hardens existing surfaces only. |
| New languages | Phase 18 keeps English, German, French, and Italian from Phase 16 and Phase 17. |
| Broad visual redesign | Phase 18 can adjust UI states and guards, but not redesign the product. |
| Formal backend implementation | Phase 18 may protect frontend rendering boundaries, but backend architecture remains unchanged. |
| Real payment collection | Phase 18 must avoid implying live checkout where only demo or preparation flows exist. |
| Real tutor verification | Phase 18 can clean tutor copy and states, but not implement operational verification. |
| Production AWS deployment | Infrastructure work remains outside this frontend cleanup milestone. |
| CMS or translation platform | Existing locale JSON remains the source of user-facing copy. |
| Full legal document review | Legal-sensitive copy remains draft/product language until professional legal review. |
| Large architecture rewrite | Phase 18 adds narrow guards, mappings, and state hardening in existing patterns. |
| Accessibility release gate | Deferred to Phase 19 except where changed states must remain accessible. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT18-01 | Phase 103 | Planned |
| AUDIT18-02 | Phase 103 | Planned |
| AUDIT18-03 | Phase 103 | Planned |
| AUDIT18-04 | Phase 103 | Planned |
| AUDIT18-05 | Phase 103 | Planned |
| AUDIT18-06 | Phase 103 | Planned |
| GUARD18-01 | Phase 104 | Planned |
| GUARD18-02 | Phase 104 | Planned |
| GUARD18-03 | Phase 104 | Planned |
| GUARD18-04 | Phase 104 | Planned |
| GUARD18-05 | Phase 104 | Planned |
| GUARD18-06 | Phase 104 | Planned |
| COPY18-01 | Phase 105 | Planned |
| COPY18-02 | Phase 105 | Planned |
| COPY18-03 | Phase 105 | Planned |
| COPY18-04 | Phase 105 | Planned |
| COPY18-05 | Phase 105 | Planned |
| COPY18-06 | Phase 105 | Planned |
| COPY18-07 | Phase 105 | Planned |
| COPY18-08 | Phase 105 | Planned |
| COPY18-09 | Phase 105 | Planned |
| LABEL18-01 | Phase 105 | Planned |
| LABEL18-02 | Phase 105 | Planned |
| LABEL18-03 | Phase 105 | Planned |
| LABEL18-04 | Phase 105 | Planned |
| LABEL18-05 | Phase 105 | Planned |
| LABEL18-06 | Phase 105 | Planned |
| STATE18-01 | Phase 106 | Planned |
| STATE18-02 | Phase 106 | Planned |
| STATE18-03 | Phase 106 | Planned |
| STATE18-04 | Phase 106 | Planned |
| STATE18-05 | Phase 106 | Planned |
| STATE18-06 | Phase 106 | Planned |
| STATE18-07 | Phase 106 | Planned |
| STATE18-08 | Phase 106 | Planned |
| QA18-01 | Phase 107 | Planned |
| QA18-02 | Phase 107 | Planned |
| QA18-03 | Phase 107 | Planned |
| QA18-04 | Phase 107 | Planned |
| QA18-05 | Phase 107 | Planned |
| QA18-06 | Phase 107 | Planned |
| QA18-07 | Phase 107 | Planned |
| QA18-08 | Phase 107 | Planned |

**Coverage:**
- v1.17 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 before Phase 103 planning*
