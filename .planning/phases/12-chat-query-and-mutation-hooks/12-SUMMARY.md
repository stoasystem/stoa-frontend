---
requirements_completed:
  - QRY-01
  - QRY-02
  - QRY-03
  - QRY-04
  - QRY-05
  - QRY-06
---

# Phase 12 Summary: Chat Query and Mutation Hooks

**Completed:** 2026-05-24
**Status:** Complete

## Delivered

- Added centralized `chatQueryKeys`.
- Added `useConversationsQuery` and `useConversationQuery`.
- Added `useCreateConversationMutation` with list/detail cache seeding.
- Added `useSendMessageMutation` with list/detail invalidation.
- Added `useTeacherHelpMutation`.

## Verification

- `npm run build` passed.
- `npm run lint` passed.
- Hooks live under `src/hooks/chat/` and do not depend on mock data.
