# Home V2 v8 Screenshot Matrix

**Date:** 2026-07-07  
**Route under review:** `/home-v2`  
**Comparison route:** `/`  
**Raw evidence directory:** `/private/tmp/stoa-home-v2-v8/`  
**Repository policy:** raw screenshots are not committed.

## Capture Method

Screenshots were captured with Playwright against the local Vite app at `http://127.0.0.1:5173`. Each `/home-v2` run set `localStorage.stoa_language` before navigation, waited for the page, scrolled through the document to trigger viewport-based states, returned to the top, then captured a full-page screenshot.

## Required Matrix

| Route | Locale | Viewport | Size | Screenshot | Result | Notes |
|-------|--------|----------|------|------------|--------|-------|
| `/home-v2` | EN | Desktop | 1440 x 1100 | `/private/tmp/stoa-home-v2-v8/home-v2-en-desktop.png` | Pass with issues | Strongest overall premium composition. |
| `/home-v2` | EN | Mobile | 390 x 844 | `/private/tmp/stoa-home-v2-v8/home-v2-en-mobile.png` | Conditional | Hero image starts below CTAs and is visibly cut by the first viewport. |
| `/home-v2` | DE | Desktop | 1440 x 1100 | `/private/tmp/stoa-home-v2-v8/home-v2-de-desktop.png` | Pass with issues | Long Hero title pushes CTA lower but remains readable. |
| `/home-v2` | DE | Mobile | 390 x 844 | `/private/tmp/stoa-home-v2-v8/home-v2-de-mobile.png` | Conditional | No horizontal body overflow, but long title and image placement make the first screen heavy. |
| `/home-v2` | FR | Desktop | 1440 x 1100 | `/private/tmp/stoa-home-v2-v8/home-v2-fr-desktop.png` | Conditional | Hero title overflows its local text container. |
| `/home-v2` | FR | Mobile | 390 x 844 | `/private/tmp/stoa-home-v2-v8/home-v2-fr-mobile.png` | Fail | Horizontal document overflow: 419 px document width on 390 px viewport. |
| `/home-v2` | IT | Desktop | 1440 x 1100 | `/private/tmp/stoa-home-v2-v8/home-v2-it-desktop.png` | Pass with issues | Slight local title overflow, no body-level horizontal overflow. |
| `/home-v2` | IT | Mobile | 390 x 844 | `/private/tmp/stoa-home-v2-v8/home-v2-it-mobile.png` | Conditional | No horizontal body overflow, but mobile Hero rhythm is still not switch-ready. |
| `/` | EN | Desktop | 1440 x 1100 | `/private/tmp/stoa-home-v2-v8/current-home-en-desktop.png` | Comparison | More product-complete and information-dense, less premium. |
| `/` | EN | Mobile | 390 x 844 | `/private/tmp/stoa-home-v2-v8/current-home-en-mobile.png` | Comparison | Longer, denser, more conventional product site. |

## Additional Evidence

| State | Screenshot | Finding |
|-------|------------|---------|
| `/home-v2` EN mobile menu open | `/private/tmp/stoa-home-v2-v8/home-v2-en-mobile-menu-open.png` | Login and language chips are clear and usable. |
| `/home-v2` FR mobile menu open | `/private/tmp/stoa-home-v2-v8/home-v2-fr-mobile-menu-open.png` | Login and language chips remain clear in French. |
| DOM/layout audit | `/private/tmp/stoa-home-v2-v8/layout-audit.json` | Confirms FR mobile horizontal overflow and generic title. |
| Legal render audit | `/private/tmp/stoa-home-v2-v8/legal-render-audit.json` | Confirms `/privacy` and `/terms` render in EN/DE/FR/IT with complete draft structure. |
| Screenshot manifest | `/private/tmp/stoa-home-v2-v8/manifest.json` | Lists captured screenshot files and DOM metrics. |

## Layout Audit Highlights

| Check | Result |
|-------|--------|
| EN mobile horizontal overflow | No body-level overflow. |
| DE mobile horizontal overflow | No body-level overflow. |
| FR mobile horizontal overflow | Fail: document/body width 419 px on 390 px viewport. |
| IT mobile horizontal overflow | No body-level overflow. |
| Hero image mobile position | Image begins around y=723 and extends beyond first viewport. This is not broken layout, but weak first-screen composition. |
| Page title | All routes still report `STOA Frontend`; Home V2 has no route-specific title. |

## Screenshot Storage

The raw screenshot directory is intentionally outside the repository:

```text
/private/tmp/stoa-home-v2-v8/
```

Do not commit these files unless a later documentation package explicitly asks for compressed representative screenshots.
