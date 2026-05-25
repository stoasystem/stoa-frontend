# Phase 108 Research: Main Website Read-Only Audit and Design Translation

**Date:** 2026-05-26
**Status:** Research complete, ready for Phase 108 planning
**Source project:** `/Users/zhdeng/newweb`
**Target project:** `/Users/zhdeng/stoa-frontend`

## Research Boundary

Phase 108 is research and documentation only. It establishes how the company homepage design language should be translated into the STOA learning platform before any app UI or token edits begin.

The source project `/Users/zhdeng/newweb` is read-only:

- No files were edited there.
- No formatter was run there.
- No dependency install was run there.
- No files were copied from there into `stoa-frontend`.
- No commits were made there.

Pre-work and post-research source status both showed:

```text
 M img/team/.DS_Store
```

That modification was already present before Phase 108 research and was left untouched.

## Source Design Signals

### Stack and structure

The main website is a static HTML/CSS site, not a React/Tailwind app. Relevant inspected files:

- `/Users/zhdeng/newweb/index.html`
- `/Users/zhdeng/newweb/css/style.css`
- `/Users/zhdeng/newweb/css/default.css`
- image folders under `/Users/zhdeng/newweb/img/`

This means Phase 19 should not import source implementation patterns. The useful output is a design translation, not source reuse.

### Typography

The homepage imports:

- `Prata` for editorial display headings.
- `Inter` for body and UI text.

Observed usage:

- Body text uses `Inter`, 16px, muted grey, 26px line-height.
- Headings use `Prata`, charcoal text, larger editorial scale.
- Section headings often reach 50px.
- Small section labels use `Inter`, uppercase, 14px, semibold, burgundy.

Learning-platform implication:

- Use editorial heading treatment on homepage, auth, and parent-report surfaces.
- Keep chat, dashboards, forms, billing, and admin on clear UI typography.
- Do not use homepage display scale wholesale inside dense app surfaces.

### Color

Primary source signals:

- Burgundy: `#9D2235`
- Dark burgundy: `#641320`
- Charcoal: `#212121`
- Near black navigation/text: `#141b22`
- Warm grey background: `#F3F3F3`
- White surfaces: `#fff`
- Muted body text: `#666`
- Pale burgundy highlight: `#9D22351C`

Learning-platform implication:

- Derive app-safe brand tokens from burgundy and charcoal.
- Use warm grey/off-white public surfaces.
- Keep app surfaces calmer and more neutral than the homepage.
- Reduce the older bright blue/teal foundation tokens over time.

### Buttons

Main website button signals:

- Square or nearly square button shape.
- Burgundy fill.
- Charcoal hover.
- Uppercase, 14px, semibold text.
- Large horizontal and vertical padding.
- Plus icon before label in many CTAs.

Learning-platform implication:

- Buttons should become more restrained and brand-aligned.
- Do not force uppercase globally in the product app; this can hurt forms and multilingual UI.
- Use stronger square/low-radius public/auth CTAs where appropriate.
- Keep app action buttons compact, readable, and accessible.

### Layout and spacing

Main website layout signals:

- Public sections frequently use `pt-120 pb-120`.
- Homepage hero uses a split editorial composition with large display type and a large visual.
- Program sections use wide cards/tiles and generous gutters.
- There is strong contrast between editorial public surfaces and dense content blocks.

Learning-platform implication:

- Homepage can inherit larger section rhythm.
- Login/register can use branded whitespace and lighter card framing.
- Dashboards and chat should remain tighter and app-like.
- Parent report can borrow editorial sectioning without becoming a marketing page.

### Cards and surfaces

Observed source cards include:

- Dark charcoal education tile.
- Burgundy feature tile.
- White tile with subtle borders.
- Service boxes with heavy padding.
- Some rounded containers at 5px to 10px, but many buttons and sections use square edges.

Learning-platform implication:

- Reduce generic SaaS card feel with warmer surfaces, subtler borders, and restrained shadows.
- Use burgundy/charcoal as accents, not large dashboard floods.
- Keep dashboard cards stable and scannable.

### Imagery

The source site uses real education photography:

- Students studying.
- Teachers helping students.
- Parent/child homework scenes.
- Classroom and tutoring imagery.

Learning-platform implication:

- Homepage and auth imagery should feel education-specific, not abstract SaaS.
- App surfaces should use image treatment sparingly.
- Do not copy image assets from the source project.

## Current Learning Platform Signals

Relevant inspected files:

- `src/index.css`
- `src/styles/stoa-theme.css`
- `src/styles/premium-theme.css`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/home/HomeHero.tsx`

Current platform state:

- Base `stoa-theme.css` still defines bright blue/teal tokens.
- `premium-theme.css` already introduced warmer ivory, navy, muted sage, and gold.
- Home hero already uses editorial heading helpers and German stacked title support.
- UI primitives still use shadcn-style rounded cards/buttons and generic shadows.
- Public/auth pages have stronger brand potential than dense app pages.

## Translation Direction

The correct relationship is:

```text
Same brand family, different product surface.
```

Shared signals:

- Premium education tone.
- Editorial display rhythm on public/report surfaces.
- Warm neutral page backgrounds.
- Restrained burgundy/charcoal accents.
- Trustworthy, non-flashy controls.
- Real learning context rather than abstract SaaS decoration.

Different signals:

- Dashboards need higher information density.
- Chat needs clear interaction states.
- Forms need obvious labels, focus, validation, and pending states.
- Billing/pricing must preserve Phase 18 product-safe copy and boundaries.
- App pages must not look like marketing sections.

## Implementation Risks

- Directly copying `newweb` CSS would introduce unrelated static-site assumptions and violate the milestone boundary.
- Applying Prata-sized headings everywhere would damage dashboard/chat usability.
- Converting all buttons to uppercase could hurt multilingual readability.
- Heavy burgundy usage could make status states less clear and visually aggressive.
- Changing global tokens without testing EN/DE/FR/IT could regress Phase 17 layout stability.
- Replacing components broadly before token design would create a large blast radius.

## Recommended Planning Sequence

1. Finish source audit and design translation docs.
2. Propose derived learning-platform tokens.
3. Apply theme layer carefully and verify public/app split.
4. Refine shared components after token direction is explicit.
5. Align homepage/auth surfaces first.
6. Align chat/dashboard/report/pricing/billing with app-safe constraints.
7. Run visual compatibility QA and build checks.

## Open Questions For Later Phases

- Whether to use CSS imports for a web font in the learning platform or rely on system/serif fallbacks.
- Whether public/auth CTAs should use lower radius than app CTAs.
- Whether report pages should get a dedicated editorial report style wrapper.
- Whether visual QA should use Playwright screenshots in Phase 112 or manual browser evidence only.
