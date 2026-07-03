# Student Conversational Entry Prototype Summary

## Status

Complete.

## Changes

- Added a separate `/assistant` student route for the conversational entrance prototype.
- Moved `/assistant` outside protected student routes so the design prototype can be previewed without account hydration.
- Built a Chat-first student workspace with intent chips, voice affordance, tool menu, inline practice, and tutor booking dialog.
- Moved visible intent shortcuts and tool status out of the main canvas so student actions live behind the input `+` menu.
- Kept the existing classic Dashboard, Practice, Library, Chat, and Classroom routes intact.
- Added `/assistant` to the student login redirect allowlist so protected-route login can return to the new entry.

## Verification

- `npm run lint`
- `npm run build`
- Playwright desktop smoke on `/assistant`, including tutor intent and booking dialog.
- Playwright mobile smoke on `/assistant` at 390px width with no horizontal overflow.
- Playwright no-auth smoke on `/assistant` confirming it no longer shows `Loading account...`.
- Playwright smoke confirming default `/assistant` no longer shows visible intent cards and the input `+` menu still opens tool actions.
