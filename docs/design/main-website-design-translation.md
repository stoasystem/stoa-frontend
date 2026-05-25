# Main Website Design Translation

**Phase:** 19 / v1.18
**Source project:** `/Users/zhdeng/newweb`
**Target project:** `/Users/zhdeng/stoa-frontend`

## Source Project

The source project is the company homepage located at:

```text
/Users/zhdeng/newweb
```

It is read-only for Phase 19. It is used to understand STOA's company-level design language. It is not a source for copied CSS, components, images, or scripts.

## Design Relationship

The correct relationship is:

```text
Same brand family, different product surface.
```

The learning platform should feel like it belongs to STOA, but it should not look like a direct copy of the company homepage. It is an app surface with repeated use, dense workflows, role-specific dashboards, chat, billing, and reports.

## Main Website Visual Summary

The homepage reads as a premium education brand site:

- Editorial, magazine-like headings.
- Warm neutral page sections.
- Burgundy and charcoal as the main brand anchors.
- Large section spacing.
- Clear real-world education photography.
- Restrained CTAs that feel institutional rather than SaaS-heavy.
- A short, stacked hero headline style.
- Service cards with strong color-block contrast.

## Extracted Design Signals

### Color Signals

| Source signal | Observed value | Learning platform translation |
|---------------|----------------|-------------------------------|
| Burgundy | `#9D2235` | Main brand accent and primary public CTA signal |
| Dark burgundy | `#641320` | Deep accent for hover, focus, or report emphasis |
| Charcoal | `#212121` | App navigation, headings, strong surfaces |
| Near black | `#141b22` | Text/control contrast |
| Warm grey | `#F3F3F3` | Public/auth/report page background family |
| White | `#fff` | Card and form surface |
| Muted grey | `#666` | Secondary text family |
| Pale burgundy | `#9D22351C` | Editorial highlight or underline accent |

The learning platform should derive app tokens from these signals instead of pasting the exact source system everywhere.

### Typography Signals

Source:

- `Prata` for display headings.
- `Inter` for body/UI.
- 50px editorial section headings.
- 14px uppercase section labels.
- Stacked short hero lines.

Learning platform translation:

- Public surfaces may use editorial display headings.
- App surfaces should use UI typography for repeat readability.
- Parent report can use editorial section headers.
- Chat, dashboards, admin, and forms should not use large decorative type.
- German, French, and Italian layout safeguards must remain intact.

### Spacing and Layout Signals

Source:

- 120px section vertical rhythm.
- Split hero with large visual.
- Wide service grids.
- Large content gaps.

Learning platform translation:

- Homepage can use a generous public rhythm.
- Login/register can use trust-building whitespace.
- Parent report can use editorial report spacing.
- Chat and dashboard must stay denser and operational.
- Billing/pricing should balance brand feel with clear plan comparison.

### Component Style Signals

Buttons:

- Source uses burgundy fill, charcoal hover, square radius, 14px semibold text, generous padding, and icon-led CTAs.
- Translation should make public/auth CTAs more brand-specific, but not force uppercase or square shape everywhere.

Cards:

- Source uses dark, burgundy, and white tiles with heavy padding and limited ornament.
- Translation should make app cards warmer, calmer, and less generic without losing scannability.

Badges:

- Source uses burgundy accents rather than bright status colors.
- Translation should make status badges calmer but still immediately understandable.

Navigation:

- Source navigation is brand/editorial.
- Translation should keep learning-platform navigation product-like and role-aware.

### Image and Editorial Signals

Source imagery is direct education photography:

- Students studying.
- Teachers helping.
- Parent-child homework contexts.
- Classroom and tutoring scenes.

Translation:

- Public and auth surfaces should use education-specific image mood.
- Dashboard/chat should use visual restraint.
- No source image asset should be copied into the learning platform.

## What Should Be Shared

The learning platform should share:

- STOA's premium education tone.
- Burgundy and charcoal brand anchors.
- Warm neutral surfaces.
- Editorial heading energy on public/auth/report surfaces.
- Restrained button confidence.
- Real learning context.
- Calm, trustworthy visual hierarchy.

## What Should Remain Different

The learning platform should remain different in:

