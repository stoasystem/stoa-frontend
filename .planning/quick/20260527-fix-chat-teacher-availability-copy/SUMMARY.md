---
status: complete
completed: "2026-05-27"
task: "Fix chat teacher availability status"
---

# Summary

Fixed the Chat teacher availability indicator so local/demo mode no longer claims a teacher is online when there is no real teacher presence signal.

## Changes

- Changed teacher availability fallback from `online: true` to `online: false`.
- Set fallback available teacher count to `0`.
- Kept request flow available without implying live teacher presence.
- Added `/chat` back to student login redirect allow-list.

## Verification

- `npm run lint`
- `npm run build`
- Playwright student login with `/login?next=/chat`
- Confirmed `/chat` displays `No teacher online` and does not display `Teacher online`
