---
type: quick
status: complete
created: 2026-07-05
completed: 2026-07-05
---

# Summary

Refined the `/home-v2` Hero after a `grill-me` design clarification session.

## Changed

- Replaced the long Hero headline with shorter brand-level copy across EN/DE/FR/IT.
- Reduced the Hero visual from multiple overlapping proof layers to one main family-learning image and one minimal proof panel.
- Changed the secondary Hero CTA from product explanation to the parent path.
- Changed the floating navigation from `Start learning` to an easier-to-find but lower-noise `Log in` pill.
- Reduced desktop navigation to Parents, Teachers, and Pricing.
- Tuned mobile Hero reveal behavior so the image begins to appear after the CTA instead of leaving a blank lower viewport.

## Result

The Hero now follows the agreed design direction: 85% high-end education service, 15% product proof, with less visual clutter and clearer navigation semantics.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- Playwright direct Hero smoke against the running dev server passed for desktop and mobile.
