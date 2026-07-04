---
status: ready
created: 2026-07-04
---

# Phase 246: Preview Layout And Visual Skeleton - Context

**Gathered:** 2026-07-04
**Mode:** Auto-generated because `workflow.skip_discuss=true`

## Phase Boundary

The `/home-v2` route needs to become a previewable skeleton with real section rhythm and responsive layout.

## Implementation Decisions

- Strengthen layout without inserting final images.
- Add stable section IDs and test hooks for later visual QA.
- Preserve desktop editorial split and mobile single-column behavior.
- Use placeholder visual/proof surfaces with stable aspect ratios.

## Existing Code Insights

- Home V2 section components already exist from Phase 245.
- Tailwind CSS v4 arbitrary classes work in the existing Vite setup.
- Existing brand tokens provide paper, card, charcoal, burgundy, warm grey, and gold values.

## Deferred Ideas

- Full animation choreography.
- Optimized image insertion.
- Browser screenshot QA.
