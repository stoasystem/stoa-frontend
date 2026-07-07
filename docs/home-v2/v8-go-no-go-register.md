# Home V2 v8 Go/No-Go Register

**Date:** 2026-07-07  
**Decision object:** whether `/home-v2` can enter a future switch-over stage, not whether v8 switches routes.

## Final Verdict

**No-Go for replacing `/` with `/home-v2` now.**

The visual direction is stronger than the current homepage and should continue, but v8 found hard blockers: final-public image approval is missing, FR mobile has horizontal overflow, legal pages still expose draft-review framing, and SEO/routing/rollback preparation is incomplete.

## Hard Blockers

| ID | Severity | Area | Evidence | Finding | Required v9 Treatment |
|----|----------|------|----------|---------|-----------------------|
| V8-BLOCK-01 | P0 | Final imagery | `docs/home/home-v2-v6-readiness-register.md` | Hero and Parent Confidence images are preview-approved only, not final-public-approved. | Obtain final-public approval, paid stock, commissioned photography, or explicit temporary-public approval with replacement deadline. |
| V8-BLOCK-02 | P0 | Mobile localization | `/private/tmp/stoa-home-v2-v8/layout-audit.json`; `/private/tmp/stoa-home-v2-v8/home-v2-fr-mobile.png` | FR mobile has body-level horizontal overflow: 419 px document width on 390 px viewport. | Add locale-aware mobile title sizing/wrapping or responsive constraints for long French Hero copy. |
| V8-BLOCK-03 | P1 | Mobile first screen | `/private/tmp/stoa-home-v2-v8/home-v2-en-mobile.png` and other mobile screenshots | Hero image begins low and is cut by the first viewport, weakening the first impression. | Rebalance mobile Hero rhythm so image/card placement feels intentional, not clipped. |
| V8-BLOCK-04 | P0 | Legal launch risk | `/private/tmp/stoa-home-v2-v8/legal-render-audit.json`; `src/i18n/locales/*/legal.json` | `/privacy` and `/terms` are complete drafts, but public page copy visibly says draft / legal review required. | Convert page-facing language into complete legal draft copy suitable for internal testing, while keeping lawyer-review state in internal docs. |
| V8-BLOCK-05 | P0 | SEO and routing | `index.html`, `public/_redirects`, `src/app/router/AppRouter.tsx` | No route-specific title/meta/canonical/sitemap plan exists for Home V2 switch-over. | Create switch-over SEO/routing plan before any route replacement. |
| V8-BLOCK-06 | P0 | Rollback | `docs/home/home-v2-v6-switch-over-gate.md`, `docs/launch/rollback-plan.md` | Existing rollback plan is generic; no Home V2-specific `/` replacement and old-home preservation plan exists. | Define exact old homepage retention route, deployment rollback, and post-switch smoke checklist. |

## Conditional Issues

| ID | Severity | Area | Evidence | Finding | v9 Treatment |
|----|----------|------|----------|---------|--------------|
| V8-COND-01 | P1 | FR/IT desktop title fit | `/private/tmp/stoa-home-v2-v8/layout-audit.json` | FR and IT Hero titles overflow local text containers on desktop, though body width remains stable except FR mobile. | Add fit rules for long Romance-language titles. |
| V8-COND-02 | P1 | Final CTA overflow signal | `/private/tmp/stoa-home-v2-v8/layout-audit.json` | Final CTA panel reports local scrollWidth greater than clientWidth. It is clipped by `overflow-hidden`; no body overflow observed. | Inspect CTA internal layout in all locales before switch. |
| V8-COND-03 | P2 | Header scale | Desktop screenshot | Header is polished but still compact relative to the page. Login is discoverable, but the nav/language cluster reads secondary. | In v9, decide whether to make nav slightly more assertive without losing premium restraint. |
| V8-COND-04 | P2 | Legal completeness depth | `docs/legal/v7-legal-source-notes.md` | Legal entity, address, processor list, retention schedule, payment provider, age/guardian policy, refund terms, governing law, and counsel review remain unresolved. | Keep unresolved facts in internal legal review notes and complete them before public reliance. |

## Passes

| Area | Result | Evidence |
|------|--------|----------|
| Desktop visual direction | Pass | `/private/tmp/stoa-home-v2-v8/home-v2-en-desktop.png` |
| Comparison with current `/` | Home V2 is visually stronger | Current `/` screenshots are more product-dense and less premium. |
| Mobile menu | Pass | `/private/tmp/stoa-home-v2-v8/home-v2-en-mobile-menu-open.png`, `/private/tmp/stoa-home-v2-v8/home-v2-fr-mobile-menu-open.png` |
| Login discoverability | Pass | Desktop header and mobile menu both expose Login. |
| Language controls | Pass with caution | Four languages render and are usable; FR mobile layout still needs title fix. |
| Motion implementation | Pass for v8 review | CSS uses restrained breathing animations and reduced-motion coverage; no scan-like effect observed in screenshots/code. |
| Legal page structure | Pass for internal draft completeness | `/privacy` and `/terms` render EN/DE/FR/IT with sectioned content. |

## v9 Backlog Input

1. Fix FR mobile horizontal overflow.
2. Rebalance mobile Hero first-screen image/card placement.
3. Resolve final Hero and Parent Confidence image approval.
4. Convert visible legal draft framing into complete public-facing legal draft language while preserving internal lawyer-review tracking.
5. Add route-specific title/meta/canonical/sitemap plan for Home V2 switch-over.
6. Define old `/` preservation and rollback path.
7. Recheck final CTA internal overflow in all locales.
8. Decide whether desktop nav/language scale needs a small assertiveness pass.
