---
status: complete
created: "2026-05-27"
task: "Fix chat teacher availability status"
---

# Quick Task: Fix Chat Teacher Availability Status

## Goal

Stop Chat from showing a teacher as online when there is no real teacher presence signal.

## Scope

- Change teacher availability demo fallback from online to offline.
- Keep teacher-help request flow available, but do not imply live teacher presence.
- Restore student login redirect support for `/chat`.
- Verify Chat header no longer says a teacher is online in local demo mode.

## Verification

- `npm run lint`
- `npm run build`
- Browser check `/chat` with student account.

## Result

Complete. Local/demo Chat now reports no teacher online unless the backend provides an online teacher availability signal, and student `next=/chat` redirects are allowed again.
