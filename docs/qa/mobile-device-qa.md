# Mobile Device QA

## Width Matrix

| Width | Target | Status |
| --- | --- | --- |
| 375px | Small phone | Pending rendered manual check |
| 390px | iPhone class | Pending rendered manual check |
| 430px | Large phone | Pending rendered manual check |
| 768px | Tablet | Pending rendered manual check |
| 1024px | Small desktop/tablet landscape | Pending rendered manual check |

## P0 Pages

- Homepage
- Register
- Chat
- Parent report
- Pricing
- Contact

## Checks

- Navbar wraps without overlap.
- Logo remains legible.
- Footer contact information stacks cleanly.
- Contact form fields and selects are usable.
- Chat input is not obstructed.
- Register role cards and step controls remain reachable.
- Pricing cards do not overflow in English, German, French, or Italian.
- Language switcher remains keyboard/touch operable.

## Phase 121 Status

Automated Playwright smoke covers desktop Chromium. Mobile browser visual verification remains a manual release-gate item because the current automated project matrix does not include mobile device projects.
