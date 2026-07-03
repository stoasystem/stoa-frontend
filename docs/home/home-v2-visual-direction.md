# Home V2 Visual Direction

**Date:** 2026-07-03
**Status:** Final for v2.7
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

## Visual Contract

Home V2 should not look like the current app surfaces. It is a public trust-building page for Swiss parents, so the design should behave more like a private education service brochure with a precise learning-product proof layer.

The approved mix is:

```text
70% Swiss private-school / high-end education service
30% modern learning product
0% AI spectacle
```

The visual hierarchy should make three things clear in the first few seconds:

1. STOA is for families who care about serious, calm academic support.
2. The child starts learning naturally through a clear, guided experience.
3. Technology is present as evidence and infrastructure, not as the personality of the brand.

## Premium Adaptation Rules

`high-end-visual-design` is used as craft input, not as a literal template. Home V2 selects **Editorial Luxury** and **Editorial Split** as the dominant design combination, with restrained double-bezel product proof moments.

| Skill rule | STOA decision |
|------------|---------------|
| Premium display typography | Use display typography only for hero and major section moments; do not apply it to every heading. |
| Macro whitespace | Use generous section breathing room, but keep enough next-section visibility in the first viewport. |
| Double-bezel containers | Use for major image/product/evidence surfaces only. Do not wrap every text block in machinery. |
| Button-in-button CTA | Use for primary `Start learning` and final CTA. Avoid using it on every minor link. |
| Heavy reveal motion | Use calm fade-up and depth reveal. Remove blur on mobile or reduced-motion contexts. |
| Fluid island nav | Optional later implementation pattern. Must not fight the existing public layout system. |

Rejected parts of the skill for this project:

- Ethereal AI glass, radial gradient orb backgrounds, and purple/emerald tech atmospheres.
- Heavy `backdrop-blur` on scrolling content.
- Pure luxury surface styling with no learning evidence.
- Overlapping Z-axis cascades on mobile.

## Typography Specification

Home V2 typography must be role based. The point is consistency by text role, not one font across all text.

| Role | Intended face | Weight | Size behavior | Usage limit |
|------|---------------|--------|---------------|-------------|
| Display | Existing STOA display/serif signal or later premium serif token | 400-500 | Fixed responsive steps, never viewport-width scaling | Hero H1 and one major section title tier |
| Section heading | Premium calm heading face | 500-600 | Compact but generous line-height | Section titles and major narrative beats |
| Body | Existing readable UI/body token | 400 | Stable 16-19px range depending context | Parent-facing explanation, trust copy, learning-thread description |
| Navigation | UI text token | 500-600 | Compact, not app-sidebar dense | Public nav only |
| CTA | UI label token | 600 | Stable pill button dimensions | `Start learning`, secondary public actions |
| Caption | UI text token | 500 | 11-13px, uppercase only when useful | Evidence labels, small proof markers |
| Product evidence | UI text token | 400-600 | Smaller than marketing headings | Mock product snippets inside proof surfaces |

Typography rules:

- Display titles should be short enough for English, German, French, and Italian.
- German should prefer deliberate phrase breaks over shrinking text.
- No heading should rely on negative letter spacing.
- Button and nav type should feel precise, not decorative.
- Body copy should remain parent-readable before visual drama.

## Color System Extension

Home V2 should extend existing STOA brand signals rather than replacing them.

| Token intent | Direction | Usage |
|--------------|-----------|-------|
| Foundation paper | Warm off-white with subtle depth | Primary page background bands |
| Institutional charcoal | Deep neutral | Headlines, nav, high-emphasis text |
| STOA burgundy | Confident action | Primary CTA, small emphasis, active states |
| Soft sage/moss | Education calm | Secondary section grounds, trust layer accents |
| Muted gold | Selective trust accent | Tiny separators, proof highlights, never large fills |
| Cool neutral | Product evidence | Screens, learning-thread surfaces, UI proof panels |

Color guardrails:

