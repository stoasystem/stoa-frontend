---
status: investigating
trigger: "Browser review on /chat: New conversation button icon is unusually small."
created: "2026-05-26"
updated: "2026-05-26"
---

# Debug Session: chat-new-conversation-icon

## Symptoms

- Expected behavior: The New conversation button icon should read as a normal toolbar icon and match the button size.
- Actual behavior: The icon inside the New conversation button appears unusually small in the Chat sidebar.
- Error messages: None.
- Timeline: Found during Phase 23 public demo manual browser review.
- Reproduction: Open `http://127.0.0.1:5173/chat` and inspect the sidebar New conversation button.

## Current Focus

- hypothesis: Icon CSS or component sizing is too small for the button.
- test: Inspect Chat page component and relevant styles, then verify computed/icon dimensions after fix.
- expecting: New conversation icon is visually legible and aligned in a stable square button.
- next_action: Locate the button implementation and size rule.

## Evidence

- 2026-05-26: `ConversationSidebar`, `NewConversationButton`, and mobile `ChatHeader` all rendered `MessageSquarePlus` at `h-4 w-4` inside a `h-10 w-10` icon button.
- 2026-05-26: Playwright computed the updated sidebar button as 40x40 but the SVG as 6x20. The root cause was the shared `Button` base class keeping `px-4 py-2`; the icon size variant set width/height but did not remove padding, so flexbox compressed the SVG.
- 2026-05-26: After the shared button fix, Playwright computed the sidebar button as 40x40 and the SVG as 20x20.

## Eliminated

## Resolution

- root_cause: The icon-only button size inherited regular button padding, leaving only a narrow content box and compressing the SVG width.
- fix: Moved default button padding out of the base class and made `size="icon"` use `p-0`; also kept the New conversation icon at 20px with `shrink-0` and a slightly stronger stroke.
- verification: `npm run lint`, `npm run build`, and authenticated Playwright `/chat` dimension check passed.
