# Phase 19 Research Summary

## Stack Additions

No new runtime dependencies are needed. Phase 19 should use the existing React/Vite/Tailwind/token architecture and add only documentation plus CSS token/theme refinements inside `stoa-frontend`.

## Main Website Design Signals

Source: `/Users/zhdeng/newweb` read-only.

- Static HTML/CSS site with global CSS and image-led marketing pages.
- Fonts: `Prata` for headings, `Inter` for body/UI.
- Core colors: burgundy `#9D2235`, charcoal `#212121`, warm grey `#F3F3F3`, white, muted grey `#666`.
- Buttons: uppercase, low/square radius, burgundy fill, charcoal/white hover treatment.
- Section rhythm: large `pt-120 pb-120` marketing spacing.
- Headings: editorial serif, large display scale, burgundy highlight spans with pale underline blocks.
- Cards/tiles: education-service blocks in dark, burgundy, and white with moderate padding and light shadows.
- Imagery: real education photography, hero figure image, gallery strips, and report-like editorial composition.

## Translation Principle

Same brand family, different product surface.

The learning platform should feel related to the main STOA website without becoming a page clone. Homepage, auth, and parent-report pages can borrow more editorial rhythm. Chat and dashboards must stay app-like, readable, and efficient.

## Watch Outs

- `/Users/zhdeng/newweb` has a pre-existing modified `img/team/.DS_Store`; do not touch it.
- Do not copy website CSS, components, or image assets into the learning platform.
- Keep Phase 17 multilingual layout safeguards.
- Avoid making dashboards/chat marketing-like.

## Recommended Phase Structure

1. Read-only audit and design translation documentation.
2. Design token and theme adjustment.
3. Shared component refinement.
4. Public/auth/report page visual alignment.
5. App page visual alignment and visual compatibility QA.

