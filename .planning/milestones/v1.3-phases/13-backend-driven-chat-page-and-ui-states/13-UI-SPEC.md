# UI Spec: Phase 13 Backend-Driven Chat Page and UI States

**Generated:** 2026-05-24
**Design Skill:** frontend-design

## Direction

Quiet learning cockpit. The chat should feel like a dependable study workspace: calm, compact, legible, and direct. The memorable quality is not decoration; it is that every backend state is clear without disrupting the learning flow.

## Visual Rules

- Preserve the existing STOA app shell and chat layout.
- Use existing UI primitives, Tailwind tokens, and lucide icons.
- Keep cards only for individual framed tools like teacher escalation.
- Do not introduce broad palette changes, hero sections, gradients, or decorative backgrounds.
- Keep text concise and sized for a dense tool surface.
- Ensure buttons and text cannot overflow on mobile or desktop.

## Required States

- Conversation list loading: centered `LoadingState`.
- Conversation list error: centered `ErrorState` with "Failed to load conversations."
- Conversation list empty: centered `EmptyState` with "No conversations yet."
- Conversation detail loading: main area `LoadingState`.
- Conversation detail error: main area `ErrorState` with "Failed to load this conversation."
- Empty messages: main area `EmptyState` with "No messages yet."
- Send pending: disabled input/button and assistant thinking indicator.
- Send error: inline error near the input/teacher section.
- Teacher-help pending: disabled request button with pending label.
- Teacher-help success/error: inline compact feedback near the teacher card.

## Accessibility and Interaction

- Disabled controls must use native `disabled`.
- Action buttons keep accessible labels.
- Empty/error/loading states should remain visible in the keyboard navigation flow.
- Avoid focus traps; no modal/drawer work in this phase.

## Non-Goals

- Streaming animation beyond existing assistant thinking.
- Mobile sidebar drawer.
- Toast system.
- Full redesign of chat visual language.
