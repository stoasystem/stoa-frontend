# Requirements: v8 Home V2 Visual QA And Switch Decision

## Core Value

v8 must give a defensible, screenshot-backed decision on whether `/home-v2` is ready to enter switch-over planning. It must not modify the product, submit QA screenshots, or replace the current `/` homepage.

## Requirements

### Scope And Evidence

- [ ] **SCOPE-01**: `/home-v2` is the primary QA object; current `/` is comparison-only.
- [ ] **SCOPE-02**: v8 produces a report and decision only; code fixes and design changes are deferred to v9.
- [ ] **SCOPE-03**: Raw screenshots are stored under `/private/tmp/stoa-home-v2-v8/` and are not committed.
- [ ] **SCOPE-04**: v8 does not replace `/home-v2` with `/` and does not launch publicly.

### Screenshot QA

- [ ] **SHOT-01**: Capture `/home-v2` full-page screenshots for EN/DE/FR/IT on desktop.
- [ ] **SHOT-02**: Capture `/home-v2` full-page screenshots for EN/DE/FR/IT on mobile.
- [ ] **SHOT-03**: Capture current `/` comparison screenshots on desktop and mobile.
- [ ] **SHOT-04**: Record viewport, route, language, file path, and pass/fail notes for every screenshot.

### Visual Quality

- [ ] **VISUAL-01**: Evaluate `/home-v2` against the agreed thesis: Swiss private-school / high-end education service 70%, modern learning product 30%.
- [ ] **VISUAL-02**: Review Hero, Parent Confidence, Learning Thread, Trust, final CTA, navigation, Login, and language controls.
- [ ] **VISUAL-03**: Treat final-public image readiness as a hard Go/No-Go gate.
- [ ] **VISUAL-04**: Review motion for warmth, restraint, readability, and reduced-motion safety.

### Cross-Locale Content And Layout

- [ ] **LOCALE-01**: Check EN/DE/FR/IT layout for overflow, overlap, awkward wrapping, and mobile crop failures.
- [ ] **LOCALE-02**: Review copy tone for Apple-like confidence, restraint, clarity, and absence of AI-heavy claims.
- [ ] **LOCALE-03**: Verify navigation, Login, and language controls remain easy to find in every language.

### Legal Draft Readiness

- [ ] **LEGAL-01**: Verify `/privacy` and `/terms` are complete, readable drafts suitable for internal testing and lawyer review.
- [ ] **LEGAL-02**: Avoid page-level claims that the legal pages are final, legal-ready, or visibly unfinished placeholders.
- [ ] **LEGAL-03**: Identify unresolved legal facts separately in internal QA notes, not as disruptive public-page copy.
- [ ] **LEGAL-04**: Treat incomplete legal drafts as a launch-risk blocker, not as the main visual QA axis.

### Switch Readiness

- [ ] **SWITCH-01**: Check title/meta/canonical/sitemap readiness needed before any future `/home-v2` switch-over.
- [ ] **SWITCH-02**: Check old-homepage preservation and rollback path.
- [ ] **SWITCH-03**: Check basic analytics/monitoring and post-switch verification needs.
- [ ] **SWITCH-04**: Produce a switch-over readiness appendix separate from the visual verdict.

### Decision And Handoff

- [ ] **DECISION-01**: Produce a Go / Conditional Go / No-Go decision.
- [ ] **DECISION-02**: If No-Go or Conditional Go, create a precise v9 remediation backlog with evidence, severity, and suggested treatment.
- [ ] **DECISION-03**: Separate visual readiness from final public launch readiness.
- [ ] **DECISION-04**: Preserve current `/` until a later explicit switch-over phase.

## Out Of Scope

- Runtime code fixes.
- Major copy rewriting.
- Image replacement, optimization, or new asset downloads.
- Screenshot binary commits.
- Legal advice or final legal approval.
- Public launch or route replacement.

## Traceability

| Requirement | Phase |
|-------------|-------|
| SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04 | 291 |
| SHOT-01, SHOT-02, SHOT-03, SHOT-04 | 292 |
| VISUAL-01, VISUAL-02, VISUAL-03, VISUAL-04 | 293 |
| LOCALE-01, LOCALE-02, LOCALE-03 | 294 |
| LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04 | 295 |
| SWITCH-01, SWITCH-02, SWITCH-03, SWITCH-04 | 296 |
| DECISION-01, DECISION-02, DECISION-03, DECISION-04 | 297 |
