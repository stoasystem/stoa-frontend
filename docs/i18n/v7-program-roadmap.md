# v7 Program Roadmap

**Date:** 2026-07-07
**Status:** Planning handoff

## Program Goal

Make the full STOA frontend runtime-ready, readable, and visually stable in English, German, French, and Italian, while acknowledging Romansh in the language policy and preparing privacy/terms material for legal review.

## Milestones

### v7.1 Scope, Glossary, Tone Rules, Language Policy

Deliverables:

- final language policy
- Romansh deferral note
- reviewed terminology matrix
- forbidden terms list
- role-based tone rules
- P0/P1/P2 quality definitions

Exit criteria:

- All future v7 implementation has one language contract to follow.

### v7.2 Runtime Enablement And Language Controls

Deliverables:

- FR/IT runtime registration
- general `LanguageSwitcher` upgraded to EN/DE/FR/IT
- Home V2 desktop segmented language micro-control
- Home V2 mobile menu language chips
- persistence and active-state behavior
- focused tests

Exit criteria:

- User can switch EN/DE/FR/IT at runtime on public and app surfaces.

### v7.3 Public/Auth/Home Copy QA

Deliverables:

- P0 public/auth/Home route copy review
- Home V2 FR/IT launch-quality text
- pricing/support/contact/auth terms improved
- responsive screenshots for P0 public/auth routes

Exit criteria:

- Parent/public-facing launch routes feel composed and natural in all four launch languages.

### v7.4 Core Product Role Copy QA

Deliverables:

- student dashboard/chat/practice/classroom/library copy review
- parent visibility/reporting copy review
- tutor/teacher request/classroom copy review
- role-tone corrections
- route smoke verification

Exit criteria:

- Core learning workflows are readable and role-appropriate in all four launch languages.

### v7.5 Admin/Ops/Billing/Edge Coverage

Deliverables:

- admin/ops/billing/support-ticket locale coverage
- empty/loading/error/edge-state copy cleanup
- static missing-key and raw-English scans
- internal-term cleanup

Exit criteria:

- Lower-frequency surfaces do not break multilingual product quality.

### v7.6 Legal And Compliance Copy Research

Deliverables:

- legal source research notes
- unknown-facts register
- EN privacy and terms source drafts
- DE/FR/IT candidate legal translations
- review markers and risk notes

Exit criteria:

- Privacy/terms are ready for counsel or qualified legal-translator review.

### v7.7 Cross-Locale Visual QA And Release Handoff

Deliverables:

- P0 screenshot matrix
- P1 smoke matrix
- P2 static-scan results
- mobile fit report
- remaining known issues
- release handoff

Exit criteria:

- v7 can be closed with a clear multilingual readiness judgment.

## Dependency Order

```text
v7.1 -> v7.2 -> v7.3 -> v7.4 -> v7.5 -> v7.6 -> v7.7
```

Legal research can begin during v7.3/v7.4 if needed, but public reliance on legal copy must wait for v7.6 and review markers.

## Protected Boundaries

- Keep `/` unchanged unless a later switch-over milestone explicitly says otherwise.
- Keep Home V2 as preview until final asset, locale, SEO, routing, rollback, monitoring, and QA gates pass.
- Keep runtime Romansh deferred.
- Keep final legal approval outside the frontend team's authority.
