# Analytics Operations

## Delivery

Pilot analytics events are emitted through `trackEvent()` in `src/services/analytics/analyticsClient.ts`.

- Enabled analytics posts events to `POST /analytics/events`.
- `VITE_ENABLE_ANALYTICS=true` enables network delivery.
- In development, analytics calls log sanitized event payloads to the console for local verification.
- When analytics is disabled, the client does not send network requests.
- Delivery uses a fire-and-forget fetch path. Failures are caught and must not block chat, upload, report, tutor, feedback, support, or navigation flows.

## Pilot Event List

| Event | Purpose | Expected payload fields |
| --- | --- | --- |
| `user_login` | Login funnel review | `role`, `userId` |
| `user_register` | Registration funnel review | `role`, `userId` |
| `chat_conversation_created` | Chat adoption and subject usage | `conversationId`, `subject`, `grade` |
| `chat_message_sent` | Chat engagement volume | `conversationId`, `hasAttachments` |
| `chat_response_started` | Assistant response start tracking | `conversationId` |
| `chat_response_completed` | Assistant response completion tracking | `conversationId` |
| `chat_response_stopped` | User-stopped response tracking | `conversationId` |
| `file_uploaded` | Upload usage and file type review | `fileId`, `mimeType`, `sizeBytes` |
| `teacher_help_requested` | Teacher help demand | `requestId`, `conversationId`, `status` |
| `teacher_help_assigned` | Teacher help assignment review | `requestId`, `tutorId` |
| `teacher_help_resolved` | Teacher help resolution review | `requestId` |
| `parent_child_summary_viewed` | Parent summary engagement | `studentId` |
| `parent_report_viewed` | Parent report engagement | `studentId`, `reportId` |
| `tutor_request_opened` | Tutor workflow engagement | `requestId` |
| `tutor_request_status_updated` | Tutor workflow status movement | `requestId`, `status` |
| `tutor_note_added` | Tutor documentation activity | `requestId` |
| `feedback_submitted` | Feedback volume by source | `type`, `page`, `userRole` |

The backend may attach authenticated `user_id` and `role` from the bearer token. The client also includes `path`, `sessionId`, and `createdAt` metadata with each delivered event.

## Payload Rules

Analytics payloads are metadata only.

- Do not include full chat prompts, assistant responses, feedback messages, tutor note text, file contents, file names, transcripts, or raw attachment objects.
- Prefer stable identifiers, booleans, counts, status values, roles, grades, subjects, MIME types, and byte sizes.
- Long strings are truncated by the analytics client before delivery.
- Arrays are reduced to their length.
- Objects are dropped unless represented by explicit safe metadata fields.
- Payload keys associated with content, including `content`, `message`, `messages`, `note`, `prompt`, `response`, `text`, `transcript`, `file`, `fileContent`, `fileName`, `attachment`, and `attachments`, are removed by the client.

## Failure Behavior

Analytics delivery is non-critical telemetry. Product workflows must continue when analytics is disabled, unavailable, slow, unauthorized, or rejected by the backend. The analytics client does not throw to callers and does not use shared API response interceptors that can redirect the user on analytics-only failures.