- No single color family should dominate more than roughly half the page impression.
- Beige/paper is a ground, not the brand.
- Burgundy should feel intentional and limited; it should not become a full-page red theme.
- Cool neutral product panels should not make the site feel like generic SaaS.
- Gold must be an accent, not a luxury badge system.

## Layout System

Home V2 should use an editorial section rhythm instead of equal feature grids.

Desktop rules:

- Maximum content width should feel editorial, not dashboard-wide.
- Use asymmetric sections when they help the narrative: promise beside image, thread beside evidence, trust beside proof.
- Major sections should have one dominant visual object.
- Supporting items can be repeated, but repeated items must not become a default three-column feature grid.
- Page sections should be full-width bands or unframed layouts with constrained inner content.

Mobile rules:

- Below tablet width, all asymmetry becomes a single column.
- Remove rotations, negative overlaps, and diagonal tension on small screens.
- Use stable aspect ratios for visual frames, product panels, and CTA clusters.
- Keep the first viewport focused on parent promise, hero image signal, and primary action.
- Preserve a hint of the next section without forcing `h-screen`.

## Surface System

Double-bezel surfaces should follow this structure:

1. **Outer shell**: quiet tray, subtle tint, hairline ring, generous radius, small padding.
2. **Inner core**: image, product proof, or evidence module with its own background and inner highlight.
3. **Content discipline**: no more than one central proof idea per framed surface.

Approved surface uses:

- Hero family/homework image frame.
- Learning-thread evidence sequence.
- Parent confidence summary proof.
- Swiss trust proof layer.
- Final CTA small evidence chip, only if it does not add noise.

Rejected surface uses:

- Wrapping entire sections as floating cards.
- Putting cards inside cards inside page panels.
- Generic gray bordered cards.
- Dark drop-shadow stacks.

## Image Art Direction

Home V2 needs real visual evidence, not abstract atmosphere.

Hero image:

- Shows a Swiss-family-relevant learning moment: parent nearby, student engaged, calm home or study setting.
- Should feel high-end but not staged like generic stock.
- Crop should support a double-bezel frame with breathing room around faces/hands/materials.
- Avoid dark, blurred, cropped, or purely atmospheric imagery.

Learning-thread images/product proof:

- Show actual learning progression: question, explanation, teacher support, parent pattern.
- Product surfaces can be simplified mock evidence, not full app screenshots overloaded with UI.
- Text inside product proof must remain secondary and not require reading to understand the page.

Trust imagery:

- Prefer restrained institutional cues: multilingual rhythm, teacher-backed support, privacy-conscious operation, Swiss family routine.
- Avoid compliance-badge wallpaper.

Asset decision deferred:

- v2.7 defines art direction only. Final image sourcing, generation, insertion, licensing, and QA belong to the image milestone.

## Section Blueprints

### 1. Hero

Purpose: immediate parent confidence.

Structure:

- Floating or quiet public nav above, not edge-glued.
- Left editorial promise with short H1, concise support copy, and primary CTA.
- Right double-bezel hero image.
- Small proof line near CTA: teacher-backed, multilingual, child starts with learning.
- First viewport reveals a small hint of Learning Thread below.

CTA:

- Primary: `Start learning`.
- Secondary: calm route to how it works or parent confidence detail.
- Free-user trial quota appears after registration or in supporting FAQ, not as the hero hook.

### 2. Learning Thread

Purpose: show the product system without calling it an AI showpiece.

Structure:

- Four-beat vertical or diagonal narrative:
  1. Child has a stuck question.
  2. STOA gives a clear next learning step.
  3. Teacher support is available when needed.
  4. Parent sees pattern and progress.
- Each beat gets a proof surface, not a feature card.
- Use staggered reveal and gentle depth rather than a flat row.

### 3. Parent Confidence

Purpose: reassure parents without surveillance language.

Structure:

- Contrast before/after parent feeling: uncertainty becomes visibility.
- Show summary patterns, not live monitoring.
- Use fewer words than current homepage style.
- Emphasize calm visibility, teacher-backed support, and child autonomy.

### 4. Swiss Trust Layer

Purpose: ground STOA in Swiss-parent expectations.

