# Screen Reader Smoke Test

## Phase 120 Source Checks

| Surface | Screen Reader Consideration | Status |
| --- | --- | --- |
| Marketing pages | Header, main, and footer landmarks are present through layout components. | Pass by source inspection. |
| Footer | Legal navigation has an accessible label; contact information is inside semantic `address`. | Pass. |
| Login | Inputs have labels; field errors are linked with `aria-describedby`; errors use `role="alert"`. | Improved. |
| Register | Role group has an accessible label and selected role state; form errors use `role="alert"`. | Improved. |
| Chat | Message list is a polite log region; message items are labelled; input has an accessible label. | Improved. |
| Teacher request | Button exposes pending state with `aria-busy`; icon is decorative. | Improved. |
| Contact | Success uses `role="status"` and `aria-live="polite"`; errors use alerts. | Pass. |
| Support | Required-field errors are associated with fields and announced. | Improved. |

## Manual Screen Reader Checklist

Use VoiceOver on macOS or NVDA/JAWS on Windows for the next rendered pass:

- Page title and first `h1` make sense.
- Header navigation is announced as navigation.
- Footer legal links are announced as a labelled navigation region.
- Login field errors are read after failed submit.
- Register role selection announces selected state.
- Chat messages are not over-announced while typing.
- Contact success is announced after submission.

## Limitations

The current environment blocked headless browser launch, so this document records source-level and implementation smoke checks. Full assistive technology verification remains a manual release-gate item.
