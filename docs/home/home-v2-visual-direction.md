# Home V2 Visual Direction

**Date:** 2026-07-03
**Status:** Draft for v2.7
**Depends on:** `docs/home/home-v2-information-architecture.md`
**Skill input:** `high-end-visual-design`

## Purpose

This document defines the visual direction for the separate Home V2 homepage before any React implementation begins. It translates the v2.6 Swiss-parent-first information architecture into a premium education-service visual system.

Home V2 should still preserve the current `/` homepage until a later switch decision.

## Visual Thesis

Home V2 should feel like a Swiss private-school education service with a modern learning product layer quietly embedded inside it.

The target impression is:

```text
Calm family confidence, editorial restraint, crafted product evidence.
```

The page should not feel like:

- an AI homework-solver landing page
- a generic SaaS feature grid
- a playful student game surface
- a teacher marketplace
- a luxury decoration exercise detached from learning

## High-End Archetype

Selected adaptation from `high-end-visual-design`:

| Dimension | Selection | STOA adaptation |
|-----------|-----------|-----------------|
| Vibe | Editorial Luxury | Use education-editorial warmth, but avoid a one-note beige/cream palette. |
| Layout | Editorial Split with selective Z-axis depth | Pair large parent-facing typography with family/homework imagery and restrained product evidence. |
| Surface craft | Double-bezel | Use nested frames for hero image, learning-thread panels, and trust/evidence modules. |
| CTA craft | Button-in-button trailing icon | Use only where the CTA benefits from motion and affordance; keep labels calm. |
| Motion | Heavy fade-up and magnetic CTA physics | Use transform/opacity with custom cubic-bezier timing; no layout-triggering animation. |

## Visual Anti-Patterns

Home V2 must avoid:

- Decorative gradient orbs, bokeh blobs, or generic mesh backgrounds.
- Dominant purple/purple-blue gradients.
- One-note beige, cream, sand, tan, dark blue, slate, brown, orange, or espresso palettes.
- Generic three-column SaaS card grids as the main structure.
- Nested UI cards inside other cards.
- Large scrolling `backdrop-blur` surfaces.
- Harsh shadows, dark drop shadows, or generic gray borders.
- Hero copy in a card.
- Feature text overload.
- AI as the hero concept.

## Typography Direction

Use role-based typography. Do not force all text into one font.

| Role | Direction | Notes |
|------|-----------|-------|
| Display | Editorial, high-contrast serif or existing display token | Used for hero and major section titles only. |
| Heading | Calm premium heading face | Tighter than display, used for section headings and compact modules. |
| Body | Highly readable UI text | Parent-facing explanatory copy must remain clear in EN/DE/FR/IT. |
| Navigation | Compact, confident UI text | Should not look like dense app chrome. |
| CTA | Purposeful UI label | Use consistent button text treatment across Home V2. |
| Caption / evidence labels | Small, precise, restrained | Avoid noisy badges. |

German and French text length must be assumed early. Large hero titles should support line breaks, not viewport-scaled font sizes.

## Color Direction

Use STOA's existing brand signals while creating a richer public-page atmosphere.

Recommended behavior:

- Charcoal for institutional depth.
- Burgundy for primary action and confident emphasis.
- Warm off-white / paper as breathing room, not full-page monotony.
- Muted sage or moss as a secondary educational accent.
- Muted gold only as a small trust/accent signal.
- Product evidence can use cool neutral surfaces, but should not shift the page into generic tech blue.

Do not let any single hue family dominate the page.

## Spatial Rhythm

Home V2 should use macro whitespace:

- Desktop sections should feel spacious, closer to editorial spreads than product dashboards.
- Important sections should have generous top/bottom padding.
- Dense content belongs in the app, not the public homepage.
- Each section should have one clear visual job.

Mobile rules:

- Asymmetry collapses to one column below tablet width.
- No overlapping Z-axis cards on small screens.
- Fixed-format visual elements need stable aspect ratios.
- Text must wrap naturally rather than shrink with viewport width.

## Surface Architecture

Major visual containers should use a double-bezel structure:

1. Outer shell: subtle tinted tray, light border/ring, generous radius.
2. Inner core: actual image/product/evidence content with separate background and inner highlight.

Use this for:

- hero image frame
- learning-thread evidence panels
- parent confidence visual
- Swiss trust layer visual proof

Do not use nested cards for page sections. If repeated items need cards, keep them as individual repeated items only.

## Section Composition

### Hero

Composition:

- Editorial split.
- Left: short parent-facing promise, restrained support copy, primary CTA.
- Right: high-quality family/homework visual in a double-bezel frame.
- A hint of the Learning Thread section should be visible below the first viewport.

Visual signal:

- Actual family/homework learning moment, not abstract atmosphere.
- Parent audience should be obvious without reading the nav.

### Learning Thread

Composition:

- A cinematic vertical or diagonal sequence, not a row of equal feature cards.
- Four beats: stuck question, clear next step, teacher support, parent pattern.
- Product UI appears as evidence inside crafted frames.

Motion:

- Heavy reveal per beat.
- Slight parallax-like depth may be simulated with transform only.
- No continuous scroll listeners.

### Parent Confidence

Composition:

- Fewer words, stronger contrast between parent uncertainty and calm visibility.
- Evidence should show pattern/summary, not monitoring/control.

Visual signal:

- Parent confidence without parent takeover.

### Swiss Trust Layer

Composition:

- Compact institutional trust band.
- Multilingual, teacher-backed, privacy-conscious, and Swiss-family rhythm cues.
- Avoid badges that look like generic compliance stickers.

### Final CTA

Composition:

- Quiet, confident close.
- Primary CTA remains `Start learning`.
- No duplicate feature explanation.

## CTA And Navigation

Primary CTA should use the button-in-button pattern only when it strengthens affordance:

- rounded pill
- nested circular trailing arrow container
- subtle diagonal icon movement on hover
- active press scale
- custom cubic-bezier transition

Navigation should later become a floating, detached public nav treatment only if it does not conflict with current MarketingLayout constraints. Avoid edge-to-edge sticky nav that feels glued to the browser.

## Motion Direction

Motion should feel heavy, calm, and crafted.

Use:

- `transform`
- `opacity`
- custom cubic-bezier timing
- IntersectionObserver or framework viewport reveal
- staggered reveals for narrative sequences

Avoid:

- `top`, `left`, `width`, `height` animation
- large scrolling blur
- constant scroll listeners
- linear or generic ease-in-out transitions
- motion that distracts from parent trust

## Responsive And Accessibility Guardrails

- Below tablet width, all split/asymmetric layouts become single column.
- Text must not overlap images, CTAs, nav, or the next section.
- Hero text should not be inside a card.
- Buttons need stable dimensions and tap targets.
- Contrast must work on warm paper, image overlays, and product-evidence surfaces.
- Localized labels must fit without shrinking font size by viewport width.

## Implementation Handoff

Later implementation should create:

- `src/pages/home-v2/HomeV2Page.tsx`
- `src/components/home-v2/`
- `src/i18n/locales/*/homeV2.json`
- optional `img/home-v2/`

This v2.7 milestone does not create those files.

## Open Design Checks For Later Milestones

- Which hero image is final: existing local image, sourced image, or generated image?
- Does the first viewport show a hint of the Learning Thread on desktop and mobile?
- Does Home V2 visually read 70% high-end education service and 30% modern learning product?
- Do German and French hero/CTA variants keep the layout stable?
- Does motion remain calm on low-power mobile devices?
