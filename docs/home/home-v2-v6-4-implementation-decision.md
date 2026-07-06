# Home V2 v6.4 Implementation Decision

**Date:** 2026-07-06
**Scope:** `/home-v2` Hero and Parent Confidence assets

## Decision

No runtime implementation change.

The current preview images remain wired into `/home-v2`:

- Hero: `img/home-v2/preview/hero-family-study-table-preview.jpg`
- Parent Confidence: `img/home-v2/preview/father-son-laptop-preview.jpg`

## Reason

The available free-source candidates do not clearly outperform the current preview assets under the v6.4 acceptance contract. The current images are acceptable for preview and design discussion, but they should not be treated as final public homepage photography.

## What Did Not Change

- `/` homepage was not replaced.
- `/home-v2` route and components were not changed.
- No new image binaries were added.
- No paid or watermarked preview asset was committed.
- No AI-generated identifiable family/child imagery was introduced.

## Next Implementation Gate

Implementation should resume only after one of these happens:

1. A paid stock image is purchased and approved with a clear license path.
2. A commissioned Swiss/European family-learning shoot delivers approved final images.
3. The user explicitly accepts the current preview assets as temporary public assets despite the documented final-public weaknesses.
