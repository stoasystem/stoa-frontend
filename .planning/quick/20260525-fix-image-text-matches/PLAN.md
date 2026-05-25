---
status: complete
created: 2026-05-25
type: quick
---

# Fix image text matches

## Goal

Audit public marketing images and replace visuals that do not match their surrounding copy.

## Findings

- Homepage hero, learning flow, teacher fallback, teacher support, and study-material images match their sections.
- Parent hero image still crops to an apple/laptop and does not strongly show child growth.
- Homepage parent-visibility image shows a backpack/outdoor scene but claims parent and child reviewing schoolwork.
- Pricing image looks like a business laptop discussion, not a family learning plan.

## Scope

- Replace the parent hero image with a child doing homework at home.
- Replace the homepage parent-visibility image with a family online-learning scene.
- Replace the pricing image with a family online-learning scene.

## Acceptance

- Public page image alt text matches the visible image.
- Parent-facing visuals emphasize child learning/growth.
- Pricing visual reads as family learning support rather than generic business.
- TypeScript, lint, build, and Playwright image checks pass.
