# Research: v2.3 Live Classroom Stack

## Scope

Research question: what stack additions or architectural seams are needed for a frontend/mock online classroom and future video-provider integration?

## Current Stack Fit

The existing React + TypeScript + Vite app is sufficient for v2.3 because the milestone is UI plus mock/demo state. No real WebRTC SDK should be added yet. The existing patterns already cover the needed foundations:

- React Router routes for role-specific student, parent, tutor, and admin surfaces.
- TanStack Query for mock/service async data.
- Zustand/local React state for UI-only toggles.
- Existing upload feature module for classroom materials.
- Existing i18n setup for English, German, French, and Italian.
- Existing Playwright E2E for route-level smoke coverage.

## Future Video Provider Options

The v2.3 code should preserve a provider-neutral boundary rather than committing to a vendor.

| Provider | Research signal | Implication for v2.3 |
|----------|-----------------|----------------------|
| LiveKit | Official React components include a ready-made `VideoConference` and lower-level layout/control components. Source: https://docs.livekit.io/reference/components/react/component/videoconference/ | Keep room UI layout independent so a future adapter can mount media tracks inside STOA-designed tiles rather than replacing the whole classroom. |
| Twilio Video | Official docs describe browser SDK rooms, local media, remote participants, and the need for backend access tokens. Source: https://www.twilio.com/docs/video/javascript | Do not implement provider calls in frontend-only milestone; future real integration needs backend token and room creation endpoints. |
| Daily | Docs distinguish Prebuilt UI from custom UI through call-object primitives. Source: https://docs.daily.co/get-started and https://docs.daily.co/guides/products/prebuilt/customizing-daily-prebuilt | v2.3 should not depend on a prebuilt generic meeting UI if STOA needs a learning-specific classroom layout. |

## Recommended v2.3 Stack Decision

No new runtime dependency for real-time media. Add only app-native TypeScript contracts and mock services:

- `src/features/live-classroom/types/liveClassroom.ts`
- `src/features/live-classroom/data/liveClassroomMockData.ts`
- `src/features/live-classroom/services/liveClassroomService.ts`
- `src/features/live-classroom/hooks/*`
- `src/features/live-classroom/components/*`

Reserve a future boundary:

```ts
type VideoProviderAdapter = {
  joinRoom: (sessionId: string) => Promise<void>
  leaveRoom: () => Promise<void>
  toggleMicrophone: () => Promise<void>
  toggleCamera: () => Promise<void>
}
```

## Accessibility Stack

Use existing UI primitives for dialogs/tabs where possible. WAI-ARIA APG modal dialog guidance requires focus to move into the dialog, Tab/Shift+Tab to remain inside, and focus to return intentionally after close. Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

## Stack Non-Goals

- No WebRTC SDK.
- No video SDK dependency.
- No real device stream.
- No real recording/transcript stack.
- No real whiteboard engine.
- No calendar/scheduling SDK.
- No billing integration.
