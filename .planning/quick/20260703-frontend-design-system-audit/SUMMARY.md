# Frontend Design System整理 Summary

## Status

Complete.

## Changes

- Audited the current theme stack, main layouts, UI primitives, and existing design documentation.
- Identified competing legacy blue tokens, premium warm tokens, and newer STOA burgundy platform tokens.
- Consolidated active styles around the existing STOA editorial brand direction.
- Converted the old `stoa-theme.css` values into compatibility aliases instead of a competing blue theme.
- Reduced `premium-theme.css` to interaction/focus helpers and kept active colors in `brand-tokens.css` and `platform-theme.css`.
- Added role-based typography tokens for body, heading/display, navigation, button, input, and mono text.
- Deployed typography role classes into shared UI primitives, common headers, and navigation layouts.
- Added sage/gold secondary semantic tokens, selection styling, media sizing safeguards, and a missing platform accent token.
- Tightened the default card title scale for app surfaces.
- Updated style notes and UI guidelines to document the active typography, color, and component direction.
- Corrected the typography model to be role-consistent rather than forcing all text to use one font.

## Verification

- `npm run lint`
- `npm run build`
- Playwright desktop screenshots on `/`, `/login`, `/pricing`, and `/assistant`.
- Playwright mobile screenshots and horizontal overflow checks on `/`, `/login`, and `/pricing`.
- Playwright computed font checks for body, heading, navigation, button, and input roles.
