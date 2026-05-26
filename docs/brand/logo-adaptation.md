# Logo Adaptation

## Source Observation

The main website uses STOA logo image assets in the header and footer. Phase 119 does not copy or modify those files.

## Learning Platform Implementation

The learning platform now has a native `StoaLogo` component:

- `variant`: `dark`, `light`, `gold`, `monochrome`
- `size`: `sm`, `md`, `lg`
- Used by `AppLogo` and `AppFooter`

This preserves the STOA wordmark signal without importing homepage assets. The dot accent and color variants are implemented with platform theme tokens, so the logo remains legible on light or dark surfaces.

## Adaptation Rules

- Preserve STOA name recognition.
- Use learning-platform color tokens rather than copying homepage color combinations directly.
- Do not stretch or rasterize the logo.
- Keep contrast strong enough for navigation and footer use.

## QA Notes

- Header logo links to `/`.
- Footer logo links to `/`.
- Variants are CSS-based and do not require additional image loading.
