# Project Research: Features For v4.0 Home V2 Skeleton

**Milestone:** v4.0 新版路由与组件骨架
**Date:** 2026-07-04
**Scope:** Feature behavior expected from a previewable Home V2 skeleton.

## Table Stakes

### Isolated Preview Route

- `/home-v2` renders independently of `/`.
- Current `/` remains unchanged.
- Route is public and accessible without authentication.
- Route appears in public route grouping for inventory/documentation consistency.

### Page Composition

The skeleton must render the locked five-section IA:

1. Hero
2. Learning Thread
3. Parent Confidence
4. Swiss Trust Layer
5. Final CTA

This should be visible enough to validate rhythm and structure. Empty divs are not sufficient.

### Component Namespace

Expected component boundaries:

- `HomeV2Page`
- `HomeV2Hero`
- `HomeV2LearningThread`
- `HomeV2ParentConfidence`
- `HomeV2TrustLayer`
- `HomeV2FinalCta`
- Optional shared local components such as `HomeV2Section`, `HomeV2VisualFrame`, or `HomeV2PrimaryCta`

### CTA Behavior

Primary CTA label remains `Start learning`.

CTA targets should follow the existing role-aware direction from IA:

- logged out: registration-first or login-first learning entry
- student: Practice or current learning entry
- parent: `/parent`
- tutor: `/tutor`
- admin: `/admin`

v4.0 can implement this with the same auth-store pattern used by the current home hero, but should avoid changing auth or registration behavior.

### Preview-Quality Layout

The skeleton should include:

- desktop editorial split Hero
- stable mobile single-column fallbacks
- visible hint of the next section below Hero
- double-bezel placeholder surfaces
- learning-thread sequence, not a generic equal-card feature grid
- final CTA with restrained close

### Multilingual Skeleton Readiness

The route should use a `homeV2` i18n namespace rather than hard-coded text. v4.0 can use provisional copy, but the route should already compile with EN/DE/FR/IT resource files.

## Differentiators

### Home V2 Visual Contract Enforcement

The skeleton should encode the v2.7 constraints early:

- editorial split
- macro whitespace
- double-bezel evidence surfaces
- role-based typography
- calm transform/opacity reveals
- no decorative gradient orbs
- no generic SaaS 3-column feature grid as the main structure

### Asset-Aware Placeholders

The skeleton should anticipate later asset insertion by reserving:

- Hero image frame ratio.
- Learning-thread visual slots.
- Trust/place detail slot.
- Final CTA detail slot.

These should not be one-off decorative blocks that later require layout rewrites.

### Future QA Hooks

The route should include stable section identifiers or headings that make Playwright/browser smoke checks straightforward later.

## Anti-Features

- Replacing `/`.
- Adding public nav switch-over to Home V2.
- Final image optimization.
- Final localized marketing copy.
- Full animation choreography.
- New backend/API behavior.
- Registration/quota behavior changes.
- AI-forward hero messaging.
- Production claims about OCR, guaranteed improvement, live teacher availability, or compliance.

## Complexity Notes

- Low backend complexity: frontend route and components only.
- Medium frontend risk: current router is large and route grouping must stay consistent.
- Medium design risk: skeleton must be visible enough to validate layout without becoming premature final visual implementation.
- Medium i18n risk: current i18n file imports need explicit resource wiring; adding `homeV2` must include all supported locales.
