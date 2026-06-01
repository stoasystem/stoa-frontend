# Research: v2.3 Live Classroom Pitfalls

## Scope

Research question: what mistakes are common when adding live classroom/video help UI to an education app?

## Pitfall 1: Building a Generic Meeting Clone

Meeting products prioritize participants, media controls, and screen sharing. Tutoring products prioritize the learning object: question, worksheet, explanation, whiteboard, notes, and next steps. Lessonspace's positioning around subject-specific tools, whiteboards, documents, and shared notes is the stronger analogy for STOA than a pure meeting room. Source: https://www.thelessonspace.com/

Prevention:

- Make learning workspace a first-class region, not an optional tab.
- Show context source, problem, materials, and notes in room/lobby/summary.
- Use classroom/tutor language, not generic meeting language.

## Pitfall 2: Overpromising Real Video

Twilio and LiveKit docs show real video apps involve rooms, participants, tracks, controls, and often backend token/session work. Daily similarly separates prebuilt UI from custom call primitives. Sources: https://www.twilio.com/docs/video/javascript, https://docs.livekit.io/reference/components/react, https://docs.daily.co/get-started

Prevention:

- Use video placeholders and mock connection states.
- Explicitly document no real WebRTC/video provider integration in v2.3.
- Avoid copy such as "connected securely", "recording", "screen sharing", or "camera preview live" unless implemented.

## Pitfall 3: Weak Lobby and Safety Model

Zoom, Teams for Education, and Google Meet research all emphasize host/teacher controls, waiting rooms/lobbies, chat/audio/video moderation, and safe meeting close. Sources: https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0059359, https://support.microsoft.com/en-us/teams/education/quick-start/set-up-meeting-roles-and-safety, https://support.google.com/meet/answer/16229038

Prevention:

- Add a lobby before the room.
- Show waiting/unavailable/open states.
- Give tutor pages context review before room join.
- Keep student "Leave" separate from tutor "End Session".

## Pitfall 4: Mobile Room Layout Collapse

Desktop meeting layouts often rely on a large horizontal canvas plus right panel. On mobile this becomes cramped and inaccessible.

Prevention:

- Desktop: video + learning workspace + side panel + bottom controls.
- Mobile: single-column video/workspace and drawer or bottom-sheet panels.
- Do not force right-side panels on narrow screens.

## Pitfall 5: Inaccessible Controls

Classroom controls are stateful and high-frequency. WAI-ARIA dialog guidance also requires controlled focus behavior for leave/end dialogs. Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

Prevention:

- Every icon control has visible text or `aria-label`.
- Mute/camera state is expressed in text, not color alone.
- Side panel tabs are keyboard reachable.
- Leave/end dialogs trap focus and return focus.
- Status changes use live regions.

## Pitfall 6: Confusing AI, Tutor, and Classroom Roles

If the Learning Assistant remains active while a tutor is teaching, the user may not understand who is helping.

Prevention:

- Preserve support ladder: Learning Assistant -> tutor text -> live classroom.
- When tutor text is active, communicate that the Learning Assistant is observing.
- Do not add AI-in-classroom behavior in v2.3.

## Pitfall 7: Duplicating Upload UI

v2.2 already created upload validation, preview, status, and handoff components.

Prevention:

- Reuse `InlineUploadPanel`, `AttachmentPreviewList`, `UploadButton`, and upload metadata adapters.
- Do not create separate classroom-only attachment cards unless the shared component cannot satisfy the need.

## Pitfall Conclusion

The milestone should be judged less by media complexity and more by whether the mock classroom journey feels coherent, learning-specific, accessible, responsive, and future-provider-ready.
