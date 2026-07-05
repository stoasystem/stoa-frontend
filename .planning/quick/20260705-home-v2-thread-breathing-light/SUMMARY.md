---
type: quick
status: complete
created: 2026-07-05
completed: 2026-07-05
---

# Summary

Toned down the `/home-v2` Learning Thread active animation from scanning light to subtle breathing light.

## Changed

- Removed card surface sweep animation.
- Removed lit-rail travelling glint.
- Removed the rotating conic halo around the active spark.
- Kept only a slow, circular active spark core and soft halo breath.

## Result

The active card now has a restrained, warm breathing-light feel instead of a visible scanning/rotating effect.

## Verification

- Direct Playwright smoke confirmed only `spark-core` and `spark-breathe` remain active; sweep/glint/orbit pseudo-elements are gone.
- Screenshot check confirmed the light reads as a soft circular glow.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e -- home-v2.spec.ts`: passed.
