# Phase 19 Research: Stack

## Scope

Phase 19 is a visual refinement milestone. It should not add product features, new frameworks, new languages, or a second design system. The source project `/Users/zhdeng/newweb` is read-only and must not receive dependency installs, formatting, edits, moves, deletes, or commits.

## Source Stack Observed

`/Users/zhdeng/newweb` is a static HTML/CSS/JavaScript website:

- HTML pages such as `index.html`, `programs.html`, `about.html`, and program detail pages.
- Global CSS in `css/style.css`, `css/default.css`, `css/responsive.css`.
- JavaScript libraries under `js/` for jQuery, Bootstrap, GSAP, Swiper, menu behavior, animation, and language switching.
- Image-heavy brand presentation under `img/`.
- Fonts loaded from Google Fonts in `css/style.css`: `Prata` for headings and `Inter` for body/UI text.

No React, Vite, Tailwind, or shared package relationship with `stoa-frontend` was found.

## Learning Platform Stack Direction

Keep the existing STOA frontend stack:

- React + TypeScript + Vite.
- Tailwind v4 via `src/index.css`.
- Existing CSS token files: `src/styles/stoa-theme.css` and `src/styles/premium-theme.css`.
- Existing shadcn-style primitives in `src/components/ui/`.
- Existing route/page/component structure.

## Stack Additions

No dependency additions are required for Phase 19.

Recommended implementation files:

- `docs/design/main-website-readonly-audit.md`
- `docs/design/main-website-design-translation.md`
- `docs/design/learning-platform-token-adjustment.md`
- `docs/design/visual-compatibility-qa.md`
- `src/styles/brand-tokens.css`
- `src/styles/platform-theme.css`

If implementation prefers fewer CSS files, token work may be integrated into `stoa-theme.css` and `premium-theme.css`, but the roadmap should still require documentation of the token proposal.

## Stack Risks

- Do not copy static website CSS into React components. The source CSS is broad, global, and Bootstrap-era; direct import would break Tailwind/app layouts.
- Do not add jQuery, Bootstrap, GSAP, or Swiper to the learning platform just to mimic the company homepage.
- Do not rely on web font network loading if the app currently avoids it. If Prata is used, define a safe serif fallback path and keep body UI text system/Inter-like.

