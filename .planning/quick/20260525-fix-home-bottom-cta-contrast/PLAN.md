---
status: complete
created: 2026-05-25
type: quick
---

# Fix home bottom CTA contrast

## Goal

Make the homepage bottom `Start Learning` CTA readable on its light button background.

## Scope

- Change the bottom homepage CTA to use the light/secondary button path instead of the default primary path.
- Verify rendered contrast on the homepage.

## Acceptance

- Bottom homepage `Start Learning` renders dark text on the ivory button.
- Header and hero `Start Learning` primary buttons remain light text on dark buttons.
- TypeScript, lint, and build pass.
