# Home V2 v8 Visual QA And Switch Decision

**Date:** 2026-07-07  
**Primary route:** `/home-v2`  
**Comparison route:** `/`  
**Decision:** No-Go for switch-over now  
**No runtime code changes in v8:** yes  
**Raw screenshot directory:** `/private/tmp/stoa-home-v2-v8/`

## Executive Decision

`/home-v2` is the better visual direction for STOA's Swiss parent-facing homepage. It feels calmer, more premium, more editorial, and much less like a dense AI/product SaaS page than the current `/`.

It is not ready to replace `/` yet.

The blockers are practical, not conceptual:

- final-public Hero and Parent imagery is not approved;
- FR mobile has real horizontal overflow;
- the mobile Hero first screen still feels clipped;
- legal pages are complete drafts but visibly present themselves as lawyer-review drafts;
- SEO, routing, sitemap/canonical, and rollback are not switch-ready.

## Visual Quality

### What Works

- The desktop composition now reads closer to "Swiss private-school / high-end education service" than the old homepage.
- The page uses restrained whitespace, editorial serif hierarchy, muted warm materials, and section pacing that feels more premium.
- The Learning Thread communicates the intended learning-line idea without becoming gamified.
- Parent Confidence and Trust avoid the earlier heavy dashboard/surveillance feeling.
- The mobile menu is clear: Login and EN/DE/FR/IT language controls are visible and usable.

### What Does Not Work Yet

- The mobile Hero image begins low and is cut by the first viewport. The result is not ugly in the old way, but it does not yet feel deliberately composed.
- FR mobile overflows horizontally because the Hero title is too wide for the viewport.
- FR/IT desktop Hero titles produce local container overflow signals and need a fit pass.
- The final CTA panel reports local overflow/clipping signals; it should be inspected before switch-over.
- Header controls are usable, but the desktop nav/language scale is still visually quiet. This is not a blocker by itself.

## Asset Readiness

The current wired images are:

| Area | Runtime file | v8 status |
|------|--------------|-----------|
| Hero | `img/home-v2/preview/hero-family-study-table-preview.jpg` | Preview-approved only; not final-public-approved. |
| Parent Confidence | `img/home-v2/preview/father-son-laptop-preview.jpg` | Preview-approved only; not final-public-approved. |
| Trust/detail | `img/home-v2/preview/study-desk-writing-preview.jpg` | Lower risk; acceptable pending final QA. |

This alone blocks switch-over unless the business explicitly grants temporary-public approval with a replacement deadline.

## Cross-Locale Readiness

| Locale | Desktop | Mobile | Judgment |
|--------|---------|--------|----------|
| EN | Strong | Conditional | Good direction; mobile Hero rhythm needs v9 pass. |
| DE | Strong enough | Conditional | Long title is readable but pushes rhythm lower. |
| FR | Conditional | Fail | Mobile horizontal overflow blocks switch-over. |
| IT | Conditional | Conditional | No body overflow, but title/CTA fit should be checked. |

## Legal Draft Readiness

`/privacy` and `/terms` render in EN/DE/FR/IT and contain complete sectioned draft content. They are usable for internal testing and lawyer review.

They are not ready as public switch-over legal pages because the visible page language still frames them as draft/legal-review material. The public page should read as a complete draft, while unresolved legal facts and lawyer-review status should live in internal documents.

## SEO, Routing, And Rollback Readiness

Current state:

- `/` and `/home-v2` are separate routes in `src/app/router/AppRouter.tsx`.
- `index.html` still has generic title `STOA Frontend`.
- No route-specific Home V2 metadata, canonical, sitemap, or robots plan exists.
- `public/_redirects` is only SPA fallback.
- Existing rollback and monitoring docs are generic and do not define a Home V2 route replacement/old-home retention plan.

Switch-over is therefore not operationally ready.

## Current `/` Comparison

The current `/` page is more complete as a product-information homepage, but it is also denser, more conventional, and less aligned with the high-end Swiss-parent direction. It explains more but feels less premium.

`/home-v2` should continue as the replacement candidate, but it needs v9 cleanup and final assets before any switch-over planning.

## Final Verdict

**Overall:** No-Go for route replacement now.  
**Visual direction:** Conditional Go to v9 cleanup.  
**Public switch-over:** No-Go.  
**Launch readiness:** No-Go until assets, FR mobile layout, legal page presentation, SEO/routing, and rollback are addressed.

## Recommended Next Stage

Start v9 as a final issue cleanup milestone using `docs/home-v2/v8-go-no-go-register.md` as the backlog source. v9 should fix issues; v8 should remain a decision record.
