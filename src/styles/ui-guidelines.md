# Shared UI Guidelines

## Page Structure

- Use `PageContainer` inside application layouts when a page needs a consistent content rail, padding, and vertical rhythm.
- Use `PageHeader` for top-level page titles, optional descriptions, and compact right-aligned actions.
- Use `SectionHeader` above grouped content when a card title is not enough context.

## Loading Feedback

- Prefer skeletons over plain loading text for page-level data loads.
- Use feature skeletons when the loaded shape is known, such as dashboard cards, chat panes, parent child cards, and tutor request rows.
- Keep skeleton dimensions stable so content does not jump when data arrives.

## Visual Tone

- Match the local Tailwind and shadcn-style primitives: restrained radius, subtle borders, muted loading blocks, and compact type.
- Cards should frame repeated modules or status panels, not whole page sections.
- Keep copy functional and brief; avoid instructional text inside the application chrome.
- Use the active STOA brand tokens from `brand-tokens.css`: burgundy for primary/action emphasis, charcoal/ink for authority, warm card surfaces, and sage/gold only for secondary semantic cues.
- Keep typography consistent by role, not globally identical: body text uses `--font-body`, headings use `--font-heading`, navigation uses `--font-nav`, buttons use `--font-button`, and form fields/labels use `--font-input`.
- Public/auth/report pages may use `.editorial-heading` for scale and rhythm, but it should still resolve through the shared heading token instead of an ad hoc component font.
- Attach role classes in shared components: `.stoa-type-heading` for titles, `.stoa-type-body` for descriptions, `.stoa-type-nav` for navigation links, `.stoa-type-button` for button-like controls, `.stoa-type-input` for fields, and `.stoa-type-label` for labels, badges, and compact UI labels.
- Avoid adding new ad hoc blue, purple, or saturated Tailwind color families unless they are semantic status states and still pass contrast.
