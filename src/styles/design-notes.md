# STOA Design Notes

## Source

Reference project: STOA main website translation notes in `docs/design/main-website-design-translation.md`.

## Colors

- Primary: STOA burgundy for high-confidence brand actions and active navigation.
- Strong neutral: charcoal and ink for app chrome, headings, and high-contrast text.
- Background: warm paper with subtle sage influence on deep page backgrounds to avoid a flat beige system.
- Card surface: warm off-white, used for repeated modules, status panels, forms, and reports.
- Accent: restrained sage for secondary learning-support cues; gold is reserved for warning/readiness states.
- Text main: near-black warm ink.
- Text muted: warm gray with enough contrast for descriptions and metadata.

## Typography

- Body: one body font family for paragraphs, lists, descriptions, metadata, and long-form copy.
- Heading: one heading/display font family for page titles, section titles, cards, and editorial headings.
- Navigation: one nav font family for marketing and app navigation.
- Button: one button font family for all button variants, with medium weight and no negative letter spacing.
- Input: one input font family for text fields, textareas, selects, and their labels.
- Mono: reserved only for code, JSON, logs, or technical previews.

Typography is deployed through global role classes:

- `.stoa-type-body`
- `.stoa-type-heading`
- `.stoa-type-display`
- `.stoa-type-nav`
- `.stoa-type-button`
- `.stoa-type-input`
- `.stoa-type-label`

Shared components should attach the matching role class directly instead of relying only on element selectors.

## Components

### Button

Buttons use 8px or smaller radius, a burgundy filled primary state, and quieter outline/ghost states. Hover states should darken toward charcoal or soft burgundy, not introduce unrelated bright colors.

### Card

Cards are reserved for repeated content modules, forms, reports, and status panels. Keep radius restrained, shadows subtle, and avoid wrapping whole page sections in nested cards.

### Navbar

Marketing navigation stays editorial and brand-forward. App navigation stays denser, role-aware, and operational with burgundy active states.

### Hero Section

Public heroes can use editorial heading scale, STOA imagery, and generous spacing. App and dashboard surfaces should remain structured, calm, and ready for repeated use rather than marketing-heavy.