- Information density.
- Repeated-use app ergonomics.
- Chat readability and interaction states.
- Dashboard scannability.
- Form affordances and validation clarity.
- Billing/pricing comparison clarity.
- Role-based navigation.
- Admin/support operational surfaces.

## What Not To Copy

Do not copy:

- `/Users/zhdeng/newweb/css/style.css`
- `/Users/zhdeng/newweb/css/default.css`
- Static homepage HTML.
- JavaScript effects.
- Image assets.
- Exact homepage button behavior globally.
- Exact 120px spacing in app surfaces.
- Exact display typography scale for dashboards/chat.

## Learning Platform Adaptation Rules

### Homepage

- Closest surface to the company homepage.
- Use editorial type, warm background, and brand CTA treatment.
- Keep the learning platform hero direct and usable.
- Do not recreate the company homepage hero exactly.

### Login and Register

- Use brand warmth and trust.
- Keep forms clear, compact, and stable.
- Use lighter card framing.
- Avoid excessive marketing whitespace on small screens.

### Chat

- Use subtle burgundy or charcoal accents.
- Keep message bubbles readable.
- Keep input and teacher-support actions obvious.
- Do not use decorative display typography in the conversation area.

### Student Dashboard

- Use translated cards and headings.
- Keep information dense enough for repeated use.
- Avoid large decorative sections.
- Use accent color sparingly for progress and next actions.

### Parent Dashboard and Parent Report

- Dashboard should remain practical.
- Report can be more editorial and premium.
- Use calm sectioning, restrained charts, and warm surfaces.
- Avoid anxious or sales-heavy visual emphasis.

### Pricing and Billing

- Preserve Phase 18 product-safe copy and payment-readiness boundaries.
- Use warm cards and restrained CTA treatment.
- Keep plan comparison clear.
- Do not make billing look like a campaign landing page.

### Tutor, Support, Admin

- Apply token-level consistency and calmer cards.
- Keep workflow clarity primary.
- Do not over-decorate operational pages.

## Token Adjustment Suggestions

Proposed token families for Phase 109:

- `brand.base`: derived burgundy, app-safe and accessible.
- `brand.strong`: deeper burgundy for hover/focus/emphasis.
- `brand.soft`: pale burgundy highlights.
- `neutral.strong`: charcoal text and app navigation.
- `surface.page`: warm off-white public/app page base.
- `surface.card`: white or warm card surface.
- `surface.muted`: warm grey section surface.
- `text.primary`: charcoal.
- `text.secondary`: muted grey with sufficient contrast.
- `border.subtle`: warm neutral border.
- `interactive.primary`: brand burgundy or charcoal depending on context.
- `interactive.hover`: dark burgundy or charcoal.

Phase 109 should evaluate whether these live in `src/styles/brand-tokens.css`, `src/styles/platform-theme.css`, or a consolidated theme file.

## Component Adjustment Plan

Recommended order:

1. Token definitions and theme import order.
2. Button variants.
3. Card primitive.
4. Badge primitive and status variants.
5. Input/textarea/select focus and border treatment.
6. PageHeader and SectionHeader.
7. Chat bubbles and teacher-support action cards.
8. Pricing, billing, and report cards.

## QA Checklist

- [ ] Source project remains unmodified.
- [ ] No copied homepage files or assets.
- [ ] Homepage feels aligned with STOA brand.
- [ ] Auth surfaces feel premium and trustworthy.
- [ ] Chat remains usable and app-like.
- [ ] Dashboards remain clear and practical.
- [ ] Parent report feels like a high-quality education service report.
- [ ] Pricing and billing remain clear and product-safe.
- [ ] German stacked hero and long-label safeguards still work.
- [ ] English, German, French, and Italian P0 layouts remain stable.
- [ ] Mobile P0 layouts remain stable.
- [ ] Build passes after visual changes.

## Before/After QA Notes To Capture Later

Phase 112 should record:

- Company homepage reference screenshot or inspected state.
- Learning platform homepage screenshot.
- Register/onboarding screenshot.
- Chat screenshot.
- Parent report screenshot.
- Pricing or billing screenshot.
- Brand similarity rating.
- Product independence rating.
- Visual quality rating.
- Multilingual/mobile regression notes.
