# Phase 179 Verification

**Date:** 2026-05-27

## Browser Locale and Viewport Matrix

Target: `http://127.0.0.1:5174/`

| Locale | Widths Checked | Result |
|--------|----------------|--------|
| English | 320, 375, 430, 768, 1024, 1440 | Pass |
| German | 320, 375, 430, 768, 1024, 1440 | Pass |
| French | 320, 375, 430, 768, 1024, 1440 | Pass |
| Italian | 320, 375, 430, 768, 1024, 1440 | Pass |

For each combination, the browser check verified:

- Practice entry title is present.
- Start Practice CTA is present.
- Localized first equation preview topic is present.
- Start Practice link points to `/login?next=/practice` for unauthenticated users.
- Document scroll width does not exceed client width.
- No visible element extends beyond the viewport.

## Accessibility and Motion Checks

- Practice actions render as links in logical order: Start Practice, then secondary how-it-works link.
- German and French CTAs wrap instead of overflowing at 320 px.
- Practice entry hover lift uses `motion-safe:hover:-translate-y-0.5`, so reduced-motion users are not forced into spatial hover animation.

## Fixes From QA

- French 320 px Practice heading initially increased document scroll width because `Parcours d’entraînement` had a long unbroken segment.
- German 320 px homepage also exposed overflow in the parent-visibility section.
- Added heading wrapping and `min-w-0` hardening to resolve both issues.

## Build

Command:

```bash
npm run build
```

Result: Passed.

