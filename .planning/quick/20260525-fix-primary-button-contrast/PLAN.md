---
status: complete
created: 2026-05-25
type: quick
---

# Fix primary button contrast

## Goal

Ensure primary CTA buttons on landing pages use readable light text against the deep navy primary background.

## Scope

- Update the shared Button default variant so all default primary buttons inherit the corrected text contrast.
- Verify the parent landing CTA and build-time checks.

## Acceptance

- `/for-parents` `View pricing` button has high-contrast readable text.
- Existing homepage `Start Learning` contrast remains readable.
- TypeScript and lint checks pass.