Structure:

- Compact institutional band.
- Multilingual support, privacy-conscious behavior, teacher-backed help, and Swiss school rhythm.
- Small precise labels, not noisy badges.
- Keep this section refined and quiet.

### 5. Final CTA

Purpose: close with confidence, not repetition.

Structure:

- Short statement, one primary CTA, one reassurance line.
- The design should feel like a calm appointment or admissions step, not a discount popup.
- No duplicate feature grid.

## Motion System

Motion should support trust and sequencing.

Global timing:

- Standard reveal: 760-920ms.
- CTA hover: 500-700ms.
- Mobile reveal: shorter and simpler.
- Preferred curve: `cubic-bezier(0.32, 0.72, 0, 1)` or close family.

Allowed properties:

- `transform`
- `opacity`
- very limited filter blur on entry for desktop only, removed for mobile/reduced motion

Disallowed properties:

- `top`, `left`, `width`, `height`
- continuous scroll listeners
- generic `linear` / `ease-in-out`
- large scrolling blur surfaces

Reveal sequence:

1. Nav settles first.
2. Hero eyebrow and H1 rise with weight.
3. Body and CTA follow.
4. Hero image core arrives after the text.
5. Learning Thread beats reveal one at a time.

Reduced motion:

- Use opacity-only or no animation.
- Preserve final layout and content order.
- No critical information should depend on motion.

## Navigation And CTA Blueprint

Navigation:

- Public nav should feel detached and calm if implementation allows it.
- Do not make it a dense app toolbar.
- Mobile menu can use a morphing button and staggered reveal only if it remains accessible and does not introduce layout instability.

Primary CTA:

- Pill shape with nested trailing arrow circle.
- Label remains `Start learning`.
- Hover should move the inner icon diagonally and slightly scale the button.
- Active state should compress subtly.

Secondary actions:

- Use text links or quiet secondary pills.
- Do not compete with the primary CTA.

## Accessibility And Localization Checks

Before implementation is accepted, Home V2 should pass these design checks:

- Hero and section headings have fixed responsive type steps.
- No line relies on viewport-scaled font size.
- German, French, and Italian labels fit without reducing type below readable sizes.
- Primary CTA has stable dimensions and tap targets.
- Contrast works on paper, sage, charcoal, and image-adjacent surfaces.
- Image overlays are not required for legibility.
- Motion respects reduced-motion settings.
- Mobile has no overlap between text, visuals, nav, CTA, and next section.

## Implementation Handoff Contract

Later implementation should treat this document as the source for:

- `HomeV2Page` section order.
- Home V2-specific public design tokens or CSS variables.
- Image selection criteria.
- Animation choreography and motion restrictions.
- Localized copy fit requirements.
- Screenshot QA acceptance.

Implementation should not:

- Replace `/` without explicit approval.
- Introduce new auth, registration, quota, payment, or role dashboard behavior.
- Add decorative AI/tech visual motifs.
- Let code convenience override the section composition contract.

## v2.7 Acceptance Checklist

- [x] Visual thesis is locked.
- [x] High-end visual skill adaptation is documented.
- [x] Anti-patterns are explicit.
- [x] Typography roles are defined.
- [x] Color behavior is defined.
- [x] Layout and spacing rules are defined.
- [x] Double-bezel and non-nested-card surface rules are defined.
- [x] Section blueprints are defined.
- [x] Image art direction is defined.
- [x] CTA and navigation treatment is defined.
- [x] Motion choreography is defined.
- [x] Mobile, accessibility, localization, and performance guardrails are defined.
- [x] Implementation boundary is explicit.

## Phase Completion Map

| Phase | Completed contribution |
|-------|------------------------|
| 232 | Locked the visual thesis, high-end adaptation, and hard anti-patterns. |
| 233 | Defined typography, color, spacing, grid, surface, and CTA system rules. |
| 234 | Defined section composition, image art direction, navigation/CTA, and motion blueprint. |
| 235 | Defined responsive, accessibility, localization, performance, and implementation handoff checks. |
