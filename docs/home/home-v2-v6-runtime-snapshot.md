# Home V2 v6 Runtime Snapshot

**Date:** 2026-07-06
**Route:** `/home-v2`

## Route And Page

- Page: `src/pages/home-v2/HomeV2Page.tsx`
- Route: `/home-v2`
- Current public `/`: unchanged

## Components

- `src/components/home-v2/HomeV2PremiumHeader.tsx`
- `src/components/home-v2/HomeV2Hero.tsx`
- `src/components/home-v2/HomeV2LearningThread.tsx`
- `src/components/home-v2/HomeV2ParentConfidence.tsx`
- `src/components/home-v2/HomeV2TrustLayer.tsx`
- `src/components/home-v2/HomeV2FinalCta.tsx`
- `src/components/home-v2/HomeV2Cta.tsx`
- `src/components/home-v2/HomeV2Reveal.tsx`
- `src/components/home-v2/HomeV2VisualFrame.tsx`

## Styles

- `src/styles/home-v2-premium.css`

The style layer contains Home V2 scoped tokens, reveal behavior, image tone, Learning Thread motion, Parent/Trust surfaces, and Final CTA material light.

## Images Currently Wired

| Role | File | Status |
|------|------|--------|
| Hero | `img/home-v2/preview/hero-family-study-table-preview.jpg` | Preview-approved only |
| Parent Confidence | `img/home-v2/preview/father-son-laptop-preview.jpg` | Preview-approved only |
| Trust/detail | `img/home-v2/preview/study-desk-writing-preview.jpg` | Preview/public-risk lower because it is a non-face detail |

## Locales

| Locale | `homeV2` Resource | Runtime Status |
|--------|-------------------|----------------|
| EN | `src/i18n/locales/en/homeV2.json` | Registered |
| DE | `src/i18n/locales/de/homeV2.json` | Registered |
| FR | `src/i18n/locales/fr/homeV2.json` | Resource exists, not registered |
| IT | `src/i18n/locales/it/homeV2.json` | Resource exists, not registered |

## Test Coverage

`tests/e2e/home-v2.spec.ts` covers Home V2 route rendering and key section behavior. v6.1, v6.2, and v6.3 verification recorded passing Home V2 E2E. v6.4-v6.6 are documentation/decision milestones and do not change runtime code.

## Runtime Gaps

- Final Hero and Parent images are not implemented because approved final source files do not exist.
- FR/IT `homeV2` runtime enablement is not complete.
- SEO and `/` switch-over routing are not implemented.
- Final visual regression after approved photography remains future work.

## v6 Closure

No additional runtime code is required to close v6. Runtime changes should resume only in a final asset implementation or switch-over milestone.
