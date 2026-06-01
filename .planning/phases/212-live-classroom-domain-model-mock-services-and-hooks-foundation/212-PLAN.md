# Phase 212 Plan

## Goal

Create a provider-neutral live classroom feature foundation for later student, tutor, parent, and Chat escalation UI.

## Tasks

- Add classroom session, participant, material, message, note, queue, and input types.
- Add deterministic mock sessions covering scheduled, instant, and completed classroom states.
- Add async mock services for home, session lookup, scheduling, instant help, lobby/room lifecycle, tutor queue, and notes.
- Add TanStack Query hooks plus local room UI state hooks.
- Keep real video provider, WebRTC, and browser media stream APIs out of scope.
