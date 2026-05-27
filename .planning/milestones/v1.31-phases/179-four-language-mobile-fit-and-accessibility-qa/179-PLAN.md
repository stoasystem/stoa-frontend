# Phase 179: Four-Language Mobile Fit and Accessibility QA - Plan

**Planned:** 2026-05-27
**Goal:** The Practice entry works across supported locales and viewports without layout, motion, or accessibility regressions.

## Requirements

- L10N33-01 through L10N33-08

## Tasks

1. Run browser viewport checks for EN/DE/FR/IT at 320, 375, 430, 768, 1024, and 1440 px.
2. Verify no horizontal overflow on the homepage Practice entry.
3. Verify localized Practice entry labels and preview topics are visible.
4. Check keyboard/action order for Start Practice and the secondary how-it-works link.
5. Check reduced-motion-safe implementation for hover movement.
6. Apply small layout/copy fixes if needed.
7. Record QA evidence and verification.

## Acceptance Criteria

- All four languages have Practice entry title, CTA, and preview topics.
- No tested viewport reports horizontal page overflow.
- German and French CTAs fit or wrap safely.
- Practice entry actions are accessible links in a logical order.
- Reduced-motion users are not forced into spatial hover motion.
