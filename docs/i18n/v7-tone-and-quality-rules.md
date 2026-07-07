# v7 Tone And Quality Rules

**Date:** 2026-07-07
**Status:** Planning handoff

## Tone Principle

STOA should sound composed, precise, and warm. The model is Apple-like confidence: explain the product with restraint, let the experience carry the sophistication, and avoid anxious overclaiming.

## Role-Based Tone

### Public And Parent-Facing

Audience: Swiss parents, especially families that value education and are willing to invest without wanting a pushy, anxiety-driven product.

Tone:

- formal enough to feel trustworthy
- calm and clear
- premium but not self-important
- focused on transparency, learning progress, and confidence at home
- respectful of student independence

Language handling:

- German: use `Sie` / `Ihr Kind` in parent-facing public copy.
- French: use `vous` / `votre enfant`.
- Italian: use formal, natural parent-facing language.

Avoid:

- aggressive performance pressure
- fear-based school failure framing
- repeated "Swiss" claims
- repeated privacy claims that feel defensive
- loud AI claims

### Student-Facing

Audience: students using chat, practice, classroom, and library workflows.

Tone:

- direct
- warm
- clear
- focused on the next step
- not childish

Language handling:

- German: `du` is acceptable on student surfaces.
- French: `tu` is acceptable on student surfaces.
- Italian: `tu` is acceptable on student surfaces.
- If a route mixes parent and student contexts, prefer neutral phrasing over switching voice inside one panel.

Avoid:

- patronizing encouragement
- inflated praise
- instant-answer framing
- shame around mistakes

### Teacher/Tutor-Facing

Audience: tutors, teachers, and learning support staff.

Tone:

- professional
- efficient
- context-rich
- focused on student source, materials, request reason, and next action

Avoid:

- marketing copy
- vague emotional claims
- overly casual student language

### Admin/Ops-Facing

Audience: STOA operators and technical/maintenance users.

Tone:

- precise
- scannable
- operational
- stable labels over polished prose

Avoid:

- poetic language
- public marketing copy
- unclear abbreviations

## Locale Style Rules

### English

- Calm and premium.
- Prefer short sentence structure.
- Use education-centered wording.
- Do not overexplain product mechanics.

### German

- Concise and stable.
- Watch long compounds in nav, buttons, cards, and mobile panels.
- Prefer shorter alternatives where layout is tight.
- Parent public copy should use formal address.

### French

- Elegant and clear.
- Watch apostrophes and line breaks.
- Avoid literal English structure.
- Parent public copy should use formal address.

### Italian

- Natural and warm.
- Avoid inflated marketing adjectives.
- Watch CTA length on buttons and mobile chips.
- Parent public copy should be respectful and fluid.

## Quality Tiers

### P0 Launch Quality

Required for public, auth, Home V2, pricing, support, legal entry points, and core student workflows.

Definition:

- human-readable and natural in all four launch languages
- no obvious machine-translation structure
- no internal terms
- screenshot-reviewed on desktop and mobile
- long text fits without overlap
- CTAs are clear and tappable

### P1 Usable Quality

Required for parent, tutor/teacher, billing, support-ticket, organization, and core admin surfaces.

Definition:

- understandable and role-appropriate
- no broken layout
- no raw English leftovers in visible UI
- smoke-tested in all four launch languages
- exact legal nuance not required unless legal copy appears on the route

### P2 Coverage Quality

Required for deep admin, edge states, rare empty/error paths, and internal operational routes.

Definition:

- no runtime missing-key failures
- no obvious internal/development wording
- static key coverage passes
- route does not visually break in FR/IT

## Writing Rules

Use:

- concrete nouns
- short headings
- restrained body copy
- one clear action per CTA
- role-specific language

Avoid:

- "less guessing"
- unclear metaphors
- product bragging
- repeated privacy slogans
- repeated Swiss claims
- "AI" as the headline mechanism
- technical implementation language

## Layout Rules For Copy

- Buttons must fit the longest locale string or use a shorter approved translation.
- Navigation labels should be tested at desktop, tablet, and mobile widths.
- Cards must not rely on English text length.
- German, French, and Italian body copy should be written to the layout, not forced from English.
- Mobile menus must show the language chips without crowding Login.

## Legal Copy Boundary

Marketing/product copy may be elegant and restrained. Legal copy must be precise, complete, and marked for lawyer review where unresolved facts remain.
