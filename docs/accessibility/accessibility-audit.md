# Accessibility Audit

## Scope

P0 routes reviewed for Phase 21:

- `/`
- `/login`
- `/register`
- `/chat`
- `/parent`
- `/parent/children/:childId/report`
- `/tutor`
- `/pricing`
- `/billing`
- `/contact`
- `/support`

## Method

- Source audit of headings, landmarks, controls, labels, error states, and icon-only buttons.
- Build verification with TypeScript.
- Browser automation with headless Chromium was attempted but blocked by local macOS sandbox Mach port permissions. Full rendered axe-style checks are deferred to the Phase 121 QA documentation.

## Findings And Fixes

| Area | Finding | Fix |
| --- | --- | --- |
| Global focus | Links did not have a consistent platform-level visible focus fallback. | Added global `:focus-visible` outline coverage for links, buttons, inputs, textareas, selects, and role buttons. |
| Register role selection | Role cards were clickable buttons but did not expose selected state. | Added grouped label and `aria-pressed` selected state; icons marked decorative. |
| Register errors | Registration validation messages were visual only. | Added `role="alert"` to validation and mutation error messages. |
| Login errors | Field errors were not connected to inputs. | Added `aria-invalid`, `aria-describedby`, and alert roles for login errors. |
| Chat input | Main chat textarea and empty-state textarea relied on placeholders. | Added localized `aria-label` strings. |
| Chat message list | New messages were visually appended without a screen-reader announcement region. | Added `role="log"`, localized label, `aria-live="polite"`, and relevant additions. |
| Chat messages | Message groups lacked a concise accessible label. | Wrapped messages in labelled `article` elements. |
| Teacher request action | Pending state was visual only. | Added `aria-busy` while sending and marked icon decorative. |
| Support request form | Required field errors were not associated with the fields. | Added invalid/described-by wiring and alert role. |
| Contact form | New Phase 119 form already includes labels, validation alerts, pending disabled state, and success status region. | No additional code change required in Phase 120. |

## Current Status

Phase 120 improves the most visible accessibility gaps without changing product scope. Remaining release work is to run rendered browser checks with axe or an equivalent browser tool once the local environment allows browser automation.
