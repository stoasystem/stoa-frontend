# Home V2 v9 Verification Report

**Date:** 2026-07-07  
**Evidence directory:** `/private/tmp/stoa-home-v2-v9/`

## Browser Evidence

Captured under `/private/tmp/stoa-home-v2-v9/`.

| Route | Locale | Desktop | Mobile | Result |
|-------|--------|---------|--------|--------|
| `/home-v2` | EN | `home-v2-en-desktop.png` | `home-v2-en-mobile.png` | Pass |
| `/home-v2` | DE | `home-v2-de-desktop.png` | `home-v2-de-mobile.png` | Pass |
| `/home-v2` | FR | `home-v2-fr-desktop.png` | `home-v2-fr-mobile.png` | Pass |
| `/home-v2` | IT | `home-v2-it-desktop.png` | `home-v2-it-mobile.png` | Pass |

Layout audit output: `/private/tmp/stoa-home-v2-v9/layout-audit.json`.

Summary:

- EN/DE/FR/IT desktop: no body-level horizontal overflow.
- EN/DE/FR/IT mobile: no body-level horizontal overflow.
- FR mobile: fixed the v8 419 px document-width issue; current result is 390 px scroll width on a 390 px viewport.
- Home V2 title metadata: `STOA | Guided learning support`.
- Manual screenshot review: French Hero title now wraps at word boundaries; mobile Hero image is constrained as a framed visual rather than a full-screen takeover.

Legal render audit output: `/private/tmp/stoa-home-v2-v9/legal-render-audit.json`.

Summary:

- `/privacy` and `/terms` render in EN/DE/FR/IT.
- Each legal route has a route-specific title and meta description.
- Visible draft/review/candidate markers were not found in legal page body text.

## Command Verification

| Command | Result | Notes |
|---------|--------|-------|
| `git diff --check` | Pass | No whitespace errors. |
| `npm run lint` | Pass | ESLint completed without findings. |
| `npm run build` | Pass | Existing Vite chunk-size warning remains. |
| `npm run test:e2e -- home-v2.spec.ts localization-preferences.spec.ts` | Pass | 5/5 Playwright tests passed. |

## Notes

Raw screenshots and machine evidence must remain outside the repository.
