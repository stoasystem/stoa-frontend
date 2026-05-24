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
