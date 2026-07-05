---
type: quick
status: complete
created: 2026-07-05
completed: 2026-07-05
---

# Summary

Polished the `/home-v2` Learning Thread glow and active-card breathing light.

## Changed

- Added a travelling glint to the lit timeline rail.
- Added active-card light sweep across the inner card surface.
- Added active spark core breathing plus a rotating halo layer around the gold dot.
- Kept the motion transform/opacity-based and disabled the new light layers for `prefers-reduced-motion`.

## Result

The active Learning Thread card now has a perceptible warm pulse and light-flow effect while staying restrained and premium.

## Verification

- Direct Playwright smoke confirmed active `spark-core`, `spark-orbit`, thread `glint`, and card light-sweep animations are applied.
- Screenshot check confirmed the active gold dot is visibly stronger.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e -- home-v2.spec.ts`: passed.
