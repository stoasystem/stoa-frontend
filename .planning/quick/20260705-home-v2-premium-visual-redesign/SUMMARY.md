---
type: quick
status: complete
created: 2026-07-05
completed: 2026-07-05
---

# Summary

Reworked `/home-v2` after design feedback that the preview looked too similar to the current homepage.

## Changed

- Added a Home V2 scoped premium visual system in `src/styles/home-v2-premium.css`.
- Replaced the shared marketing header on `/home-v2` with a floating island navigation and mobile morph menu.
- Rebuilt the Hero as an Editorial Luxury / Z-Axis Cascade composition with layered candidate imagery.
- Reworked Learning Thread, Parent Confidence, Trust Layer, and Final CTA away from flat equal-card layouts.
- Added Home V2-specific CTA and scroll reveal components.
- Replaced internal preview/skeleton copy with family-facing copy across EN/DE/FR/IT `homeV2` files.
- Generated compressed Home V2 preview JPEGs under `img/home-v2/preview/` instead of importing a 3MB+ original candidate image.

## Result

The `/home-v2` route now has a visibly separate high-end homepage direction while preserving the current `/` homepage and keeping final public switch-over out of scope.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- Playwright direct smoke against the running dev server passed for all Home V2 sections.
- Desktop and mobile screenshot spot checks passed after fixing CTA contrast and first-viewport CTA visibility.
