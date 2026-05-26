# Visual Compatibility QA

**Phase:** 19 / v1.18
**Date:** 2026-05-26

## Goal

Confirm the STOA learning platform now feels visually aligned with the company homepage while remaining an independent app surface.

Target ratings:

- Brand similarity: medium-high.
- Product independence: high.
- Visual quality: high.

## Source Policy

`/Users/zhdeng/newweb` remained read-only. The source repository still shows the pre-existing external change:

```text
 M img/team/.DS_Store
```

No Phase 19 work modified that source project.

## Screenshots Captured

Playwright screenshots were captured from the local Vite server:

| Surface | Viewport | Screenshot |
|---------|----------|------------|
| Homepage | 1440 x 900 | `/private/tmp/stoa-phase19-home-final.png` |
| Register | 390 x 844 | `/private/tmp/stoa-phase19-register-final.png` |
| Pricing | 1440 x 900 | `/private/tmp/stoa-phase19-pricing-final.png` |
| Chat route | 1440 x 900 | `/private/tmp/stoa-phase19-chat-final.png` |

Note: `/chat` redirects to login in unauthenticated browser smoke mode, so the captured route verifies the protected-route/auth visual surface. Chat component styling was also reviewed through code and build verification.

## Surface Ratings

| Surface | Brand similarity | Product independence | Visual quality | Notes |
|---------|------------------|----------------------|----------------|-------|
| Homepage | medium-high | high | high | Warm editorial layout, burgundy/charcoal palette, education image treatment, and app-specific Learning Assistant copy remain distinct from the homepage. |
| Register mobile | medium-high | high | high | Strong brand heading, warm card, low-radius role cards, and stable mobile wrapping. |
| Pricing | medium-high | high | high | Brand-aligned pricing cards and hero panel without aggressive sales styling. |
| Login/auth fallback | medium-high | high | high | Protected routes resolve into branded auth surface with clear form hierarchy. |
| Chat components | medium | high | medium-high | Chat uses warm app shell, card-like input, and restrained burgundy accents while preserving app readability. |
| Dashboard/report components | medium | high | medium-high | Dashboard cards stay dense; parent report gets warmer editorial surface and summary treatment. |

## Checklist

- [x] Learning platform feels like a STOA brand-family product.
- [x] Learning platform does not look like a direct copy of the company homepage.
- [x] Homepage carries the strongest brand alignment.
- [x] Login/register carry premium trust signals.
- [x] Chat remains product-app focused.
- [x] Dashboard remains practical and scannable.
- [x] Parent report gets a warmer education-service treatment.
- [x] Pricing and billing use the translated brand language.
- [x] German stacked hero title support is preserved.
- [x] Long labels and multilingual button wrapping are not globally constrained by uppercase styling.
- [x] Mobile register layout remains usable.
- [x] Build passes after visual changes.
- [x] Lint passes after visual changes.

## Verification Commands

```bash
npm run build
npm run lint
npm run dev -- --host 127.0.0.1
npx playwright screenshot --viewport-size=1440,900 --wait-for-timeout=1200 http://127.0.0.1:5173/ /private/tmp/stoa-phase19-home-final.png
npx playwright screenshot --viewport-size=390,844 --wait-for-timeout=1200 http://127.0.0.1:5173/register /private/tmp/stoa-phase19-register-final.png
npx playwright screenshot --viewport-size=1440,900 --wait-for-timeout=1200 http://127.0.0.1:5173/pricing /private/tmp/stoa-phase19-pricing-final.png
npx playwright screenshot --viewport-size=1440,900 --wait-for-timeout=1200 http://127.0.0.1:5173/chat /private/tmp/stoa-phase19-chat-final.png
```

## Handoff Notes

- A fuller authenticated app visual pass should be repeated in Phase 20 with seeded demo login and route-by-route screenshots.
- The current pass verifies public/auth/pricing visuals and code-level app styling.
- No accessibility or cross-browser release gate is claimed here; that remains Phase 20 scope.
